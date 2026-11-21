import { prisma } from '../lib/prisma.js';

const complaintInclude = {
  category: { select: { id: true, name: true } },
  department: { select: { name: true } },
  user: { select: { id: true, name: true, email: true, phone: true } },
  assignedOfficer: { select: { id: true, name: true, email: true, phone: true } },
  photos: { select: { id: true, imageUrl: true, caption: true, photoType: true, createdAt: true } },
  workOrders: {
    select: { id: true, workOrderCode: true, supervisorName: true, assignedCrew: true, supervisor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  statusHistory: { select: { newStatus: true, title: true, notes: true, performedByName: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
};

function toMapRecord(record) {
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
    photos: record.photos.map((photo) => photo.imageUrl),
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

    const photoUrls = Array.isArray(photos)
      ? [...new Set(photos.filter((url) => typeof url === 'string' && url.length <= 1000 && /^https?:\/\//i.test(url)))].slice(0, 8)
      : [];
    const record = await prisma.complaint.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        address: address.trim().slice(0, 500),
        latitude,
        longitude,
        userId: req.user.id,
        categoryId: category.id,
        departmentId: category.departmentId,
        photos: photoUrls.length ? { create: photoUrls.map((imageUrl) => ({ imageUrl, uploadedById: req.user.id })) } : undefined,
      },
      include: complaintInclude,
    });
    res.status(201).json({ success: true, data: toMapRecord(record) });
  } catch (error) {
    next(error);
  }
}

export async function listOfficerComplaints(req, res, next) {
  try {
    const access = {
      OR: [
        { assignedOfficerId: req.user.id },
        ...(req.user.departmentId ? [{ departmentId: req.user.departmentId }] : []),
      ],
    };
    const [records, unmappedCount] = await Promise.all([
      prisma.complaint.findMany({
        where: { ...access, latitude: { not: null }, longitude: { not: null } },
        include: complaintInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({
        where: { AND: [access, { OR: [{ latitude: null }, { longitude: null }] }] },
      }),
    ]);
    res.json({ success: true, data: { complaints: records.map(toMapRecord), unmappedCount } });
  } catch (error) {
    next(error);
  }
}
