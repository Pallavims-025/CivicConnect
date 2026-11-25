import exifr from 'exifr';
import { verifyPhotoLocation } from '../../shared/photoLocation.js';
import { extractGpsFromImageStamp } from './photoOcr.js';

export function normalizePhoto(value) {
  if (typeof value !== 'string') return null;
  const photo = value.trim();
  if (photo.length <= 1000 && /^https?:\/\//i.test(photo)) {
    try {
      const url = new URL(photo);
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  }
  if (photo.length <= 7_000_000 && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/i.test(photo)) return photo;
  return null;
}

function supportedImageData(imageUrl) {
  const match = imageUrl.match(/^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+=*)$/i);
  if (!match) return false;
  const [, rawFormat, encoded] = match;
  const image = Buffer.from(encoded, 'base64');
  if (!image.length || image.length > 5 * 1024 * 1024) return false;
  const format = rawFormat.toLowerCase();
  if (format === 'jpeg') return image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
  if (format === 'png') return image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (format === 'webp') return image.length >= 12 && image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP';
  return image.toString('ascii', 0, 6) === 'GIF87a' || image.toString('ascii', 0, 6) === 'GIF89a';
}

function validCoordinate(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function jpegGpsIfdState(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return false;
  let offset = 2;
  while (offset + 4 <= buffer.length && buffer[offset] === 0xff) {
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const start = offset + 4;
    const end = offset + 2 + segmentLength;
    if (segmentLength < 2 || end > buffer.length) return null;
    if (marker === 0xe1 && buffer.toString('ascii', start, start + 6) === 'Exif\0\0') {
      const tiff = start + 6;
      if (tiff + 8 > end) return null;
      const little = buffer.toString('ascii', tiff, tiff + 2) === 'II';
      if (!little && buffer.toString('ascii', tiff, tiff + 2) !== 'MM') return null;
      const u16 = (at) => little ? buffer.readUInt16LE(at) : buffer.readUInt16BE(at);
      const u32 = (at) => little ? buffer.readUInt32LE(at) : buffer.readUInt32BE(at);
      const ifd = tiff + u32(tiff + 4);
      if (ifd + 2 > end) return null;
      const entries = u16(ifd);
      if (ifd + 2 + entries * 12 > end) return null;
      for (let index = 0; index < entries; index += 1) {
        if (u16(ifd + 2 + index * 12) === 0x8825) return true;
      }
      return false;
    }
    offset = end;
  }
  return false;
}

export async function parseComplaintSubmissionPhotos(photos, complaint, thresholdMetres) {
  if (photos === undefined || photos === null) return { records: [], error: null };
  if (!Array.isArray(photos)) return { records: [], error: 'Photos must be provided as a list.' };
  if (photos.length > 5) return { records: [], error: 'A complaint can include up to 5 photos.' };

  const records = [];
  const seen = new Set();
  for (const item of photos) {
    const imageUrl = normalizePhoto(typeof item === 'string' ? item : item?.imageUrl);
    if (!imageUrl || (imageUrl.startsWith('data:') && !supportedImageData(imageUrl))) {
      return { records: [], error: 'One or more photos are invalid. Upload a valid image no larger than 5 MB or use a valid image URL.' };
    }
    if (seen.has(imageUrl)) continue;

    const source = typeof item === 'object' && item !== null ? item.photoSource : 'GALLERY';
    if (source !== 'CAMERA' && source !== 'GALLERY') {
      return { records: [], error: 'Photo source must be camera or gallery.' };
    }

    let captureLatitude = null;
    let captureLongitude = null;
    let capturedAt = null;
    let status = 'GPS_COORDINATES_NOT_FOUND';
    let distanceMetres = null;
    let verifiedAt = new Date();
    let locationExtractionMethod = 'NONE';
    let locationData = null;
    if (!imageUrl.startsWith('data:')) {
      status = 'VERIFICATION_FAILED';
    } else {
      const encoded = imageUrl.slice(imageUrl.indexOf(',') + 1);
      const imageBuffer = Buffer.from(encoded, 'base64');
      const gpsIfd = jpegGpsIfdState(imageBuffer);
      let exifStatus = 'NOT_FOUND';
      try {
        locationData = await exifr.gps(imageBuffer);
      } catch {
        exifStatus = 'INVALID';
      }
      if (locationData?.latitude !== undefined || locationData?.longitude !== undefined) {
        if (validCoordinate(locationData.latitude, -90, 90)
          && validCoordinate(locationData.longitude, -180, 180)) {
          captureLatitude = locationData.latitude;
          captureLongitude = locationData.longitude;
          locationExtractionMethod = 'EXIF';
          exifStatus = 'FOUND';
        } else exifStatus = 'INVALID';
      } else if (gpsIfd !== false) exifStatus = 'INVALID';

      if (locationExtractionMethod === 'NONE' && exifStatus === 'NOT_FOUND') {
        let ocrCoordinates = { status: 'NOT_FOUND' };
        try {
          ocrCoordinates = await extractGpsFromImageStamp(imageBuffer);
        } catch {
          // OCR is a best-effort fallback; an unreadable stamp cannot verify a photo.
        }
        if (ocrCoordinates.status === 'FOUND'
          && validCoordinate(ocrCoordinates.latitude, -90, 90)
          && validCoordinate(ocrCoordinates.longitude, -180, 180)) {
          captureLatitude = ocrCoordinates.latitude;
          captureLongitude = ocrCoordinates.longitude;
          locationExtractionMethod = 'OCR';
        } else if (ocrCoordinates.status === 'INVALID') {
          status = 'INVALID_GPS_METADATA';
        }
      } else if (exifStatus === 'INVALID') status = 'INVALID_GPS_METADATA';

      if (locationExtractionMethod !== 'NONE') {
        if (!validCoordinate(complaint?.latitude, -90, 90)
          || !validCoordinate(complaint?.longitude, -180, 180)) status = 'COMPLAINT_LOCATION_NOT_AVAILABLE';
        else {
          const verified = verifyPhotoLocation({ latitude: captureLatitude, longitude: captureLongitude }, complaint, thresholdMetres);
          status = verified.status;
          distanceMetres = verified.distanceMetres;
        }
      }
    }

    const suppliedHash = typeof item === 'object' && item !== null ? item.perceptualHash : null;
    const perceptualHash = typeof suppliedHash === 'string' && /^[a-f\d]{16}$/i.test(suppliedHash) ? suppliedHash.toLowerCase() : null;
    records.push({
      imageUrl,
      perceptualHash,
      photoSource: source,
      captureLatitude,
      captureLongitude,
      locationExtractionMethod,
      capturedAt,
      locationVerificationStatus: status,
      locationDistanceMetres: distanceMetres,
      locationVerifiedAt: verifiedAt,
    });
    seen.add(imageUrl);
  }
  return { records, error: null };
}

export function verifyPhotoLocationRecords(photoRecords, confirmedComplaintLocation, thresholdMetres) {
  return photoRecords.map((photo) => {
    if (photo.locationVerificationStatus !== 'VERIFIED'
      && photo.locationVerificationStatus !== 'REJECTED_LOCATION_MISMATCH'
      && photo.locationVerificationStatus !== 'COMPLAINT_LOCATION_NOT_AVAILABLE') return photo;
    if (!validCoordinate(confirmedComplaintLocation?.latitude, -90, 90)
      || !validCoordinate(confirmedComplaintLocation?.longitude, -180, 180)) {
      return { ...photo, locationVerificationStatus: 'COMPLAINT_LOCATION_NOT_AVAILABLE', locationDistanceMetres: null };
    }
    const result = verifyPhotoLocation(
      { latitude: photo.captureLatitude, longitude: photo.captureLongitude },
      confirmedComplaintLocation,
      thresholdMetres,
    );
    return { ...photo, locationVerificationStatus: result.status, locationDistanceMetres: result.distanceMetres };
  });
}

export function parseComplaintPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  const unique = new Map();
  for (const item of photos) {
    const imageUrl = normalizePhoto(typeof item === 'string' ? item : item?.imageUrl);
    if (!imageUrl) continue;
    const suppliedHash = typeof item === 'object' && item !== null ? item.perceptualHash : null;
    const perceptualHash = typeof suppliedHash === 'string' && /^[a-f\d]{16}$/i.test(suppliedHash) ? suppliedHash.toLowerCase() : null;
    if (!unique.has(imageUrl)) unique.set(imageUrl, { imageUrl, perceptualHash });
    else if (!unique.get(imageUrl).perceptualHash && perceptualHash) unique.get(imageUrl).perceptualHash = perceptualHash;
  }
  return [...unique.values()].slice(0, 5);
}
