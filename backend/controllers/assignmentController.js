import { prisma } from '../lib/prisma.js';
import { parseComplaintPhotos } from '../lib/photoUtils.js';

const ACTIVE_WORK_ORDER_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'REWORK_REQUIRED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ELIGIBLE_SUPERVISOR_WHERE = {
  role: 'SUPERVISOR',
  isActive: true,
  approvalStatus: 'APPROVED',
  passwordHash: { not: null },
};

const workOrderInclude = {
  supervisor: { select: { id: true, name: true, email: true, phone: true, title: true, department: { select: { name: true } } } },
  assignedByOfficer: { select: { id: true, name: true, email: true } },
  department: { select: { id: true, name: true, code: true } },
  complaint: {
    include: {
      category: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
      photos: { select: { id: true, imageUrl: true, caption: true, createdAt: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  },
  photos: { orderBy: { createdAt: 'asc' } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
};

async function notify(tx, { userId = null, targetRole = 'ALL', type, title, message, complaintId = null, workOrderId = null }) {
  await tx.notification.create({
    data: { userId, targetRole, notificationType: type, title, message, complaintId, workOrderId, linkId: complaintId || workOrderId },
  });
}

export async function listActiveSupervisors(req, res, next) {
  try {
    const supervisors = await prisma.user.findMany({
      where: ELIGIBLE_SUPERVISOR_WHERE,
      select: { id: true, name: true, email: true, phone: true, title: true, department: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: supervisors });
  } catch (error) { next(error); }
}

export async function assignComplaint(req, res, next) {
  try {
    const { supervisorId, instructions, priority, dueDate } = req.body;
    if (typeof instructions !== 'string' || instructions.trim().length < 5 || instructions.trim().length > 5000) {
      return res.status(422).json({ success: false, errors: { instructions: 'Enter assignment instructions between 5 and 5,000 characters.' } });
    }
    if (!PRIORITIES.includes(priority)) return res.status(422).json({ success: false, errors: { priority: 'Choose a supported priority.' } });
    const supervisor = await prisma.user.findFirst({
      where: { ...ELIGIBLE_SUPERVISOR_WHERE, id: supervisorId },
      select: { id: true, name: true, departmentId: true },
    });
    if (!supervisor) return res.status(422).json({ success: false, errors: { supervisorId: 'Select an active, approved Field Supervisor.' } });

    const complaint = await prisma.complaint.findFirst({
      where: { OR: [{ id: req.params.complaintId }, { complaintCode: req.params.complaintId }] },
      include: { category: { select: { departmentId: true } } },
    });
    if (!complaint) return res.status(404).json({ success: false, errors: { general: 'Complaint not found.' } });
    if (['RESOLVED', 'REJECTED'].includes(complaint.status)) {
      return res.status(409).json({ success: false, errors: { general: 'Resolved or rejected complaints cannot receive new work assignments.' } });
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 86400000);
    if (!Number.isFinite(parsedDueDate.getTime()) || parsedDueDate <= new Date()) {
      return res.status(422).json({ success: false, errors: { dueDate: 'Due date must be a valid future date.' } });
    }
    let departmentId = complaint.departmentId || complaint.category.departmentId || supervisor.departmentId
      || (await prisma.department.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' }, select: { id: true } }))?.id;
    if (!departmentId) {
      // Existing installations may have active categories but no department
      // records at all. Work orders require a department, so reuse/create one
      // stable fallback department instead of making assignment impossible.
      const fallbackDepartment = await prisma.department.upsert({
        where: { code: 'FIELD-OPERATIONS' },
        update: { isActive: true },
        create: { code: 'FIELD-OPERATIONS', name: 'Field Operations', description: 'Default department for field work assignments.' },
        select: { id: true },
      });
      departmentId = fallbackDepartment.id;
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const existing = await tx.workOrder.findFirst({
        where: { complaintId: complaint.id, status: { in: ACTIVE_WORK_ORDER_STATUSES } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, supervisorId: true },
      });
      const now = new Date();
      const workOrder = existing
        ? await tx.workOrder.update({
          where: { id: existing.id },
          data: { supervisorId: supervisor.id, supervisorName: supervisor.name, assignedByOfficerId: req.user.id, workDescription: instructions.trim(), priority, deadline: parsedDueDate, status: 'ASSIGNED', assignedAt: now, acceptedAt: null },
        })
        : await tx.workOrder.create({
          data: { complaintId: complaint.id, departmentId, supervisorId: supervisor.id, supervisorName: supervisor.name, assignedByOfficerId: req.user.id, workDescription: instructions.trim(), priority, deadline: parsedDueDate, status: 'ASSIGNED', assignedAt: now },
        });

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: workOrder.id,
          previousStatus: existing?.status || null,
          newStatus: 'ASSIGNED',
          notes: instructions.trim(),
          changedByUserId: req.user.id,
          changedByName: req.user.name,
        },
      });
      await tx.complaintStatusHistory.create({ data: {
        complaintId: complaint.id,
        previousStatus: complaint.status,
        newStatus: complaint.status,
        title: 'Field work assigned',
        notes: `Assigned to ${supervisor.name}. ${instructions.trim()}`,
        performedByUserId: req.user.id,
        performedByName: req.user.name,
      } });
      await notify(tx, {
        userId: supervisor.id,
        targetRole: 'SUPERVISOR',
        type: 'WORK_ORDER',
        title: 'New field assignment',
        message: `Complaint ${complaint.complaintCode || complaint.id} has been assigned to you.`,
        complaintId: complaint.id,
        workOrderId: workOrder.id,
      });
      await tx.auditLog.create({ data: {
        userId: req.user.id,
        actorName: req.user.name,
        action: 'ASSIGN_FIELD_WORK',
        entityType: 'WorkOrder',
        entityId: workOrder.id,
        affectedRecord: `Complaint ${complaint.complaintCode || complaint.id}`,
        details: `Assigned work to supervisor ${supervisor.name}.`,
        ipAddress: req.ip || null,
      } }).catch(() => {});
      return tx.workOrder.findUnique({ where: { id: workOrder.id }, include: workOrderInclude });
    });
    return res.status(201).json({ success: true, data: assignment });
  } catch (error) { next(error); }
}

export async function listMyAssignments(req, res, next) {
  try {
    const assignments = await prisma.workOrder.findMany({
      where: { supervisorId: req.user.id },
      include: workOrderInclude,
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });
    res.json({ success: true, data: assignments });
  } catch (error) { next(error); }
}

export async function listOfficerAssignments(req, res, next) {
  try {
    const assignments = await prisma.workOrder.findMany({
      where: { assignedByOfficerId: req.user.id },
      include: workOrderInclude,
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });
    res.json({ success: true, data: assignments });
  } catch (error) { next(error); }
}

export async function updateAssignmentStatus(req, res, next) {
  try {
    const { status, remarks } = req.body;
    if (!['ACCEPTED', 'IN_PROGRESS'].includes(status)) {
      return res.status(422).json({ success: false, errors: { status: 'Supervisors can accept assignments or move them to in progress.' } });
    }
    if (remarks !== undefined && (typeof remarks !== 'string' || remarks.length > 5000)) {
      return res.status(422).json({ success: false, errors: { remarks: 'Remarks must be 5,000 characters or fewer.' } });
    }
    const assignment = await prisma.workOrder.findFirst({ where: { id: req.params.id, supervisorId: req.user.id }, include: { complaint: true, assignedByOfficer: true } });
    if (!assignment) return res.status(404).json({ success: false, errors: { general: 'Assignment not found for this supervisor.' } });
    if (!ACTIVE_WORK_ORDER_STATUSES.includes(assignment.status) && assignment.status !== 'REWORK_REQUIRED') {
      return res.status(409).json({ success: false, errors: { general: 'This assignment is no longer active.' } });
    }
    if (assignment.status === 'AWAITING_VERIFICATION') return res.status(409).json({ success: false, errors: { general: 'This assignment is awaiting municipal verification.' } });

    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: assignment.id },
        data: { status, progress: status === 'ACCEPTED' ? Math.max(assignment.progress, 10) : Math.max(assignment.progress, 50), acceptedAt: status === 'ACCEPTED' ? new Date() : assignment.acceptedAt },
      });
      await tx.workOrderStatusHistory.create({
        data: { workOrderId: assignment.id, previousStatus: assignment.status, newStatus: status, notes: remarks?.trim() || null, changedByUserId: req.user.id, changedByName: req.user.name },
      });
      if (status === 'IN_PROGRESS') {
        await tx.complaint.update({ where: { id: assignment.complaintId }, data: { status: 'IN_PROGRESS', assignedOfficerId: assignment.assignedByOfficerId } });
        await tx.complaintStatusHistory.create({ data: {
          complaintId: assignment.complaintId,
          previousStatus: assignment.complaint.status,
          newStatus: 'IN_PROGRESS',
          title: 'Field work started',
          notes: remarks?.trim() || `Field Supervisor ${req.user.name} started the assigned work.`,
          performedByUserId: req.user.id,
          performedByName: req.user.name,
        } });
      }
      await notify(tx, {
        userId: assignment.assignedByOfficerId,
        targetRole: 'OFFICER',
        type: 'WORK_ORDER',
        title: status === 'ACCEPTED' ? 'Field assignment accepted' : 'Field work started',
        message: `${req.user.name} updated work order ${assignment.workOrderCode || assignment.id} to ${status.replaceAll('_', ' ')}.`,
        complaintId: assignment.complaintId,
        workOrderId: assignment.id,
      });
      return tx.workOrder.findUnique({ where: { id: updated.id }, include: workOrderInclude });
    });
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
}

export async function completeAssignment(req, res, next) {
  try {
    const { remarks, photos } = req.body;
    if (typeof remarks !== 'string' || remarks.trim().length < 5 || remarks.length > 5000) {
      return res.status(422).json({ success: false, errors: { remarks: 'Completion remarks are required (5 to 5,000 characters).' } });
    }
    const completionPhotos = parseComplaintPhotos(photos);
    if (!completionPhotos.length) return res.status(422).json({ success: false, errors: { photos: 'Upload at least one completion photograph.' } });
    const assignment = await prisma.workOrder.findFirst({ where: { id: req.params.id, supervisorId: req.user.id }, include: { complaint: { include: { photos: { take: 1, select: { imageUrl: true } } } } } });
    if (!assignment) return res.status(404).json({ success: false, errors: { general: 'Assignment not found for this supervisor.' } });
    if (!['IN_PROGRESS', 'REWORK_REQUIRED'].includes(assignment.status)) {
      return res.status(409).json({ success: false, errors: { general: 'Start or resume this assignment before submitting completion.' } });
    }

    const record = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.workOrder.update({
        where: { id: assignment.id },
        data: { status: 'AWAITING_VERIFICATION', progress: 100, completedDate: now, afterPhotoUrl: completionPhotos[0].imageUrl },
      });
      await tx.workOrderPhoto.createMany({ data: completionPhotos.map((photo) => ({ workOrderId: assignment.id, uploadedByUserId: req.user.id, imageUrl: photo.imageUrl })) });
      await tx.repairVerification.create({ data: {
        complaintId: assignment.complaintId,
        workOrderId: assignment.id,
        submittedBySupervisorId: req.user.id,
        supervisorName: req.user.name,
        completionDetails: remarks.trim(),
        beforePhotoUrl: assignment.complaint.photos[0]?.imageUrl || null,
        completionPhotoUrl: completionPhotos[0].imageUrl,
        status: 'AWAITING_VERIFICATION',
      } });
      await tx.workOrderStatusHistory.create({
        data: { workOrderId: assignment.id, previousStatus: assignment.status, newStatus: 'AWAITING_VERIFICATION', notes: remarks.trim(), changedByUserId: req.user.id, changedByName: req.user.name },
      });
      const complaint = await tx.complaint.findUnique({ where: { id: assignment.complaintId }, select: { status: true } });
      await tx.complaintStatusHistory.create({ data: {
        complaintId: assignment.complaintId,
        previousStatus: complaint.status,
        newStatus: complaint.status,
        title: 'Field work completed; verification pending',
        notes: remarks.trim(),
        performedByUserId: req.user.id,
        performedByName: req.user.name,
      } });
      await notify(tx, {
        userId: assignment.assignedByOfficerId,
        targetRole: 'OFFICER',
        type: 'REPAIR_VERIFICATION',
        title: 'Work completion awaits verification',
        message: `${req.user.name} submitted completion evidence for ${assignment.workOrderCode || assignment.id}.`,
        complaintId: assignment.complaintId,
        workOrderId: assignment.id,
      });
      return tx.workOrder.findUnique({ where: { id: updated.id }, include: workOrderInclude });
    });
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
}

export async function listPendingVerifications(req, res, next) {
  try {
    const verifications = await prisma.repairVerification.findMany({
      where: { status: 'AWAITING_VERIFICATION', workOrder: { assignedByOfficerId: req.user.id } },
      include: {
        complaint: { include: { category: true, user: { select: { id: true, name: true, email: true, phone: true } }, photos: true } },
        workOrder: { include: workOrderInclude },
        submittedBySupervisor: { select: { id: true, name: true, email: true, phone: true } },
        verifiedByOfficer: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });
    res.json({ success: true, data: verifications });
  } catch (error) { next(error); }
}

export async function reviewCompletion(req, res, next) {
  try {
    const { decision, remarks } = req.body;
    if (!['APPROVE', 'REWORK'].includes(decision) || typeof remarks !== 'string' || remarks.trim().length < 3 || remarks.length > 5000) {
      return res.status(422).json({ success: false, errors: { general: 'Choose APPROVE or REWORK and provide review remarks.' } });
    }
    const verification = await prisma.repairVerification.findUnique({
      where: { id: req.params.id },
      include: { workOrder: { include: { complaint: { include: { user: true } }, supervisor: true } } },
    });
    if (!verification || verification.status !== 'AWAITING_VERIFICATION') {
      return res.status(404).json({ success: false, errors: { general: 'Pending completion verification not found.' } });
    }
    const approved = decision === 'APPROVE';
    const record = await prisma.$transaction(async (tx) => {
      await tx.repairVerification.update({
        where: { id: verification.id },
        data: { status: approved ? 'VERIFIED_APPROVED' : 'REWORK_REQUESTED', officerRemarks: remarks.trim(), verifiedByOfficerId: req.user.id, verifiedAt: new Date() },
      });
      await tx.workOrder.update({ where: { id: verification.workOrderId }, data: { status: approved ? 'COMPLETED' : 'REWORK_REQUIRED', progress: approved ? 100 : 75 } });
      await tx.workOrderStatusHistory.create({
        data: { workOrderId: verification.workOrderId, previousStatus: 'AWAITING_VERIFICATION', newStatus: approved ? 'COMPLETED' : 'REWORK_REQUIRED', notes: remarks.trim(), changedByUserId: req.user.id, changedByName: req.user.name },
      });
      const newStatus = approved ? 'RESOLVED' : 'IN_PROGRESS';
      await tx.complaint.update({
        where: { id: verification.complaintId },
        data: { status: newStatus, resolvedAt: approved ? new Date() : null, resolutionNotes: approved ? remarks.trim() : null },
      });
      await tx.complaintStatusHistory.create({ data: {
        complaintId: verification.complaintId,
        previousStatus: verification.workOrder.complaint.status,
        newStatus,
        title: approved ? 'Municipal officer verified the completed repair' : 'Municipal officer requested rework',
        notes: remarks.trim(),
        performedByUserId: req.user.id,
        performedByName: req.user.name,
      } });
      await notify(tx, {
        userId: verification.workOrder.complaint.userId,
        targetRole: 'CITIZEN',
        type: 'COMPLAINT',
        title: approved ? 'Complaint resolved' : 'Repair requires more work',
        message: approved ? `Your complaint ${verification.workOrder.complaint.complaintCode || verification.complaintId} has been verified and resolved.` : `More work is needed on your complaint ${verification.workOrder.complaint.complaintCode || verification.complaintId}.`,
        complaintId: verification.complaintId,
        workOrderId: verification.workOrderId,
      });
      if (verification.workOrder.supervisorId) await notify(tx, {
        userId: verification.workOrder.supervisorId,
        targetRole: 'SUPERVISOR',
        type: 'REPAIR_VERIFICATION',
        title: approved ? 'Repair verified' : 'Rework requested',
        message: `Work order ${verification.workOrder.workOrderCode || verification.workOrderId}: ${remarks.trim()}`,
        complaintId: verification.complaintId,
        workOrderId: verification.workOrderId,
      });
      return tx.repairVerification.findUnique({ where: { id: verification.id }, include: { workOrder: { include: workOrderInclude } } });
    });
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
}

export async function listNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: req.user.id }, { userId: null, targetRole: req.user.role }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
}

export async function markNotificationRead(req, res, next) {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, OR: [{ userId: req.user.id }, { userId: null, targetRole: req.user.role }] },
    });
    if (!notification) return res.status(404).json({ success: false, errors: { general: 'Notification not found.' } });
    const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}
