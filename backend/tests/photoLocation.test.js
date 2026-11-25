import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES, verifyPhotoLocation } from '../../shared/photoLocation.js';
import { parseComplaintSubmissionPhotos, verifyPhotoLocationRecords } from '../lib/photoUtils.js';
import { closeGpsOcrWorker, parseGpsStampCoordinates } from '../lib/photoOcr.js';

test.after(async () => closeGpsOcrWorker());

const complaint = { latitude: 12.9716, longitude: 77.5946 };

function gpsJpeg(latitude, longitude) {
  const tiff = Buffer.alloc(130);
  tiff.write('II', 0);
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x8825, 10);
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(26, 18);
  tiff.writeUInt32LE(0, 22);
  tiff.writeUInt16LE(4, 26);
  const entry = (at, tag, type, count, value) => {
    tiff.writeUInt16LE(tag, at); tiff.writeUInt16LE(type, at + 2);
    tiff.writeUInt32LE(count, at + 4); tiff.writeUInt32LE(value, at + 8);
  };
  entry(28, 1, 2, 2, latitude < 0 ? 0x0053 : 0x004e);
  entry(40, 2, 5, 3, 80);
  entry(52, 3, 2, 2, longitude < 0 ? 0x0057 : 0x0045);
  entry(64, 4, 5, 3, 104);
  tiff.writeUInt32LE(0, 76);
  const writeDms = (offset, value) => {
    const absolute = Math.abs(value);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = Math.round((minutesFloat - minutes) * 60 * 1_000_000);
    [[degrees, 1], [minutes, 1], [seconds, 1_000_000]].forEach(([n, d], i) => {
      tiff.writeUInt32LE(n, offset + i * 8); tiff.writeUInt32LE(d, offset + i * 8 + 4);
    });
  };
  writeDms(80, latitude); writeDms(104, longitude);
  const exif = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const length = Buffer.alloc(2); length.writeUInt16BE(exif.length + 2);
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), length, exif, Buffer.from([0xff, 0xd9])]);
}

const image = (buffer) => `data:image/jpeg;base64,${buffer.toString('base64')}`;
async function submit(url, confirmedLocation = complaint, clientCoords = {}) {
  const parsed = await parseComplaintSubmissionPhotos([{
    imageUrl: url, photoSource: 'GALLERY', ...clientCoords,
  }], null, DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES);
  return { ...parsed, records: verifyPhotoLocationRecords(parsed.records, confirmedLocation, DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES) };
}

test('EXIF GPS matching the complaint is Verified and persisted', async () => {
  const result = await submit(image(gpsJpeg(complaint.latitude, complaint.longitude)));
  assert.equal(result.error, null);
  const record = result.records[0];
  assert.equal(record.locationVerificationStatus, 'VERIFIED');
  assert.equal(record.locationExtractionMethod, 'EXIF');
  assert.equal(record.captureLatitude, complaint.latitude);
  assert.equal(record.captureLongitude, complaint.longitude);
  assert.equal(record.locationDistanceMetres, 0);
  assert.ok(record.locationVerifiedAt instanceof Date);
});

test('full-precision coordinate differences within 500 metres are verified', async () => {
  const photoLatitude = 12.971612;
  const photoLongitude = 77.594623;
  const confirmedLocation = { latitude: 12.971699, longitude: 77.594699 };
  const result = await submit(image(gpsJpeg(photoLatitude, photoLongitude)), confirmedLocation);
  const photo = result.records[0];
  assert.equal(photo.locationVerificationStatus, 'VERIFIED');
  assert.ok(photo.locationDistanceMetres > 0 && photo.locationDistanceMetres <= 500);
  assert.notEqual(photo.captureLatitude % 1, 0);
  assert.notEqual(photo.captureLongitude % 1, 0);
});

function latitudeForDistance(metres) {
  return complaint.latitude + (metres / 6371000) * (180 / Math.PI);
}

test('50 metres is Verified', async () => {
  const result = await submit(image(gpsJpeg(latitudeForDistance(50), complaint.longitude)));
  assert.equal(result.records[0].locationVerificationStatus, 'VERIFIED', String(result.records[0].locationDistanceMetres));
  assert.equal(Math.round(result.records[0].locationDistanceMetres), 50);
});

test('exactly 500 metres is Verified (inclusive threshold)', () => {
  const exactBoundaryPhoto = {
    latitude: complaint.latitude + (500 / 6371000) * (180 / Math.PI),
    longitude: complaint.longitude,
  };
  const result = verifyPhotoLocation(exactBoundaryPhoto, complaint, DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES);
  assert.equal(result.status, 'VERIFIED');
  assert.equal(result.distanceMetres, 500);
});

test('EXIF coordinates within 500 metres remain Verified', async () => {
  const result = await submit(image(gpsJpeg(latitudeForDistance(499.5), complaint.longitude)));
  assert.equal(result.records[0].locationVerificationStatus, 'VERIFIED', String(result.records[0].locationDistanceMetres));
  assert.ok(result.records[0].locationDistanceMetres <= 500);
});

test('501 metres is rejected as a location mismatch', async () => {
  const result = await submit(image(gpsJpeg(latitudeForDistance(501), complaint.longitude)));
  assert.equal(result.records[0].locationVerificationStatus, 'REJECTED_LOCATION_MISMATCH');
  assert.equal(Math.round(result.records[0].locationDistanceMetres), 501);
});

test('a corrected photograph can pass verification after an earlier mismatch', async () => {
  const rejectedAttempt = await submit(image(gpsJpeg(latitudeForDistance(501), complaint.longitude)));
  assert.equal(rejectedAttempt.records[0].locationVerificationStatus, 'REJECTED_LOCATION_MISMATCH');
  const correctedAttempt = await submit(image(gpsJpeg(complaint.latitude, complaint.longitude)));
  assert.equal(correctedAttempt.records[0].locationVerificationStatus, 'VERIFIED');
  assert.equal(correctedAttempt.records[0].locationDistanceMetres, 0);
});

test('South and West EXIF references convert to negative decimal coordinates', async () => {
  const result = await submit(image(gpsJpeg(-12.971612, -77.594623)), { latitude: -12.971699, longitude: -77.594699 });
  assert.equal(result.records[0].locationVerificationStatus, 'VERIFIED');
  assert.ok(result.records[0].captureLatitude < 0);
  assert.ok(result.records[0].captureLongitude < 0);
});

test('fractional coordinates with a distance greater than 500 metres are rejected', async () => {
  const far = await submit(image(gpsJpeg(12.982, 77.5946)), complaint);
  assert.ok(far.records[0].locationDistanceMetres > 500);
  assert.equal(far.records[0].locationVerificationStatus, 'REJECTED_LOCATION_MISMATCH');
});

test('image without GPS returns GPS Metadata Not Found', async () => {
  const result = await submit(image(Buffer.from([0xff, 0xd8, 0xff, 0xd9])));
  assert.equal(result.records[0].locationVerificationStatus, 'GPS_COORDINATES_NOT_FOUND');
  assert.equal(result.records[0].locationExtractionMethod, 'NONE');
  assert.equal(result.records[0].captureLatitude, null);
});

test('OCR stamp parser reads GPS Map Camera latitude and longitude', () => {
  const result = parseGpsStampCoordinates('Lat 12.865007° Long 74.922856° Location: Adyar, Karnataka, India');
  assert.deepEqual(result, { status: 'FOUND', latitude: 12.865007, longitude: 74.922856 });
});

test('OCR stamp parser handles labels, line breaks, spacing, case, and hemisphere letters', () => {
  const result = parseGpsStampCoordinates('lAtItUdE : 12.865007 N\n LONGITUDE: 74.922856 E');
  assert.deepEqual(result, { status: 'FOUND', latitude: 12.865007, longitude: 74.922856 });
  const southWest = parseGpsStampCoordinates('Lat: 12.865007 S  Long: 74.922856 W');
  assert.deepEqual(southWest, { status: 'FOUND', latitude: -12.865007, longitude: -74.922856 });
});

test('OCR parser requires labeled, complete, in-range coordinate pairs', () => {
  assert.deepEqual(parseGpsStampCoordinates('Nearby marker 12.865007, 74.922856'), { status: 'NOT_FOUND' });
  assert.deepEqual(parseGpsStampCoordinates('Latitude: 12.865007'), { status: 'INVALID' });
  assert.deepEqual(parseGpsStampCoordinates('Latitude: 95.865007 Longitude: 74.922856'), { status: 'INVALID' });
  assert.deepEqual(parseGpsStampCoordinates('Latitude: 12.865007 Longitude: 190.922856'), { status: 'INVALID' });
});

test('invalid GPS coordinates return Invalid GPS Metadata', async () => {
  const result = await submit(image(gpsJpeg(91, 10)));
  assert.equal(result.records[0].locationVerificationStatus, 'INVALID_GPS_METADATA');
});

test('corrupted EXIF GPS structure fails safely as Invalid GPS Metadata', async () => {
  const exif = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff])]);
  const length = Buffer.alloc(2); length.writeUInt16BE(exif.length + 2);
  const corruptJpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), length, exif, Buffer.from([0xff, 0xd9])]);
  const result = await submit(image(corruptJpeg));
  assert.equal(result.records[0].locationVerificationStatus, 'INVALID_GPS_METADATA');
});

test('valid photo GPS without complaint coordinates cannot verify', async () => {
  const result = await submit(image(gpsJpeg(complaint.latitude, complaint.longitude)), { latitude: null, longitude: null });
  assert.equal(result.records[0].locationVerificationStatus, 'COMPLAINT_LOCATION_NOT_AVAILABLE');
  assert.equal(result.records[0].locationDistanceMetres, null);
});

test('frontend supplied coordinates are ignored as photo evidence', async () => {
  const result = await submit(image(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), complaint, {
    captureLatitude: complaint.latitude, captureLongitude: complaint.longitude,
  });
  assert.equal(result.records[0].locationVerificationStatus, 'GPS_COORDINATES_NOT_FOUND');
  assert.equal(result.records[0].captureLatitude, null);
});

test('remote images fail closed because the server cannot inspect uploaded bytes', async () => {
  const result = await submit('https://example.test/photo.jpg');
  assert.equal(result.records[0].locationVerificationStatus, 'VERIFICATION_FAILED');
});
