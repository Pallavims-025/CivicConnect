import { prisma } from '../lib/prisma.js';
import { normalizePhoto, parseComplaintSubmissionPhotos, verifyPhotoLocationRecords } from '../lib/photoUtils.js';
import { findDuplicateCandidates, refreshDuplicateCandidates } from '../lib/duplicateDetection.js';
import { notifyDepartmentOfficers, notifyUser } from '../lib/notificationService.js';
import { DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES } from '../../shared/photoLocation.js';
import { canCitizenRetryPhotoVerification, hasVerifiedComplaintPhoto, VERIFIED_COMPLAINT_WHERE } from '../lib/verifiedComplaint.js';

const PHOTO_LOCATION_THRESHOLD_METRES = DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES;

const complaintInclude = {
  category: { select: { id: true, name: true } },
  department: { select: { name: true } },
  user: { select: { id: true, name: true, email: true, phone: true } },
  assignedOfficer: { select: { id: true, name: true, email: true, phone: true } },
  photos: { select: {
    id: true, imageUrl: true, caption: true, photoType: true, createdAt: true,
    photoSource: true, captureLatitude: true, captureLongitude: true, locationExtractionMethod: true, capturedAt: true,
    locationVerificationStatus: true, locationDistanceMetres: true, locationVerifiedAt: true,
    locationReviewDecision: true, locationReviewedAt: true, locationReviewNotes: true,
    locationReviewedBy: { select: { id: true, name: true } },
  } },
  workOrders: {
    include: {
      supervisor: { select: { id: true, name: true, email: true, phone: true } },
      assignedByOfficer: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
      photos: { select: { id: true, imageUrl: true, caption: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  statusHistory: { select: { newStatus: true, title: true, notes: true, performedByName: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
};

const complaintListInclude = { ...complaintInclude };
delete complaintListInclude.workOrders;
complaintListInclude.photos = {
  ...complaintInclude.photos,
  where: { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' },
};
complaintListInclude._count = { select: { photos: { where: { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' } } } };

function toMapRecord(record) {
  const photosByUrl = new Map();
  for (const photo of record.photos || []) {
    const url = typeof photo.imageUrl === 'string' ? photo.imageUrl.trim() : '';
    const normalized = normalizePhoto(url) || url;
    if (url && !photosByUrl.has(normalized)) photosByUrl.set(normalized, normalized);
  }
  return {
    id: record.complaintCode || record.id,
    databaseId: record.id,
    title: record.title,
    description: record.description,
    category: record.category?.name || 'Uncategorized',
    categoryId: record.categoryId,
    status: record.status,
    priority: record.priority,
    rejectionReason: record.rejectionReason,
    resolutionNotes: record.resolutionNotes,
    resolvedAt: record.resolvedAt,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    reportedDate: record.createdAt,
    lastUpdated: record.updatedAt,
    citizenId: record.user?.id,
    citizenName: record.user?.name,
    citizenEmail: record.user?.email,
    citizenPhone: record.user?.phone,
    assignedOfficer: record.assignedOfficer,
    assignedDepartment: record.department?.name || 'Unassigned',
    workOrderId: record.workOrders?.[0]?.workOrderCode || record.workOrders?.[0]?.id || null,
    assignedFieldOfficer: record.workOrders?.[0]?.supervisor?.name || record.workOrders?.[0]?.supervisorName || record.workOrders?.[0]?.assignedCrew || null,
    timeline: record.statusHistory.map((item) => ({ date: item.createdAt, title: item.title, description: item.notes, by: item.performedByName, status: item.newStatus })),
    photos: [...photosByUrl.values()],
    photoLocationEvidence: (record.photos || []).map((photo) => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      photoSource: photo.photoSource || 'GALLERY',
      photoType: photo.photoType || 'INITIAL_EVIDENCE',
      captureLatitude: photo.captureLatitude,
      captureLongitude: photo.captureLongitude,
      locationExtractionMethod: photo.locationExtractionMethod || 'NONE',
      capturedAt: photo.capturedAt,
      locationVerificationStatus: photo.locationVerificationStatus || 'GPS_COORDINATES_NOT_FOUND',
      locationDistanceMetres: photo.locationDistanceMetres,
      locationVerifiedAt: photo.locationVerifiedAt,
      locationReviewDecision: photo.locationReviewDecision,
      locationReviewedAt: photo.locationReviewedAt,
      locationReviewNotes: photo.locationReviewNotes,
      locationReviewedBy: photo.locationReviewedBy || null,
    })),
    photoCount: record._count?.photos ?? photosByUrl.size,
    duplicateClassification: record.duplicateClassification || 'NEW',
    duplicateReviewStatus: record.duplicateReviewStatus || 'NOT_REQUIRED',
    duplicateOf: record.duplicateOf ? { id: record.duplicateOf.complaintCode || record.duplicateOf.id, title: record.duplicateOf.title } : null,
    assignments: (record.workOrders || []).map((order) => ({
      id: order.id,
      workOrderCode: order.workOrderCode,
      status: order.status,
      priority: order.priority,
      workDescription: order.workDescription,
      deadline: order.deadline,
      assignedAt: order.assignedAt,
      acceptedAt: order.acceptedAt,
      completedDate: order.completedDate,
      supervisor: order.supervisor,
      assignedByOfficer: order.assignedByOfficer,
      history: order.statusHistory?.map((entry) => ({ status: entry.newStatus, notes: entry.notes, by: entry.changedByName, date: entry.createdAt })) || [],
      completionPhotos: [...new Set((order.photos || []).map((photo) => photo.imageUrl.trim()))],
    })),
    duplicateMatches: (record.duplicateMatches || []).map((match) => ({
      id: match.id,
      similarityScore: match.similarityScore,
      classification: match.classification,
      comparison: match.comparison,
      decision: match.decision,
      matchedComplaint: match.matchedComplaint ? toMapRecord(match.matchedComplaint) : null,
    })),
  };
}

function toMunicipalMapRecord(record) {
  const mapped = toMapRecord(record);
  const verifiedEvidence = mapped.photoLocationEvidence.filter((photo) => photo.photoType === 'INITIAL_EVIDENCE' && photo.locationVerificationStatus === 'VERIFIED');
  const verifiedUrls = new Set(verifiedEvidence.map((photo) => normalizePhoto(photo.imageUrl) || photo.imageUrl));
  return {
    ...mapped,
    photos: mapped.photos.filter((url) => verifiedUrls.has(normalizePhoto(url) || url)),
    photoLocationEvidence: verifiedEvidence,
    photoCount: verifiedEvidence.length || (mapped.photoCount ? 1 : 0),
    duplicateOf: hasVerifiedComplaintPhoto(record.duplicateOf) ? mapped.duplicateOf : null,
    duplicateMatches: mapped.duplicateMatches
      .filter((match) => hasVerifiedComplaintPhoto(match.matchedComplaint))
      .map((match) => ({ ...match, matchedComplaint: toMunicipalRecordFromMapped(match.matchedComplaint) })),
  };
}

function toMunicipalRecordFromMapped(mapped) {
  const verifiedEvidence = (mapped.photoLocationEvidence || []).filter((photo) => photo.photoType === 'INITIAL_EVIDENCE' && photo.locationVerificationStatus === 'VERIFIED');
  const verifiedUrls = new Set(verifiedEvidence.map((photo) => normalizePhoto(photo.imageUrl) || photo.imageUrl));
  return {
    ...mapped,
    photos: (mapped.photos || []).filter((url) => verifiedUrls.has(normalizePhoto(url) || url)),
    photoLocationEvidence: verifiedEvidence,
    photoCount: verifiedEvidence.length,
    duplicateMatches: (mapped.duplicateMatches || [])
      .filter((match) => hasVerifiedComplaintPhoto(match.matchedComplaint))
      .map((match) => ({ ...match, matchedComplaint: toMunicipalRecordFromMapped(match.matchedComplaint) })),
  };
}

export async function listMyComplaints(req, res, next) {
  try {
    const records = await prisma.complaint.findMany({
      where: { userId: req.user.id },
      include: complaintInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: records.map(toMapRecord) });
  } catch (error) {
    next(error);
  }
}

export async function retryComplaintPhotoVerification(req, res, next) {
  try {
    const complaint = await prisma.complaint.findFirst({
      where: { AND: [{ OR: [{ id: req.params.id }, { complaintCode: req.params.id }] }, { userId: req.user.id }] },
      select: { id: true, complaintCode: true, userId: true, status: true },
    });
    if (!complaint || !canCitizenRetryPhotoVerification(complaint, req.user.id)) return res.status(404).json({ success: false, errors: { general: 'Complaint not found.' } });

    const existingVerifiedPhoto = await prisma.complaintPhoto.findFirst({
      where: { complaintId: complaint.id, photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' },
      select: { id: true },
    });
    if (existingVerifiedPhoto) return res.status(409).json({ success: false, errors: { general: 'This complaint already has a verified photograph.' } });

    const { photos = [] } = req.body || {};
    const photoParse = await parseComplaintSubmissionPhotos(photos, null, PHOTO_LOCATION_THRESHOLD_METRES);
    if (photoParse.error) return res.status(422).json({ success: false, errors: { photos: photoParse.error } });
    if (!photoParse.records.length) return res.status(422).json({ success: false, errors: { photos: 'Upload at least one corrected photograph.' } });

    const record = await prisma.$transaction(async (tx) => {
      const currentComplaint = await tx.complaint.findFirst({
        where: { id: complaint.id, userId: req.user.id },
        select: { id: true, complaintCode: true, latitude: true, longitude: true, status: true, departmentId: true },
      });
      if (!currentComplaint) return null;
      const alreadyVerified = await tx.complaintPhoto.findFirst({
        where: { complaintId: currentComplaint.id, photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' },
        select: { id: true },
      });
      if (alreadyVerified) return null;

      const results = verifyPhotoLocationRecords(photoParse.records, currentComplaint, PHOTO_LOCATION_THRESHOLD_METRES);
      for (const photo of results) {
        await tx.complaintPhoto.create({ data: { ...photo, complaintId: currentComplaint.id, uploadedById: req.user.id } });
      }
      await tx.complaintStatusHistory.create({ data: {
        complaintId: currentComplaint.id,
        previousStatus: currentComplaint.status,
        newStatus: currentComplaint.status,
        title: 'Corrected photographs submitted for location verification',
        notes: results.map((photo, index) => `Photo ${index + 1}: ${photo.locationVerificationStatus}${Number.isFinite(photo.locationDistanceMetres) ? ` (${photo.locationDistanceMetres.toFixed(1)} m)` : ''}`).join('; '),
        performedByUserId: req.user.id,
        performedByName: req.user.name,
      } });

      const verified = results.some((photo) => photo.locationVerificationStatus === 'VERIFIED');
      if (verified) {
        const complaintLabel = currentComplaint.complaintCode || currentComplaint.id;
        await notifyDepartmentOfficers(tx, {
          departmentId: currentComplaint.departmentId,
          type: 'COMPLAINT', title: 'New complaint received',
          message: `Complaint ${complaintLabel} has a photograph verified within 500 metres and is ready for review.`,
          complaintId: currentComplaint.id, relatedEntityType: 'COMPLAINT', relatedEntityId: currentComplaint.id,
          targetUrl: '/officer/complaints', eventKey: `new-complaint:${currentComplaint.id}`,
        });
        const pendingDuplicates = await tx.duplicateComplaintMatch.findMany({
          where: { complaintId: currentComplaint.id, decision: { in: ['PENDING', 'KEEP_REVIEWING'] } },
          select: { id: true },
        });
        if (pendingDuplicates.length) await notifyDepartmentOfficers(tx, {
          departmentId: currentComplaint.departmentId,
          type: 'COMPLAINT', title: 'Potential duplicate needs review',
          message: `Complaint ${complaintLabel} has a calculated potential match.`,
          complaintId: currentComplaint.id, relatedEntityType: 'COMPLAINT', relatedEntityId: currentComplaint.id,
          targetUrl: '/officer/duplicates', eventKey: `duplicate-review:${currentComplaint.id}`,
        });
      }
      return tx.complaint.findUnique({
        where: { id: currentComplaint.id },
        include: { ...complaintInclude, duplicateMatches: { include: { matchedComplaint: { include: complaintInclude } } } },
      });
    });
    if (!record) return res.status(409).json({ success: false, errors: { general: 'Verification status changed. Refresh the complaint and try again if needed.' } });
    return res.json({ success: true, data: toMapRecord(record) });
  } catch (error) {
    return next(error);
  }
}

export async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createComplaint(req, res, next) {
  try {
    const { title, categoryId, description, address, latitude, longitude, photos = [] } = req.body;
    const errors = {};
    if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 255) errors.title = 'Title must be between 5 and 255 characters.';
    if (!Number.isInteger(Number(categoryId))) errors.categoryId = 'Select a valid complaint category.';
    if (typeof description !== 'string' || description.trim().length < 15) errors.description = 'Description must contain at least 15 characters.';
    if (typeof address !== 'string' || !address.trim()) errors.address = 'A street address or landmark is required.';
    const hasLatitude = latitude !== undefined && latitude !== null;
    const hasLongitude = longitude !== undefined && longitude !== null;
    if (hasLatitude !== hasLongitude) errors.latitude = 'Provide both complaint coordinates or leave both unavailable.';
    if (hasLatitude && (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90)) errors.latitude = 'Select a valid map location.';
    if (hasLongitude && (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180)) errors.longitude = 'Select a valid map location.';
    if (Object.keys(errors).length) return res.status(422).json({ success: false, errors });

    const category = await prisma.category.findFirst({ where: { id: Number(categoryId), isActive: true } });
    if (!category) return res.status(422).json({ success: false, errors: { categoryId: 'The selected category is unavailable.' } });

    const photoParse = await parseComplaintSubmissionPhotos(photos, null, PHOTO_LOCATION_THRESHOLD_METRES);
    if (photoParse.error) return res.status(422).json({ success: false, errors: { photos: photoParse.error } });
    const photoRecords = photoParse.records;
    const duplicateCandidates = await findDuplicateCandidates(prisma, {
      title: title.trim(), description: description.trim(), categoryId: category.id,
      address: address.trim(), latitude, longitude, photos: photoRecords,
    });
    const classification = duplicateCandidates[0]?.classification || 'NEW';
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.complaint.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          address: address.trim().slice(0, 500),
          latitude,
          longitude,
          userId: req.user.id,
          categoryId: category.id,
          departmentId: category.departmentId,
          duplicateClassification: classification,
          duplicateReviewStatus: duplicateCandidates.length ? 'PENDING_REVIEW' : 'NOT_REQUIRED',
          statusHistory: {
            create: {
              newStatus: 'PENDING',
              title: 'Complaint Registered',
              notes: 'Customer submitted this complaint.',
              performedByUserId: req.user.id,
              performedByName: req.user.name,
            },
          },
        },
        include: complaintInclude,
      });
      const confirmedComplaintLocation = await tx.complaint.findUnique({
        where: { id: created.id },
        select: { latitude: true, longitude: true },
      });
      const verifiedPhotoRecords = verifyPhotoLocationRecords(
        photoRecords,
        confirmedComplaintLocation,
        PHOTO_LOCATION_THRESHOLD_METRES,
      );
      const municipalEligible = hasVerifiedComplaintPhoto({ photos: verifiedPhotoRecords });
      for (const photo of verifiedPhotoRecords) {
        await tx.complaintPhoto.create({
          data: { ...photo, complaintId: created.id, uploadedById: req.user.id },
        });
      }
      const complaintLabel = created.complaintCode || created.id;
      await notifyUser(tx, {
        userId: req.user.id, role: 'CITIZEN', type: 'COMPLAINT',
        title: 'Complaint submitted', message: `Your complaint ${complaintLabel} was submitted successfully.`,
        complaintId: created.id, relatedEntityType: 'COMPLAINT', relatedEntityId: created.id,
        targetUrl: `/citizen/complaints/${encodeURIComponent(complaintLabel)}`,
        eventKey: `complaint-submitted:${created.id}`,
      });
      if (municipalEligible) await notifyDepartmentOfficers(tx, {
        departmentId: category.departmentId,
        type: 'COMPLAINT', title: 'New complaint received',
        message: `Complaint ${complaintLabel} has a photograph verified within 500 metres and is ready for review.`,
        complaintId: created.id, relatedEntityType: 'COMPLAINT', relatedEntityId: created.id,
        targetUrl: '/officer/complaints', eventKey: `new-complaint:${created.id}`,
      });
      if (municipalEligible && duplicateCandidates.length) {
        await notifyDepartmentOfficers(tx, {
          departmentId: category.departmentId,
          type: 'COMPLAINT', title: 'Potential duplicate needs review',
          message: `Complaint ${complaintLabel} has a calculated potential match.`,
          complaintId: created.id, relatedEntityType: 'COMPLAINT', relatedEntityId: created.id,
          targetUrl: '/officer/duplicates', eventKey: `duplicate-review:${created.id}`,
        });
      }
      if (duplicateCandidates.length) {
        await tx.duplicateComplaintMatch.createMany({
          data: duplicateCandidates.map((candidate) => ({
            complaintId: created.id,
            matchedComplaintId: candidate.matchedComplaintId,
            similarityScore: candidate.similarityScore,
            classification: candidate.classification,
            comparison: candidate.comparison,
          })),
        });
      }
      return tx.complaint.findUnique({ where: { id: created.id }, include: { ...complaintInclude, duplicateMatches: { include: { matchedComplaint: { include: complaintInclude } } } } });
    });
    res.status(201).json({ success: true, data: toMapRecord(record) });
  } catch (error) {
    next(error);
  }
}

export async function reviewComplaintPhotoLocation(req, res, next) {
  try {
    const { decision, notes = '' } = req.body || {};
    if (!['ACKNOWLEDGED', 'FLAGGED', 'CLEAR'].includes(decision)) {
      return res.status(422).json({ success: false, errors: { decision: 'Choose acknowledge, flag, or clear the review.' } });
    }
    if (typeof notes !== 'string' || notes.length > 1000) {
      return res.status(422).json({ success: false, errors: { notes: 'Review notes must be 1,000 characters or fewer.' } });
    }

    const complaint = await prisma.complaint.findFirst({
      where: { AND: [{ OR: [{ id: req.params.id }, { complaintCode: req.params.id }] }, VERIFIED_COMPLAINT_WHERE] },
      select: { id: true, complaintCode: true },
    });
    if (!complaint) return res.status(404).json({ success: false, errors: { general: 'Complaint not found.' } });
    const photo = await prisma.complaintPhoto.findFirst({
      where: { id: req.params.photoId, complaintId: complaint.id },
      select: { id: true, locationVerificationStatus: true },
    });
    if (!photo) return res.status(404).json({ success: false, errors: { general: 'Complaint photo not found.' } });

    const reviewedAt = decision === 'CLEAR' ? null : new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.complaintPhoto.update({
        where: { id: photo.id },
        data: {
          locationReviewDecision: decision === 'CLEAR' ? null : decision,
          locationReviewedByUserId: decision === 'CLEAR' ? null : req.user.id,
          locationReviewedAt: reviewedAt,
          locationReviewNotes: decision === 'CLEAR' ? null : notes.trim() || null,
        },
        select: {
          id: true,
          locationVerificationStatus: true,
          locationReviewDecision: true,
          locationReviewedAt: true,
          locationReviewNotes: true,
          locationReviewedBy: { select: { id: true, name: true } },
        },
      });
      await tx.auditLog.create({ data: {
        userId: req.user.id,
        actorName: req.user.name,
        action: 'REVIEW_COMPLAINT_PHOTO_LOCATION',
        entityType: 'ComplaintPhoto',
        entityId: photo.id,
        affectedRecord: `Complaint ${complaint.complaintCode || complaint.id}`,
        details: `Officer ${decision === 'CLEAR' ? 'cleared' : decision.toLowerCase()} the photo location review. Automatic result: ${photo.locationVerificationStatus}.${notes.trim() ? ` Notes: ${notes.trim()}` : ''}`,
        ipAddress: req.ip || null,
      } });
      return result;
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
}

export async function listOfficerComplaints(req, res, next) {
  try {
    const records = await prisma.complaint.findMany({
      where: VERIFIED_COMPLAINT_WHERE,
      include: complaintListInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { complaints: records.map(toMapRecord) } });
  } catch (error) {
    next(error);
  }
}

export async function getOfficerComplaint(req, res, next) {
  try {
    const record = await prisma.complaint.findFirst({
      where: { AND: [{ OR: [{ id: req.params.id }, { complaintCode: req.params.id }] }, VERIFIED_COMPLAINT_WHERE] },
      include: { ...complaintInclude, duplicateOf: { select: { id: true, complaintCode: true, title: true, photos: { where: { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' }, select: { photoType: true, locationVerificationStatus: true } } } }, duplicateMatches: { include: { matchedComplaint: { include: complaintInclude } }, orderBy: { similarityScore: 'desc' } } },
    });
    if (!record) return res.status(404).json({ success: false, errors: { general: 'Complaint not found.' } });
    return res.json({ success: true, data: toMunicipalMapRecord(record) });
  } catch (error) {
    next(error);
  }
}

export async function listDuplicateReviews(req, res, next) {
  try {
    const totalComplaints = await prisma.complaint.count({ where: VERIFIED_COMPLAINT_WHERE });
    if (totalComplaints > 1) await refreshDuplicateCandidates(prisma);
    const matches = await prisma.duplicateComplaintMatch.findMany({
      where: {
        decision: { in: ['PENDING', 'KEEP_REVIEWING'] },
        complaint: VERIFIED_COMPLAINT_WHERE,
        matchedComplaint: VERIFIED_COMPLAINT_WHERE,
      },
      include: {
        complaint: { include: complaintInclude },
        matchedComplaint: { include: complaintInclude },
      },
      orderBy: [{ similarityScore: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, data: { totalComplaints, matches: matches.map((match) => ({
      id: match.id,
      similarityScore: match.similarityScore,
      classification: match.classification,
      comparison: match.comparison,
      decision: match.decision,
      complaint: toMunicipalMapRecord(match.complaint),
      matchedComplaint: toMunicipalMapRecord(match.matchedComplaint),
    })) } });
  } catch (error) {
    next(error);
  }
}

export async function reviewDuplicateMatch(req, res, next) {
  try {
    const { decision, matchedComplaintId } = req.body;
    if (!['LINK', 'SEPARATE', 'KEEP_REVIEWING'].includes(decision)) {
      return res.status(422).json({ success: false, errors: { decision: 'Choose LINK, SEPARATE, or KEEP_REVIEWING.' } });
    }
    const match = await prisma.duplicateComplaintMatch.findFirst({
      where: {
        id: req.params.matchId,
        complaint: VERIFIED_COMPLAINT_WHERE,
        matchedComplaint: VERIFIED_COMPLAINT_WHERE,
      },
    });
    if (!match) return res.status(404).json({ success: false, errors: { general: 'Duplicate match not found.' } });
    if (decision === 'LINK' && matchedComplaintId !== match.matchedComplaintId) {
      return res.status(422).json({ success: false, errors: { matchedComplaintId: 'Select the matched complaint shown in this review.' } });
    }

    await prisma.$transaction(async (tx) => {
      const reviewedDecision = decision === 'LINK' ? 'LINKED' : decision === 'SEPARATE' ? 'SEPARATE' : 'KEEP_REVIEWING';
      await tx.duplicateComplaintMatch.update({
        where: { id: match.id },
        data: { decision: reviewedDecision, reviewedByUserId: req.user.id, reviewedAt: new Date() },
      });
      if (decision === 'LINK') {
        await tx.complaint.update({ where: { id: match.complaintId }, data: { duplicateOfId: match.matchedComplaintId, duplicateReviewStatus: 'LINKED_TO_EXISTING' } });
        // A chosen canonical complaint resolves the other candidate rows for this
        // report, so the review queue does not keep offering stale alternatives.
        await tx.duplicateComplaintMatch.updateMany({
          where: { complaintId: match.complaintId, id: { not: match.id }, decision: { in: ['PENDING', 'KEEP_REVIEWING'] } },
          data: { decision: 'SEPARATE', reviewedByUserId: req.user.id, reviewedAt: new Date() },
        });
        const source = await tx.complaint.findUnique({ where: { id: match.complaintId }, select: { status: true } });
        await tx.complaintStatusHistory.create({ data: {
          complaintId: match.complaintId,
          previousStatus: source.status,
          newStatus: source.status,
          title: 'Linked to a related complaint',
          notes: `Linked to complaint ${match.matchedComplaintId} after officer review. Original customer report retained.`,
          performedByUserId: req.user.id,
          performedByName: req.user.name,
        } });
      } else if (decision === 'SEPARATE') {
        await tx.complaint.update({ where: { id: match.complaintId }, data: { duplicateOfId: null, duplicateReviewStatus: 'MARKED_SEPARATE' } });
        await tx.duplicateComplaintMatch.updateMany({
          where: { complaintId: match.complaintId, id: { not: match.id }, decision: { in: ['PENDING', 'KEEP_REVIEWING'] } },
          data: { decision: 'SEPARATE', reviewedByUserId: req.user.id, reviewedAt: new Date() },
        });
      }
      if (decision !== 'KEEP_REVIEWING') {
        const source = await tx.complaint.findUnique({
          where: { id: match.complaintId },
          select: { userId: true, complaintCode: true, assignedOfficerId: true },
        });
        const decisionMessage = decision === 'LINK'
          ? `Complaint ${source.complaintCode || match.complaintId} was linked to an existing report after municipal review. Your report remains available.`
          : `Complaint ${source.complaintCode || match.complaintId} was reviewed and marked as a separate issue.`;
        await notifyUser(tx, {
          userId: source.userId, role: 'CITIZEN', type: 'COMPLAINT',
          title: decision === 'LINK' ? 'Duplicate review completed' : 'Complaint review completed',
          message: decisionMessage, complaintId: match.complaintId,
          relatedEntityType: 'COMPLAINT', relatedEntityId: match.complaintId,
          targetUrl: `/citizen/complaints/${encodeURIComponent(source.complaintCode || match.complaintId)}`,
          eventKey: `duplicate-decision:${match.id}:${reviewedDecision}`,
        });
        await notifyUser(tx, {
          userId: req.user.id, role: 'OFFICER', type: 'COMPLAINT',
          title: 'Duplicate review decision saved',
          message: `Your decision for complaint ${source.complaintCode || match.complaintId} was saved.`,
          complaintId: match.complaintId, relatedEntityType: 'COMPLAINT', relatedEntityId: match.complaintId,
          targetUrl: '/officer/duplicates', eventKey: `duplicate-decision-reviewer:${match.id}:${reviewedDecision}`,
        });
        if (source.assignedOfficerId && source.assignedOfficerId !== req.user.id) {
          await notifyUser(tx, {
            userId: source.assignedOfficerId, role: 'OFFICER', type: 'COMPLAINT',
            title: 'Duplicate review decision recorded',
            message: `Complaint ${source.complaintCode || match.complaintId} was ${decision === 'LINK' ? 'linked to the primary report' : 'marked as separate'}.`,
            complaintId: match.complaintId, relatedEntityType: 'COMPLAINT', relatedEntityId: match.complaintId,
            targetUrl: '/officer/duplicates', eventKey: `duplicate-decision-officer:${match.id}:${reviewedDecision}`,
          });
        }
      }
    });
    return res.json({ success: true, message: decision === 'LINK' ? 'Complaint linked; both customer reports remain available.' : decision === 'SEPARATE' ? 'Complaint marked as a separate issue.' : 'Match kept open for further review.' });
  } catch (error) {
    next(error);
  }
}

export async function listOfficerMapComplaints(req, res, next) {
  try {
    const [records, unmappedCount] = await Promise.all([
      prisma.complaint.findMany({
        where: { AND: [VERIFIED_COMPLAINT_WHERE, { latitude: { not: null }, longitude: { not: null } }] },
        include: complaintInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where: { AND: [VERIFIED_COMPLAINT_WHERE, { OR: [{ latitude: null }, { longitude: null }] }] } }),
    ]);
    res.json({ success: true, data: { complaints: records.map(toMunicipalMapRecord), unmappedCount } });
  } catch (error) {
    next(error);
  }
}

const ALLOWED_COMPLAINT_STATUSES = ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export async function updateComplaintStatus(req, res, next) {
  try {
    const { status, remarks } = req.body;
    if (!ALLOWED_COMPLAINT_STATUSES.includes(status)) {
      return res.status(422).json({ success: false, errors: { status: 'Choose a supported complaint status.' } });
    }
    if (remarks !== undefined && (typeof remarks !== 'string' || remarks.length > 5000)) {
      return res.status(422).json({ success: false, errors: { remarks: 'Remarks must be 5,000 characters or fewer.' } });
    }

    const current = await prisma.complaint.findFirst({
      where: { AND: [{ OR: [{ id: req.params.id }, { complaintCode: req.params.id }] }, VERIFIED_COMPLAINT_WHERE] },
      select: { id: true, status: true, userId: true, complaintCode: true, assignedOfficerId: true },
    });
    if (!current) return res.status(404).json({ success: false, errors: { general: 'Complaint not found.' } });
    if (status === 'RESOLVED') {
      const activeAssignment = await prisma.workOrder.findFirst({
        where: { complaintId: current.id, status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'REWORK_REQUIRED'] } },
        select: { id: true },
      });
      if (activeAssignment) return res.status(409).json({ success: false, errors: { general: 'This complaint can be resolved after a Field Supervisor submits completion and a Municipal Officer verifies it.' } });
    }

    const normalizedRemarks = typeof remarks === 'string' ? remarks.trim() : '';
    if (status === 'REJECTED' && !normalizedRemarks) {
      return res.status(422).json({ success: false, errors: { remarks: 'A rejection reason is required.' } });
    }
    const record = await prisma.$transaction(async (tx) => {
      await tx.complaint.update({
        where: { id: current.id },
        data: {
          status,
          resolvedAt: status === 'RESOLVED' ? new Date() : null,
          resolutionNotes: status === 'RESOLVED' ? (normalizedRemarks || undefined) : null,
          rejectionReason: status === 'REJECTED' ? normalizedRemarks : null,
        },
      });
      const statusHistory = await tx.complaintStatusHistory.create({
        data: {
          complaintId: current.id,
          previousStatus: current.status,
          newStatus: status,
          title: `Status changed to ${status.replaceAll('_', ' ')}`,
          notes: normalizedRemarks || null,
          performedByUserId: req.user.id,
          performedByName: req.user.name,
        },
      });
      if (status !== current.status) {
        const statusLabel = status.replaceAll('_', ' ').toLowerCase();
        await tx.notification.create({
          data: {
            notificationCode: `STATUS-${statusHistory.id}`,
            userId: current.userId,
            targetRole: 'CITIZEN',
            notificationType: 'COMPLAINT',
            title: `Complaint ${statusLabel}`,
            message: `Your complaint ${current.complaintCode || current.id} is now ${statusLabel}.${normalizedRemarks ? ` ${normalizedRemarks}` : ''}`,
            complaintId: current.id,
            linkId: current.id,
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: current.id,
            targetUrl: `/citizen/complaints/${encodeURIComponent(current.complaintCode || current.id)}`,
            readAt: null,
          },
        });
        if (current.assignedOfficerId && current.assignedOfficerId !== req.user.id) {
          await notifyUser(tx, {
            userId: current.assignedOfficerId, role: 'OFFICER', type: 'COMPLAINT',
            title: `Complaint ${statusLabel}`,
            message: `Complaint ${current.complaintCode || current.id} changed to ${statusLabel}.${normalizedRemarks ? ` ${normalizedRemarks}` : ''}`,
            complaintId: current.id, relatedEntityType: 'COMPLAINT', relatedEntityId: current.id,
            targetUrl: '/officer/complaints', eventKey: `complaint-status:${current.id}:${status}:${Date.now()}`,
          });
        }
      }
      return tx.complaint.findUnique({ where: { id: current.id }, include: complaintInclude });
    });

    return res.json({ success: true, data: toMunicipalMapRecord(record) });
  } catch (error) {
    next(error);
  }
}
