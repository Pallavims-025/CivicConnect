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
import { getOfficerComplaint, listMyComplaints, listOfficerComplaints, updateComplaintStatus } from '../controllers/complaintController.js';
import { hasVerifiedInitialComplaintPhoto } from '../../src/lib/municipalComplaintEligibility.js';
import { officerComplaintAccessWhere } from '../lib/officerComplaintAccess.js';

const complaint = (photos = [], status = 'PENDING') => ({ id: 'in-memory-test-record', userId: 'citizen-1', status, photos });

test('a backend VERIFIED photo qualifies a complaint for municipal views', () => {
  assert.equal(hasVerifiedComplaintPhoto(complaint([{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }])), true);
});

test('only verified initial evidence permits assignment', () => {
  assert.equal(hasVerifiedInitialComplaintPhoto({ status: 'PENDING', photoLocationEvidence: [{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }] }), true);
  assert.equal(hasVerifiedInitialComplaintPhoto({ status: 'REJECTED', photoLocationEvidence: [{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }] }), false);
  assert.equal(hasVerifiedInitialComplaintPhoto({ status: 'PENDING', photoLocationEvidence: [{ photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'GPS_COORDINATES_NOT_FOUND' }] }), false);
});

test('officer access includes assigned work, matching departments, and only unassigned intake records', () => {
  assert.deepEqual(officerComplaintAccessWhere({ id: 'officer-1', departmentId: 3 }), {
    OR: [
      { assignedOfficerId: 'officer-1' },
      { workOrders: { some: { assignedByOfficerId: 'officer-1' } } },
      { departmentId: 3 },
      { category: { departmentId: 3 } },
      { departmentId: null, assignedOfficerId: null, category: { departmentId: null }, workOrders: { none: {} } },
    ],
  });
});

test('municipal complaint list includes unverified and rejected records in officer scope', async () => {
  const originalLookup = prisma.complaint.findMany;
  let query;
  const unverifiedRecord = {
    id: 'in-memory-unverified-record', complaintCode: 'CC-TEST', title: 'Unverified complaint', description: 'An unverified complaint fixture', status: 'PENDING', priority: 'MEDIUM',
    photos: [{ id: 'photo-1', imageUrl: 'photo.jpg', photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'GPS_COORDINATES_NOT_FOUND' }],
    category: { name: 'Roads' }, department: { name: 'Roads' }, user: { id: 'citizen-1', name: 'Citizen' }, assignedOfficer: null, workOrders: [], statusHistory: [], _count: { photos: 1 },
  };
  const rejectedRecord = {
    ...unverifiedRecord, id: 'in-memory-rejected-record', complaintCode: 'CC-REJECTED', status: 'REJECTED', rejectionReason: 'Outside service area',
    photos: [], _count: { photos: 0 },
  };
  prisma.complaint.findMany = async (args) => { query = args; return [unverifiedRecord, rejectedRecord]; };
  const response = { json(body) { this.body = body; } };
  try { await listOfficerComplaints({ user: { id: 'officer-1', departmentId: null } }, response, (error) => { throw error; }); }
  finally { prisma.complaint.findMany = originalLookup; }
  assert.deepEqual(query.where, officerComplaintAccessWhere({ id: 'officer-1', departmentId: null }));
  assert.deepEqual(query.include.photos.where, { photoType: 'INITIAL_EVIDENCE' });
  assert.equal(response.body.data.complaints[0].status, 'PENDING');
  assert.equal(response.body.data.complaints[0].photoLocationEvidence[0].locationVerificationStatus, 'GPS_COORDINATES_NOT_FOUND');
  assert.equal(response.body.data.complaints[1].status, 'REJECTED');
  assert.equal(response.body.data.complaints[1].rejectionReason, 'Outside service area');
});

test('officer can open a complaint by public ID while retaining its internal UUID', async () => {
  const originalLookup = prisma.complaint.findFirst;
  const complaintUuid = 'b937e849-b323-4966-8e17-a7494170000b';
  let query;
  prisma.complaint.findFirst = async (args) => {
    query = args;
    return {
      id: complaintUuid, complaintCode: 'CC-1001', title: 'Complaint', description: 'Complaint description',
      status: 'PENDING', priority: 'MEDIUM', photos: [{ id: 'photo-1', imageUrl: 'photo.jpg', photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'GPS_COORDINATES_NOT_FOUND' }],
      category: { name: 'Roads' }, department: null, user: { id: 'citizen-1', name: 'Citizen' },
      assignedOfficer: null, workOrders: [], statusHistory: [],
    };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await getOfficerComplaint({
      params: { id: 'CC-1001' },
      user: { id: 'officer-1', departmentId: null },
    }, response, (error) => { throw error; });
  } finally { prisma.complaint.findFirst = originalLookup; }
  assert.deepEqual(query.where.AND[0], { OR: [{ id: 'CC-1001' }, { complaintCode: 'CC-1001' }] });
  assert.deepEqual(query.where.AND[1], officerComplaintAccessWhere({ id: 'officer-1', departmentId: null }));
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.id, 'CC-1001');
  assert.equal(response.body.data.databaseId, complaintUuid);
  assert.equal(response.body.data.photoLocationEvidence[0].locationVerificationStatus, 'GPS_COORDINATES_NOT_FOUND');
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

test('direct assignment API uses the internal UUID and reports unverified evidence', async () => {
  const originalSupervisorLookup = prisma.user.findFirst;
  const originalComplaintLookup = prisma.complaint.findFirst;
  let complaintQuery;
  const complaintUuid = 'b937e849-b323-4966-8e17-a7494170000b';
  prisma.user.findFirst = async () => ({ id: 'supervisor-id', name: 'Supervisor', departmentId: 1 });
  prisma.complaint.findFirst = async (args) => {
    complaintQuery = args;
    return { id: 'unverified-complaint-id', status: 'PENDING', photos: [], category: { departmentId: 1 } };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await assignComplaint({
      body: { supervisorId: 'supervisor-id', instructions: 'Inspect this location', priority: 'MEDIUM' },
      params: { complaintId: complaintUuid },
      user: { id: 'officer-id', name: 'Officer', departmentId: null },
    }, response, (error) => { throw error; });
  } finally {
    prisma.user.findFirst = originalSupervisorLookup;
    prisma.complaint.findFirst = originalComplaintLookup;
  }
  assert.equal(response.statusCode, 409);
  assert.match(response.body.errors.general, /cannot be assigned until at least one initial photograph is verified/i);
  assert.deepEqual(complaintQuery.where.AND[0], { id: complaintUuid });
  assert.deepEqual(complaintQuery.where.AND[1], { status: { not: 'REJECTED' } });
  assert.deepEqual(complaintQuery.where.AND[2], officerComplaintAccessWhere({ id: 'officer-id', departmentId: null }));
  assert.deepEqual(complaintQuery.include.photos.where, { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' });
});

test('direct assignment API rejects a public complaint code where an internal UUID is required', async () => {
  const originalSupervisorLookup = prisma.user.findFirst;
  const originalComplaintLookup = prisma.complaint.findFirst;
  prisma.user.findFirst = async () => { throw new Error('Supervisor lookup should not run.'); };
  prisma.complaint.findFirst = async () => { throw new Error('Complaint lookup should not run.'); };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await assignComplaint({
      body: { supervisorId: 'supervisor-id', instructions: 'Inspect this location', priority: 'MEDIUM' },
      params: { complaintId: 'CC-1001' },
      user: { id: 'officer-id', name: 'Officer', departmentId: null },
    }, response, (error) => { throw error; });
  } finally {
    prisma.user.findFirst = originalSupervisorLookup;
    prisma.complaint.findFirst = originalComplaintLookup;
  }
  assert.equal(response.statusCode, 400);
  assert.match(response.body.errors.complaintId, /internal complaint ID/i);
});

test('officer cannot bypass repair verification by setting a complaint to RESOLVED', async () => {
  const originalLookup = prisma.complaint.findFirst;
  let query;
  prisma.complaint.findFirst = async (args) => {
    query = args;
    return {
      id: 'b937e849-b323-4966-8e17-a7494170000b', complaintCode: 'CC-1001',
      status: 'IN_PROGRESS', userId: 'citizen-1', assignedOfficerId: 'officer-1',
      photos: [{ id: 'verified-photo' }],
    };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await updateComplaintStatus({
      params: { id: 'CC-1001' },
      body: { status: 'RESOLVED' },
      user: { id: 'officer-1', name: 'Officer', departmentId: null },
    }, response, (error) => { throw error; });
  } finally { prisma.complaint.findFirst = originalLookup; }
  assert.deepEqual(query.where.AND[1], officerComplaintAccessWhere({ id: 'officer-1', departmentId: null }));
  assert.equal(response.statusCode, 409);
  assert.match(response.body.errors.general, /Municipal Repair Verification/i);
});
