import { prisma } from '../lib/prisma.js';
import { normalizePhoto, parseComplaintPhotos } from '../lib/photoUtils.js';
import { findDuplicateCandidates } from '../lib/duplicateDetection.js';

const complaintInclude = {
  category: { select: { id: true, name: true } },
  department: { select: { name: true } },
  user: { select: { id: true, name: true, email: true, phone: true } },
  assignedOfficer: { select: { id: true, name: true, email: true, phone: true } },
  photos: { select: { id: true, imageUrl: true, caption: true, photoType: true, createdAt: true } },
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
delete complaintListInclude.photos;
delete complaintListInclude.workOrders;
complaintListInclude._count = { select: { photos: true } };

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
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.latitude = 'Select a valid map location.';
    if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.longitude = 'Select a valid map location.';
    if (Object.keys(errors).length) return res.status(422).json({ success: false, errors });

    const category = await prisma.category.findFirst({ where: { id: Number(categoryId), isActive: true } });
    if (!category) return res.status(422).json({ success: false, errors: { categoryId: 'The selected category is unavailable.' } });

    const photoRecords = parseComplaintPhotos(photos);
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
          photos: photoRecords.length ? { create: photoRecords.map((photo) => ({ ...photo, uploadedById: req.user.id })) } : undefined,
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

export async function listOfficerComplaints(req, res, next) {
  try {
    const records = await prisma.complaint.findMany({
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
      where: { OR: [{ id: req.params.id }, { complaintCode: req.params.id }] },
      include: { ...complaintInclude, duplicateOf: { select: { id: true, complaintCode: true, title: true } }, duplicateMatches: { include: { matchedComplaint: { include: complaintInclude } }, orderBy: { similarityScore: 'desc' } } },
    });
    if (!record) return res.status(404).json({ success: false, errors: { general: 'Complaint not found.' } });
    return res.json({ success: true, data: toMapRecord(record) });
  } catch (error) {
    next(error);
  }
}

export async function listDuplicateReviews(req, res, next) {
  try {
    const matches = await prisma.duplicateComplaintMatch.findMany({
      where: { decision: { in: ['PENDING', 'KEEP_REVIEWING'] } },
      include: {
        complaint: { include: complaintInclude },
        matchedComplaint: { include: complaintInclude },
      },
      orderBy: [{ similarityScore: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, data: matches.map((match) => ({
      id: match.id,
      similarityScore: match.similarityScore,
      classification: match.classification,
      comparison: match.comparison,
      decision: match.decision,
      complaint: toMapRecord(match.complaint),
      matchedComplaint: toMapRecord(match.matchedComplaint),
    })) });
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
    const match = await prisma.duplicateComplaintMatch.findUnique({ where: { id: req.params.matchId } });
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
        where: { latitude: { not: null }, longitude: { not: null } },
        include: complaintInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where: { OR: [{ latitude: null }, { longitude: null }] } }),
    ]);
    res.json({ success: true, data: { complaints: records.map(toMapRecord), unmappedCount } });
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
      where: { OR: [{ id: req.params.id }, { complaintCode: req.params.id }] },
      select: { id: true, status: true, userId: true, complaintCode: true },
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
      await tx.complaintStatusHistory.create({
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
            userId: current.userId,
            targetRole: 'CITIZEN',
            notificationType: 'COMPLAINT',
            title: `Complaint ${statusLabel}`,
            message: `Your complaint ${current.complaintCode || current.id} is now ${statusLabel}.${normalizedRemarks ? ` ${normalizedRemarks}` : ''}`,
            complaintId: current.id,
            linkId: current.id,
          },
        });
      }
      return tx.complaint.findUnique({ where: { id: current.id }, include: complaintInclude });
    });

    return res.json({ success: true, data: toMapRecord(record) });
  } catch (error) {
    next(error);
  }
}
