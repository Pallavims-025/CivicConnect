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
import { listMyComplaints, listOfficerComplaints } from '../controllers/complaintController.js';
import { isMunicipalComplaintEligible } from '../../src/lib/municipalComplaintEligibility.js';

const complaint = (photos = [], status = 'PENDING') => ({ id: 'in-memory-test-record', userId: 'citizen-1', status, photos });

test('a backend VERIFIED photo qualifies a complaint for municipal views', () => {
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }])), true);
});

test('the municipal dashboard accepts stored VERIFIED initial evidence and rejects rejected/unverified records', () => {
  assert.equal(isMunicipalComplaintEligible({ status: 'PENDING', photoLocationEvidence: [{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }] }), true);
  assert.equal(isMunicipalComplaintEligible({ status: 'REJECTED', photoLocationEvidence: [{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }] }), false);
  assert.equal(isMunicipalComplaintEligible({ status: 'PENDING', photoLocationEvidence: [{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'GPS_COORDINATES_NOT_FOUND' }] }), false);
});

test('municipal complaint list applies the database eligibility predicate', async () => {
  const originalLookup = prisma.complaint.findMany;
  let query;
  const verifiedRecord = {
    id: 'in-memory-verified-record', complaintCode: 'CC-TEST', title: 'Verified complaint', description: 'A verified complaint fixture', status: 'PENDING', priority: 'MEDIUM',
    photos: [{ id: 'photo-1', imageUrl: 'photo.jpg', photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }],
    category: { name: 'Roads' }, department: { name: 'Roads' }, user: { id: 'citizen-1', name: 'Citizen' }, assignedOfficer: null, workOrders: [], statusHistory: [], _count: { photos: 1 },
  };
  prisma.complaint.findMany = async (args) => { query = args; return [verifiedRecord]; };
  const response = { json(body) { this.body = body; } };
  try { await listOfficerComplaints({}, response, (error) => { throw error; }); }
  finally { prisma.complaint.findMany = originalLookup; }
  assert.deepEqual(query.where, { status: { not: 'REJECTED' }, photos: { some: { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' } } });
  assert.deepEqual(query.include.photos.where, { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' });
  assert.equal(response.body.data.complaints[0].status, 'PENDING');
  assert.equal(response.body.data.complaints[0].photoLocationEvidence[0].locationVerificationStatus, 'VERIFIED');
});

test('citizen complaint retrieval remains scoped to owner and includes rejection reasons', async () => {
  const originalLookup = prisma.complaint.findMany;
  let query;
  prisma.complaint.findMany = async (args) => {
    query = args;
    return [{ id: 'in-memory-rejected-record', complaintCode: 'CC-REJECTED', title: 'Rejected complaint', description: 'Citizen complaint fixture', status: 'REJECTED', priority: 'LOW', rejectionReason: 'Outside service area', photos: [], category: { name: 'Roads' }, department: null, user: { id: 'citizen-1', name: 'Citizen' }, assignedOfficer: null, workOrders: [], statusHistory: [] }];
  };
  const response = { json(body) { this.body = body; } };
  try { await listMyComplaints({ user: { id: 'citizen-1' } }, response, (error) => { throw error; }); }
  finally { prisma.complaint.findMany = originalLookup; }
  assert.deepEqual(query.where, { userId: 'citizen-1' });
  assert.equal(response.body.data[0].status, 'REJECTED');
  assert.equal(response.body.data[0].rejectionReason, 'Outside service area');
});

test('a rejected complaint is ineligible even when an initial photo was verified', () => {
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }], 'REJECTED')), false);
});

test('only an initial evidence photo with the stored VERIFIED status qualifies', () => {
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ photoType: 'RESOLUTION_EVIDENCE', locationVerificationStatus: 'VERIFIED' }])), false);
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'PENDING_VERIFICATION' }])), false);
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
  saved.photos.push({ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: correctedResult.status });
  assert.equal(correctedResult.status, 'VERIFIED');
  assert.equal(canCitizenRetryPhotoVerification(saved, 'citizen-1'), false);
  assert.equal(hasVerifiedComplaintPhoto(saved), true);
});

test('direct assignment guard rejects complaints without a backend verified photo', () => {
  assert.throws(() => assertComplaintHasVerifiedPhoto(complaint([{ locationVerificationStatus: 'GPS_COORDINATES_NOT_FOUND' }])), { status: 409 });
  assert.doesNotThrow(() => assertComplaintHasVerifiedPhoto(complaint([{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }])));
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
  assert.deepEqual(complaintQuery.where.AND[1], { status: { not: 'REJECTED' }, photos: { some: { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' } } });
});
