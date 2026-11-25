import { prisma } from '../lib/prisma.js';

const ROLE_NAMES = ['CITIZEN', 'OFFICER', 'SUPERVISOR', 'ADMIN', 'SUPPLIER'];
const COMPLAINT_STATUSES = ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const PHOTO_VERIFIED = { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' };

function summarizeComplaints(complaints, users) {
  let verifiedComplaints = 0;
  let rejectedComplaints = 0;
  let pendingVerificationComplaints = 0;
  let assignedComplaints = 0;
  let inProgressComplaints = 0;
  let completedComplaints = 0;
  const statusCounts = new Map(COMPLAINT_STATUSES.map((status) => [status, 0]));
  const categories = new Map();

  for (const complaint of complaints) {
    const verified = (complaint.photos || []).some((photo) => photo.photoType === 'INITIAL_EVIDENCE' && photo.locationVerificationStatus === 'VERIFIED');
    const mismatch = (complaint.photos || []).some((photo) => photo.photoType === 'INITIAL_EVIDENCE' && photo.locationVerificationStatus === 'REJECTED_LOCATION_MISMATCH');
    if (complaint.status === 'REJECTED' || (!verified && mismatch)) rejectedComplaints += 1;
    else if (verified) verifiedComplaints += 1;
    else pendingVerificationComplaints += 1;

    statusCounts.set(complaint.status, (statusCounts.get(complaint.status) || 0) + 1);
    const categoryName = complaint.category?.name || 'Uncategorized';
    categories.set(categoryName, (categories.get(categoryName) || 0) + 1);
    if (complaint.assignedOfficerId || (complaint.workOrders || []).length) assignedComplaints += 1;
    if (complaint.status === 'IN_PROGRESS' || (complaint.workOrders || []).some((order) => order.status === 'IN_PROGRESS')) inProgressComplaints += 1;
    if (complaint.status === 'RESOLVED') completedComplaints += 1;
  }

  const roles = new Map(ROLE_NAMES.map((role) => [role, 0]));
  for (const user of users) roles.set(user.role, (roles.get(user.role) || 0) + 1);
  const totalComplaints = complaints.length;
  return {
    stats: {
      totalRegisteredCitizens: roles.get('CITIZEN') || 0,
      totalMunicipalOfficers: roles.get('OFFICER') || 0,
      totalFieldSupervisors: roles.get('SUPERVISOR') || 0,
      totalComplaints,
      verifiedComplaints,
      rejectedComplaints,
      pendingVerificationComplaints,
      assignedComplaints,
      inProgressComplaints,
      completedComplaints,
      unresolvedComplaints: totalComplaints - completedComplaints,
      resolutionRate: totalComplaints ? Math.round((completedComplaints / totalComplaints) * 100) : 0,
    },
    complaintsByStatus: [...statusCounts].map(([status, count]) => ({ status, count })),
    complaintsByCategory: [...categories].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)),
    usersByRole: [...roles].map(([role, count]) => ({ role, count })),
  };
}

function buildTrends(complaints, range, now = new Date()) {
  const daysByRange = { '7_DAYS': 7, '30_DAYS': 30, '90_DAYS': 90, YEAR: 365 };
  const days = daysByRange[range] || 30;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  const buckets = new Map();
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, { date: key, submitted: 0, resolved: 0 });
  }
  for (const complaint of complaints) {
    const submittedAt = complaint.createdAt instanceof Date ? complaint.createdAt : new Date(complaint.createdAt);
    const submittedKey = submittedAt.toISOString().slice(0, 10);
    if (buckets.has(submittedKey)) buckets.get(submittedKey).submitted += 1;
    if (complaint.resolvedAt) {
      const resolvedAt = complaint.resolvedAt instanceof Date ? complaint.resolvedAt : new Date(complaint.resolvedAt);
      const resolvedKey = resolvedAt.toISOString().slice(0, 10);
      if (buckets.has(resolvedKey)) buckets.get(resolvedKey).resolved += 1;
    }
  }
  return [...buckets.values()];
}

function activityFromStatus(entry) {
  return {
    id: `complaint-status:${entry.id}`,
    type: 'COMPLAINT',
    title: entry.title,
    description: entry.notes || `${entry.previousStatus || 'New'} → ${entry.newStatus}`,
    actor: entry.performedByName,
    at: entry.createdAt,
    complaintCode: entry.complaint.complaintCode || entry.complaint.id,
  };
}

export async function getAdminDashboard(req, res, next) {
  try {
    const range = ['7_DAYS', '30_DAYS', '90_DAYS', 'YEAR'].includes(req.query.range) ? req.query.range : '30_DAYS';
    const [users, complaints, departments, recentUsers, complaintHistory, workOrderHistory, photoEvents] = await Promise.all([
      prisma.user.findMany({ select: { id: true, role: true } }),
      prisma.complaint.findMany({
        select: {
          id: true, complaintCode: true, title: true, status: true, createdAt: true, resolvedAt: true,
          assignedOfficerId: true, departmentId: true,
          department: { select: { name: true } },
          category: { select: { name: true } },
          photos: { where: { photoType: 'INITIAL_EVIDENCE' }, select: { photoType: true, locationVerificationStatus: true } },
          workOrders: { select: { status: true } },
        },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, categories: { select: { id: true } }, _count: { select: { users: true, complaints: true, workOrders: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({ take: 12, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, role: true, createdAt: true } }),
      prisma.complaintStatusHistory.findMany({
        take: 20, orderBy: { createdAt: 'desc' },
        include: { complaint: { select: { id: true, complaintCode: true, title: true } } },
      }),
      prisma.workOrderStatusHistory.findMany({
        take: 20, orderBy: { createdAt: 'desc' },
        include: { workOrder: { select: { id: true, workOrderCode: true, complaint: { select: { id: true, complaintCode: true, title: true } } } } },
      }),
      prisma.complaintPhoto.findMany({
        where: { photoType: 'INITIAL_EVIDENCE' }, take: 20, orderBy: { createdAt: 'desc' },
        select: { id: true, locationVerificationStatus: true, createdAt: true, complaint: { select: { id: true, complaintCode: true, title: true } } },
      }),
    ]);

    const summary = summarizeComplaints(complaints, users);
    const trends = buildTrends(complaints, range);
    const departmentPerformance = new Map(departments.map((department) => [department.id, {
      name: department.name.length > 18 ? `${department.name.slice(0, 16)}…` : department.name,
      fullName: department.name,
      reported: 0,
      resolved: 0,
    }]));
    for (const complaint of complaints) {
      const key = complaint.departmentId ?? 'unassigned';
      if (!departmentPerformance.has(key)) {
        const name = complaint.department?.name || 'Unassigned';
        departmentPerformance.set(key, { name, fullName: name, reported: 0, resolved: 0 });
      }
      const item = departmentPerformance.get(key);
      item.reported += 1;
      if (complaint.status === 'RESOLVED') item.resolved += 1;
    }
    const activities = [
      ...recentUsers.map((user) => ({ id: `user:${user.id}`, type: 'USER', title: 'New user registered', description: `${user.name} joined as ${user.role.toLowerCase().replaceAll('_', ' ')}.`, actor: user.name, at: user.createdAt })),
      ...complaintHistory.map(activityFromStatus),
      ...workOrderHistory.map((entry) => ({
        id: `work-order-status:${entry.id}`,
        type: 'WORK_ORDER',
        title: `Work order ${entry.newStatus.toLowerCase().replaceAll('_', ' ')}`,
        description: `${entry.workOrder.complaint.complaintCode || entry.workOrder.complaint.id} · ${entry.workOrder.complaint.title}${entry.notes ? ` — ${entry.notes}` : ''}`,
        actor: entry.changedByName,
        at: entry.createdAt,
        complaintCode: entry.workOrder.complaint.complaintCode || entry.workOrder.complaint.id,
        workOrderCode: entry.workOrder.workOrderCode || entry.workOrder.id,
      })),
      ...photoEvents.map((photo) => ({
        id: `photo-verification:${photo.id}`,
        type: 'VERIFICATION',
        title: `Complaint photo ${photo.locationVerificationStatus.toLowerCase().replaceAll('_', ' ')}`,
        description: `${photo.complaint.complaintCode || photo.complaint.id} · ${photo.complaint.title}`,
        actor: 'Verification service',
        at: photo.createdAt,
        complaintCode: photo.complaint.complaintCode || photo.complaint.id,
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);

    return res.json({
      success: true,
      data: {
        ...summary,
        complaintsByStatus: summary.complaintsByStatus.map((item) => ({ ...item, label: item.status.replaceAll('_', ' ') })),
        complaintsByCategory: summary.complaintsByCategory,
        departmentPerformance: [...departmentPerformance.values()],
        usersByRole: summary.usersByRole,
        submissionAndResolutionTrends: trends,
        activities,
        departments: departments.map((department) => ({ ...department, categoryCount: department.categories.length })),
        refreshedAt: new Date(),
      },
      source: 'database',
    });
  } catch (error) {
    next(error);
  }
}
