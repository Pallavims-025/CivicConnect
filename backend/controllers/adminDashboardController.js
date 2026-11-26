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

function getMockAdminDashboardData(range = '30_DAYS') {
  const daysByRange = { '7_DAYS': 7, '30_DAYS': 30, '90_DAYS': 90, YEAR: 365 };
  const days = daysByRange[range] || 30;
  const now = new Date();
  const trends = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const submitted = Math.max(1, Math.floor(Math.sin(i / 2) * 3 + 6));
    const resolved = Math.max(0, Math.floor(Math.cos(i / 2) * 2 + 5));
    trends.push({ date: key, submitted, resolved });
  }

  return {
    stats: {
      totalRegisteredCitizens: 1248,
      totalMunicipalOfficers: 38,
      totalFieldSupervisors: 14,
      totalComplaints: 342,
      verifiedComplaints: 289,
      rejectedComplaints: 18,
      pendingVerificationComplaints: 35,
      assignedComplaints: 215,
      inProgressComplaints: 84,
      completedComplaints: 198,
      unresolvedComplaints: 144,
      resolutionRate: 58,
    },
    complaintsByStatus: [
      { status: 'PENDING', label: 'PENDING', count: 35 },
      { status: 'UNDER_REVIEW', label: 'UNDER REVIEW', count: 25 },
      { status: 'IN_PROGRESS', label: 'IN PROGRESS', count: 84 },
      { status: 'RESOLVED', label: 'RESOLVED', count: 198 },
      { status: 'REJECTED', label: 'REJECTED', count: 18 },
    ],
    complaintsByCategory: [
      { category: 'Potholes & Road Damage', count: 112 },
      { category: 'Garbage & Solid Waste', count: 89 },
      { category: 'Streetlight Failure', count: 64 },
      { category: 'Water Pipeline Leakage', count: 47 },
      { category: 'Drainage & Sewage', count: 30 },
    ],
    departmentPerformance: [
      { name: 'Roads & Infra', fullName: 'Road Infrastructure & Maintenance', reported: 112, resolved: 78 },
      { name: 'Solid Waste Mgmt', fullName: 'Solid Waste Management', reported: 89, resolved: 62 },
      { name: 'Electrical & Light', fullName: 'Street Lighting & Electrical Works', reported: 64, resolved: 41 },
      { name: 'Water & Sewage', fullName: 'Water Supply & Sewage Board', reported: 47, resolved: 29 },
    ],
    usersByRole: [
      { role: 'CITIZEN', count: 1248 },
      { role: 'OFFICER', count: 38 },
      { role: 'SUPERVISOR', count: 14 },
      { role: 'ADMIN', count: 4 },
    ],
    submissionAndResolutionTrends: trends,
    activities: [
      {
        id: 'act-1',
        type: 'COMPLAINT',
        title: 'Road repair in progress',
        description: 'CMP-2026-089 · Indiranagar 100ft road pothole patch underway by Ward 8 team',
        actor: 'Dr. Aruna Rao',
        at: new Date(Date.now() - 1000 * 60 * 15),
        complaintCode: 'CMP-2026-089',
      },
      {
        id: 'act-2',
        type: 'VERIFICATION',
        title: 'Complaint photo verified',
        description: 'CMP-2026-092 · GPS coordinates matched within 12 meters of civic asset tag',
        actor: 'Verification service',
        at: new Date(Date.now() - 1000 * 60 * 45),
        complaintCode: 'CMP-2026-092',
      },
      {
        id: 'act-3',
        type: 'WORK_ORDER',
        title: 'Work order dispatched',
        description: 'WO-2026-031 · Drainage cleaning assigned to Field Supervisor Rajesh Kumar',
        actor: 'Santosh (Admin)',
        at: new Date(Date.now() - 1000 * 60 * 120),
        complaintCode: 'CMP-2026-074',
        workOrderCode: 'WO-2026-031',
      },
      {
        id: 'act-4',
        type: 'USER',
        title: 'New user registered',
        description: 'Kavita Nair joined as officer.',
        actor: 'Kavita Nair',
        at: new Date(Date.now() - 1000 * 60 * 240),
      },
    ],
    departments: [
      { id: 1, name: 'Road Infrastructure & Maintenance', code: 'DEPT-ROADS', categoryCount: 3, _count: { users: 12, complaints: 112, workOrders: 45 } },
      { id: 2, name: 'Solid Waste Management', code: 'DEPT-SWM', categoryCount: 3, _count: { users: 10, complaints: 89, workOrders: 38 } },
      { id: 3, name: 'Street Lighting & Electrical Works', code: 'DEPT-LIGHT', categoryCount: 3, _count: { users: 8, complaints: 64, workOrders: 27 } },
      { id: 4, name: 'Water Supply & Sewage Board', code: 'DEPT-WATER', categoryCount: 3, _count: { users: 8, complaints: 47, workOrders: 21 } },
    ],
    refreshedAt: new Date(),
  };
}

export async function getAdminDashboard(req, res, next) {
  const range = ['7_DAYS', '30_DAYS', '90_DAYS', 'YEAR'].includes(req.query.range) ? req.query.range : '30_DAYS';
  try {
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

    // If database has 0 complaints recorded yet, provide demo telemetry numbers for dashboard presentation
    if (complaints.length === 0 && process.env.NODE_ENV !== 'production') {
      return res.json({
        success: true,
        data: getMockAdminDashboardData(range),
        source: 'empty_db_demo_fallback',
      });
    }

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
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Admin Dashboard] MySQL query failed or offline. Returning fallback data:', error.message);
      return res.json({
        success: true,
        data: getMockAdminDashboardData(range),
        source: 'memory_fallback',
      });
    }
    next(error);
  }
}
