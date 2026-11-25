import { prisma } from '../lib/prisma.js';
import { parseComplaintPhotos } from '../lib/photoUtils.js';
import { notifyUser, notifyDepartmentOfficers } from '../lib/notificationService.js';
import { assertComplaintHasVerifiedPhoto, VERIFIED_COMPLAINT_WHERE, VERIFIED_WORK_ORDER_WHERE } from '../lib/verifiedComplaint.js';

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
      photos: { where: { locationVerificationStatus: 'VERIFIED' }, select: { id: true, imageUrl: true, caption: true, createdAt: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  },
  photos: { orderBy: { createdAt: 'asc' } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
};

async function notify(tx, { userId = null, targetRole = 'ALL', type, title, message, complaintId = null, workOrderId = null }) {
  if (!userId) return;
  return notifyUser(tx, {
    userId, role: targetRole, type, title, message, complaintId, workOrderId,
    relatedEntityType: workOrderId ? 'WORK_ORDER' : 'COMPLAINT',
    relatedEntityId: workOrderId || complaintId,
    targetUrl: targetRole === 'SUPERVISOR' ? '/supervisor/work-orders' : '/officer/work-orders',
    eventKey: `${title}:${workOrderId || complaintId}:${Date.now()}`,
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
      where: { AND: [{ OR: [{ id: req.params.complaintId }, { complaintCode: req.params.complaintId }] }, VERIFIED_COMPLAINT_WHERE] },
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
      const stillEligible = await tx.complaint.findFirst({
        where: { id: complaint.id },
        select: { id: true, photos: { where: { locationVerificationStatus: 'VERIFIED' }, select: { id: true, locationVerificationStatus: true }, take: 1 } },
      });
      if (!stillEligible) throw Object.assign(new Error('Complaint not found.'), { status: 404 });
      assertComplaintHasVerifiedPhoto(stillEligible);
      const existing = await tx.workOrder.findFirst({
        where: { complaintId: complaint.id, status: { in: ACTIVE_WORK_ORDER_STATUSES }, ...VERIFIED_WORK_ORDER_WHERE },
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
      if (existing?.supervisorId && existing.supervisorId !== supervisor.id) {
        await notifyUser(tx, {
          userId: existing.supervisorId, role: 'SUPERVISOR', type: 'WORK_ORDER',
          title: 'Field assignment reassigned',
          message: `Complaint ${complaint.complaintCode || complaint.id} has been reassigned to another Field Supervisor.`,
          complaintId: complaint.id, workOrderId: workOrder.id,
          relatedEntityType: 'WORK_ORDER', relatedEntityId: workOrder.id,
          targetUrl: '/supervisor/work-orders', eventKey: `field-reassigned:${workOrder.id}:${supervisor.id}:${now.toISOString()}`,
        });
      }
      if (priority === 'CRITICAL') await notifyDepartmentOfficers(tx, {
        departmentId: complaint.departmentId || complaint.category.departmentId,
        excludeUserId: req.user.id,
        type: 'WORK_ORDER', title: 'Urgent complaint needs attention',
        message: `Critical complaint ${complaint.complaintCode || complaint.id} has been assigned for field work.`,
        complaintId: complaint.id, workOrderId: workOrder.id,
        relatedEntityType: 'WORK_ORDER', relatedEntityId: workOrder.id,
        targetUrl: '/officer/work-orders', eventKey: `critical-assignment:${workOrder.id}`,
      });
      await notifyUser(tx, {
        userId: complaint.userId, role: 'CITIZEN', type: 'WORK_ORDER',
        title: existing ? 'Field team reassigned' : 'Field team assigned',
        message: existing
          ? `Complaint ${complaint.complaintCode || complaint.id} has been reassigned to a Field Supervisor.`
          : `A Field Supervisor has been assigned to complaint ${complaint.complaintCode || complaint.id}.`,
        complaintId: complaint.id, workOrderId: workOrder.id,
        relatedEntityType: 'COMPLAINT', relatedEntityId: complaint.id,
        targetUrl: `/citizen/complaints/${encodeURIComponent(complaint.complaintCode || complaint.id)}`,
        eventKey: `field-assigned:${workOrder.id}:${supervisor.id}:${now.toISOString()}`,
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
      where: { supervisorId: req.user.id, ...VERIFIED_WORK_ORDER_WHERE },
      include: workOrderInclude,
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });
    res.json({ success: true, data: assignments });
  } catch (error) { next(error); }
}

export async function listOfficerAssignments(req, res, next) {
  try {
    const assignments = await prisma.workOrder.findMany({
      where: { assignedByOfficerId: req.user.id, ...VERIFIED_WORK_ORDER_WHERE },
      include: workOrderInclude,
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });
    res.json({ success: true, data: assignments });
  } catch (error) { next(error); }
}

export async function listOfficerMaterialRequests(req, res, next) {
  try {
    const requests = await prisma.materialRequest.findMany({
      where: { workOrder: { assignedByOfficerId: req.user.id, complaint: VERIFIED_COMPLAINT_WHERE } },
      include: { items: { include: { inventoryItem: true } }, workOrder: { include: { supervisor: { select: { id: true, name: true } }, complaint: { select: { id: true, complaintCode: true, title: true } }, department: { select: { name: true } } } } },
      orderBy: { requestDate: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) { next(error); }
}

export async function reviewOfficerMaterialRequest(req, res, next) {
  try {
    const { decision, approvedQtyMap = {}, notes = '' } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision) || typeof notes !== 'string' || notes.length > 5000 || !approvedQtyMap || typeof approvedQtyMap !== 'object' || Array.isArray(approvedQtyMap)) {
      return res.status(422).json({ success: false, errors: { general: 'Choose APPROVED or REJECTED and provide valid review details.' } });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(req.params.id)) return res.status(400).json({ success: false, errors: { id: 'Invalid material request ID.' } });
    const request = await prisma.materialRequest.findFirst({
      where: { id: req.params.id, workOrder: { assignedByOfficerId: req.user.id, complaint: VERIFIED_COMPLAINT_WHERE } },
      include: { items: { include: { inventoryItem: true } }, workOrder: { include: { supervisor: true, complaint: true } } },
    });
    if (!request) return res.status(404).json({ success: false, errors: { general: 'Material request not found for this officer.' } });
    if (request.status !== 'PENDING') return res.status(409).json({ success: false, errors: { general: 'This material request has already been reviewed.' } });

    const result = await prisma.$transaction(async (tx) => {
      const approvedItems = request.items.map((line) => {
        const raw = decision === 'APPROVED' ? (approvedQtyMap[line.inventoryItemId] ?? line.requestedQty) : 0;
        const qty = Number(raw);
        if (!Number.isInteger(qty) || qty < 0 || qty > line.requestedQty || (decision === 'APPROVED' && qty < 1)) {
          throw Object.assign(new Error(`Enter an approved quantity between 1 and ${line.requestedQty} for ${line.inventoryItem.name}.`), { status: 422 });
        }
        return { line, qty };
      });
      for (const { line, qty } of approvedItems) {
        if (!qty) continue;
        const stock = await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } });
        if (!stock || stock.availableQuantity < qty) throw Object.assign(new Error(`Insufficient stock for ${line.inventoryItem.name}.`), { status: 409 });
        const updatedStock = await tx.inventoryItem.update({ where: { id: stock.id }, data: { availableQuantity: { decrement: qty } } });
        await tx.inventoryTransaction.create({ data: {
          inventoryItemId: stock.id, transactionType: 'STOCK_DISPATCH', quantityChange: -qty,
          balanceAfter: updatedStock.availableQuantity, materialRequestId: request.id, workOrderId: request.workOrderId,
          reason: `Approved material request ${request.requestCode || request.id}`,
          performedByUserId: req.user.id,
        } });
        await tx.materialRequestItem.update({ where: { id: line.id }, data: { approvedQty: qty } });
      }
      const updated = await tx.materialRequest.update({
        where: { id: request.id },
        data: { status: decision, decisionNotes: notes.trim() || null, decidedByUserId: req.user.id, decidedAt: new Date() },
        include: { items: { include: { inventoryItem: true } }, workOrder: { include: { supervisor: true, complaint: true } } },
      });
      if (request.requestedByUserId) await notifyUser(tx, {
        userId: request.requestedByUserId, role: 'SUPERVISOR', type: 'WORK_ORDER',
        title: decision === 'APPROVED' ? 'Material request approved' : 'Material request rejected',
        message: `Your request ${request.requestCode || request.id} for work order ${request.workOrder.workOrderCode || request.workOrderId} was ${decision.toLowerCase()}.${notes.trim() ? ` ${notes.trim()}` : ''}`,
        complaintId: request.workOrder.complaintId, workOrderId: request.workOrderId,
        relatedEntityType: 'MATERIAL_REQUEST', relatedEntityId: request.id,
        targetUrl: '/supervisor/material-requests', eventKey: `material-request-decision:${request.id}`,
      });
      await notifyUser(tx, {
        userId: req.user.id, role: 'OFFICER', type: 'WORK_ORDER',
        title: `Material request ${decision.toLowerCase()}`,
        message: `You ${decision.toLowerCase()} material request ${request.requestCode || request.id}.${notes.trim() ? ` ${notes.trim()}` : ''}`,
        complaintId: request.workOrder.complaintId, workOrderId: request.workOrderId,
        relatedEntityType: 'MATERIAL_REQUEST', relatedEntityId: request.id,
        targetUrl: '/officer/inventory', eventKey: `material-request-officer-decision:${request.id}`,
      });
      return updated;
    });
    res.json({ success: true, data: result });
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
    const assignment = await prisma.workOrder.findFirst({ where: { id: req.params.id, supervisorId: req.user.id, ...VERIFIED_WORK_ORDER_WHERE }, include: { complaint: true, assignedByOfficer: true } });
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
        await notifyUser(tx, {
          userId: assignment.complaint.userId, role: 'CITIZEN', type: 'WORK_ORDER',
          title: 'Work started',
          message: `Field work has started on complaint ${assignment.complaint.complaintCode || assignment.complaintId}.`,
          complaintId: assignment.complaintId, workOrderId: assignment.id,
          relatedEntityType: 'COMPLAINT', relatedEntityId: assignment.complaintId,
          targetUrl: `/citizen/complaints/${encodeURIComponent(assignment.complaint.complaintCode || assignment.complaintId)}`,
          eventKey: `work-started:${assignment.id}`,
        });
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
      await notifyUser(tx, {
        userId: assignment.complaint.userId, role: 'CITIZEN', type: 'REPAIR_VERIFICATION',
        title: 'Repair work completed',
        message: `Field work on complaint ${assignment.complaint.complaintCode || assignment.complaintId} is complete and awaiting municipal verification.`,
        complaintId: assignment.complaintId, workOrderId: assignment.id,
        relatedEntityType: 'COMPLAINT', relatedEntityId: assignment.complaintId,
        targetUrl: `/citizen/complaints/${encodeURIComponent(assignment.complaint.complaintCode || assignment.complaintId)}`,
        eventKey: `repair-submitted:${assignment.id}`,
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
    const assignment = await prisma.workOrder.findFirst({ where: { id: req.params.id, supervisorId: req.user.id, ...VERIFIED_WORK_ORDER_WHERE }, include: { complaint: { include: { photos: { where: { locationVerificationStatus: 'VERIFIED' }, take: 1, select: { imageUrl: true } } } } } });
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
      await notifyUser(tx, {
        userId: verification.workOrder.complaint.userId, role: 'CITIZEN', type: 'REPAIR_VERIFICATION',
        title: approved ? 'Repair verification approved' : 'Repair verification rejected',
        message: approved
          ? `The repair for complaint ${verification.workOrder.complaint.complaintCode || verification.complaintId} was approved. ${remarks.trim()}`
          : `The repair for complaint ${verification.workOrder.complaint.complaintCode || verification.complaintId} needs more work. ${remarks.trim()}`,
        complaintId: verification.complaintId, workOrderId: verification.workOrderId,
        relatedEntityType: 'COMPLAINT', relatedEntityId: verification.complaintId,
        targetUrl: `/citizen/complaints/${encodeURIComponent(verification.workOrder.complaint.complaintCode || verification.complaintId)}`,
        eventKey: `verification-result:${verification.id}`,
      });
      await notifyUser(tx, {
        userId: req.user.id, role: 'OFFICER', type: 'REPAIR_VERIFICATION',
        title: approved ? 'Repair verification approved' : 'Repair verification rejected',
        message: `Your verification decision for complaint ${verification.workOrder.complaint.complaintCode || verification.complaintId} was recorded.`,
        complaintId: verification.complaintId, workOrderId: verification.workOrderId,
        relatedEntityType: 'WORK_ORDER', relatedEntityId: verification.workOrderId,
        targetUrl: '/officer/verifications', eventKey: `verification-officer-result:${verification.id}`,
      });
      return tx.workOrder.findUnique({ where: { id: updated.id }, include: workOrderInclude });
    });
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
}

export async function listPendingVerifications(req, res, next) {
  try {
    const verifications = await prisma.repairVerification.findMany({
      where: { status: 'AWAITING_VERIFICATION', workOrder: { assignedByOfficerId: req.user.id, complaint: VERIFIED_COMPLAINT_WHERE } },
      include: {
        complaint: { include: { category: true, user: { select: { id: true, name: true, email: true, phone: true } }, photos: { where: { locationVerificationStatus: 'VERIFIED' } } } },
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
    const verification = await prisma.repairVerification.findFirst({
      where: { id: req.params.id, workOrder: { complaint: VERIFIED_COMPLAINT_WHERE } },
      include: {
        workOrder: {
          include: {
            complaint: { include: { user: true, photos: { where: { locationVerificationStatus: 'VERIFIED' } } } },
            supervisor: true,
          },
        },
      },
    });
    if (!verification || verification.workOrder.assignedByOfficerId !== req.user.id || verification.status !== 'AWAITING_VERIFICATION') {
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
      where: { userId: req.user.id },
      include: {
        complaint: { select: { complaintCode: true } },
        workOrder: { select: { workOrderCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
}

export async function countUnreadNotifications(req, res, next) {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
}

export async function markNotificationRead(req, res, next) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(req.params.id)) {
      return res.status(400).json({ success: false, errors: { id: 'Invalid notification ID.' } });
    }
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) return res.status(404).json({ success: false, errors: { general: 'Notification not found.' } });
    const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true, readAt: notification.readAt || new Date() } });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, data: { updated: result.count } });
  } catch (error) { next(error); }
}

export async function deleteNotification(req, res, next) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(req.params.id)) {
      return res.status(400).json({ success: false, errors: { id: 'Invalid notification ID.' } });
    }
    const result = await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    if (!result.count) return res.status(404).json({ success: false, errors: { general: 'Notification not found.' } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) { next(error); }
}
