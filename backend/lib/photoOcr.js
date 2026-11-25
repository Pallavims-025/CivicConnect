import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { createWorker, PSM } from 'tesseract.js';

const require = createRequire(import.meta.url);
const englishDataPath = resolve(dirname(require.resolve('@tesseract.js-data/eng/package.json')), '4.0.0_best_int');
const MAX_OCR_PIXELS = 50_000_000;

let workerPromise;
let ocrQueue = Promise.resolve();

export function parseGpsStampCoordinates(text) {
  const normalized = String(text || '').replace(/[\u00a0\r\t]+/g, ' ').replace(/\s+/g, ' ');
  const latitudeMatch = normalized.match(/\b(?:lat|latitude)\b\s*[:=]?\s*([+-]?\d{1,2}(?:\.\d+)?)(?:\s*°)?\s*([NS])?(?=\s|$|[,;])/i);
  const longitudeMatch = normalized.match(/\b(?:long|longitude|lon)\b\s*[:=]?\s*([+-]?\d{1,3}(?:\.\d+)?)(?:\s*°)?\s*([EW])?(?=\s|$|[,;])/i);
  if (!latitudeMatch && !longitudeMatch) return { status: 'NOT_FOUND' };
  if (!latitudeMatch || !longitudeMatch) return { status: 'INVALID' };

  const applyHemisphere = (raw, reference, negativeReference) => {
    let value = Number(raw);
    if (!Number.isFinite(value)) return null;
    if (reference) {
      const sign = negativeReference.includes(reference.toUpperCase()) ? -1 : 1;
      if (value !== 0 && Math.sign(value) !== sign && raw.startsWith('-')) return null;
      value = Math.abs(value) * sign;
    }
    return value;
  };
  const latitude = applyHemisphere(latitudeMatch[1], latitudeMatch[2], 'S');
  const longitude = applyHemisphere(longitudeMatch[1], longitudeMatch[2], 'W');
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
    || (latitudeMatch[2] && !['N', 'S'].includes(latitudeMatch[2].toUpperCase()))
    || (longitudeMatch[2] && !['E', 'W'].includes(longitudeMatch[2].toUpperCase()))) {
    return { status: 'INVALID' };
  }
  return { status: 'FOUND', latitude, longitude };
}

function jpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 4 <= buffer.length && buffer[offset] === 0xff) {
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const end = offset + 2 + segmentLength;
    if (segmentLength < 2 || end > buffer.length) return null;
    if (startOfFrameMarkers.has(marker) && segmentLength >= 7) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset = end;
  }
  return null;
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, { langPath: englishDataPath })
      .then(async (worker) => {
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: '1' });
        return worker;
      })
      .catch((error) => {
        workerPromise = null;
        throw error;
      });
  }
  return workerPromise;
}

async function recognizeGpsStamp(buffer) {
  const dimensions = jpegDimensions(buffer);
  // Do not submit truncated or unsupported files: Tesseract can emit asynchronous
  // worker errors for inputs it cannot decode. OCR only actual bounded JPEGs.
  if (!dimensions || !dimensions.width || !dimensions.height
    || dimensions.width * dimensions.height > MAX_OCR_PIXELS) return { status: 'NOT_FOUND' };

  const worker = await getWorker();
  const fullImage = await worker.recognize(buffer);
  let parsed = parseGpsStampCoordinates(fullImage.data.text);
  if (parsed.status !== 'NOT_FOUND') return parsed;

  // GPS Map Camera stamps are commonly overlaid along the bottom edge.
  const bottomStamp = await worker.recognize(buffer, {
    rectangle: {
      left: 0,
      top: Math.floor(dimensions.height * 0.55),
      width: dimensions.width,
      height: Math.ceil(dimensions.height * 0.45),
    },
  });
  parsed = parseGpsStampCoordinates(bottomStamp.data.text);
  if (parsed.status !== 'NOT_FOUND') return parsed;
  return parsed;
}

export function extractGpsFromImageStamp(buffer) {
  const job = ocrQueue.then(() => recognizeGpsStamp(buffer));
  ocrQueue = job.catch(() => undefined);
  return job;
}

export async function closeGpsOcrWorker() {
  await ocrQueue.catch(() => undefined);
  const pendingWorker = workerPromise;
  workerPromise = null;
  if (pendingWorker) {
    const worker = await pendingWorker.catch(() => null);
    if (worker) await worker.terminate();
  }
}
