import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPhotoLocation } from '../../shared/photoLocation.js';
import {
  assertComplaintHasVerifiedPhoto,
  canCitizenRetryPhotoVerification,
  citizenOwnsComplaint,
  hasVerifiedComplaintPhoto,
} from '../lib/verifiedComplaint.js';
import { prisma } from '../lib/prisma.js';
import { assignComplaint } from '../controllers/assignmentController.js';

const complaint = (photos = []) => ({ id: 'in-memory-test-record', userId: 'citizen-1', photos });

test('a backend VERIFIED photo qualifies a complaint for municipal views', () => {
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ locationVerificationStatus: 'VERIFIED' }])), true);
});

test('a photo beyond 500 metres is rejected and does not qualify for municipal views', () => {
  const location = verifyPhotoLocation(
    { latitude: 12.9716 + (501 / 6371000) * (180 / Math.PI), longitude: 77.5946 },
    { latitude: 12.9716, longitude: 77.5946 },
  );
  assert.equal(location.status, 'REJECTED_LOCATION_MISMATCH');
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ locationVerificationStatus: location.status }])), false);
});

test('missing GPS does not qualify a complaint for municipal views', () => {
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ locationVerificationStatus: 'GPS_COORDINATES_NOT_FOUND' }])), false);
  assert.equal(hasVerifiedComplaintPhoto(complaint([])), false);
});

test('citizens retain access to their own unverified complaint', () => {
  const saved = complaint([{ locationVerificationStatus: 'REJECTED_LOCATION_MISMATCH' }]);
  assert.equal(citizenOwnsComplaint(saved, 'citizen-1'), true);
  assert.equal(citizenOwnsComplaint(saved, 'citizen-2'), false);
});

test('a citizen can retry an unverified complaint and the appended verified result makes it eligible', () => {
  const saved = complaint([{ locationVerificationStatus: 'REJECTED_LOCATION_MISMATCH' }]);
  assert.equal(canCitizenRetryPhotoVerification(saved, 'citizen-1'), true);
  const correctedResult = verifyPhotoLocation(
    { latitude: 12.9716, longitude: 77.5946 },
    { latitude: 12.9716, longitude: 77.5946 },
  );
  saved.photos.push({ locationVerificationStatus: correctedResult.status });
  assert.equal(correctedResult.status, 'VERIFIED');
  assert.equal(canCitizenRetryPhotoVerification(saved, 'citizen-1'), false);
  assert.equal(hasVerifiedComplaintPhoto(saved), true);
});

test('direct assignment guard rejects complaints without a backend verified photo', () => {
  assert.throws(() => assertComplaintHasVerifiedPhoto(complaint([{ locationVerificationStatus: 'GPS_COORDINATES_NOT_FOUND' }])), { status: 409 });
  assert.doesNotThrow(() => assertComplaintHasVerifiedPhoto(complaint([{ locationVerificationStatus: 'VERIFIED' }])));
});

test('direct assignment API hides an unverified complaint before creating a work order', async () => {
  const originalSupervisorLookup = prisma.user.findFirst;
  const originalComplaintLookup = prisma.complaint.findFirst;
  let complaintQuery;
  prisma.user.findFirst = async () => ({ id: 'supervisor-id', name: 'Supervisor', departmentId: 1 });
  prisma.complaint.findFirst = async (args) => { complaintQuery = args; return null; };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await assignComplaint({
      body: { supervisorId: 'supervisor-id', instructions: 'Inspect this location', priority: 'MEDIUM' },
      params: { complaintId: 'unverified-complaint-id' },
      user: { id: 'officer-id', name: 'Officer' },
    }, response, (error) => { throw error; });
  } finally {
    prisma.user.findFirst = originalSupervisorLookup;
    prisma.complaint.findFirst = originalComplaintLookup;
  }
  assert.equal(response.statusCode, 404);
  assert.deepEqual(complaintQuery.where.AND[1], { photos: { some: { locationVerificationStatus: 'VERIFIED' } } });
});
