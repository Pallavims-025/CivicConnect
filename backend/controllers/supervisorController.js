import { prisma } from '../lib/prisma.js';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { notifyUser } from '../lib/notificationService.js';
import { VERIFIED_COMPLAINT_WHERE, VERIFIED_WORK_ORDER_WHERE } from '../lib/verifiedComplaint.js';

const supervisorAvatarDirectory = new URL('../uploads/supervisor-avatars/', import.meta.url);
const supervisorAvatarPath = fileURLToPath(supervisorAvatarDirectory);
const supervisorAvatarUrlPattern = /^\/uploads\/supervisor-avatars\/[a-f\d-]+\.(?:jpg|png)$/i;

async function removeSupervisorAvatar(avatarUrl) {
  if (!supervisorAvatarUrlPattern.test(avatarUrl || '')) return;
  try { await unlink(path.join(supervisorAvatarPath, path.basename(avatarUrl))); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const workOrderInclude = {
  department: true,
  complaint: { include: { category: true, user: { select: { id: true, name: true } }, photos: { where: { photoType: 'INITIAL_EVIDENCE', locationVerificationStatus: 'VERIFIED' } } } },
  photos: { orderBy: { createdAt: 'asc' } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
  materialRequests: { include: { items: { include: { inventoryItem: true } } } },
  repairVerifications: { orderBy: { submittedAt: 'desc' }, take: 1 },
};

async function ownedWorkOrder(id, supervisorId) {
  return prisma.workOrder.findFirst({ where: { id, supervisorId, ...VERIFIED_WORK_ORDER_WHERE }, include: workOrderInclude });
}

async function notifyOfficer(tx, order, title, message, eventKey = `${title}:${order.id}:${Date.now()}`) {
  if (order.assignedByOfficerId) await notifyUser(tx, {
    userId: order.assignedByOfficerId, role: 'OFFICER', type: 'WORK_ORDER', title, message,
    complaintId: order.complaintId, workOrderId: order.id,
    relatedEntityType: 'WORK_ORDER', relatedEntityId: order.id,
    targetUrl: '/officer/work-orders', eventKey,
  });
  if (order.complaint?.user?.id) await notifyUser(tx, {
    userId: order.complaint.user.id, role: 'CITIZEN', type: 'WORK_ORDER', title, message,
    complaintId: order.complaintId, workOrderId: order.id,
    relatedEntityType: 'COMPLAINT', relatedEntityId: order.complaintId,
    targetUrl: `/citizen/complaints/${encodeURIComponent(order.complaint.complaintCode || order.complaintId)}`,
    eventKey: `${eventKey}:citizen`,
  });
}

export async function getSupervisorProfile(req, res, next) {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, title: true, wardCoverage: true, department: { select: { id: true, name: true } } },
    });
    if (!profile) return res.status(404).json({ success: false, error: { message: 'Supervisor profile not found.' } });
    res.json({ success: true, data: profile });
  } catch (error) { next(error); }
}

export async function updateSupervisorProfile(req, res, next) {
  try {
    const { name, phone, title, wardCoverage } = req.body;
    if (!name?.trim()) return res.status(422).json({ success: false, error: { message: 'Name is required.' } });
    const profile = await prisma.user.update({ where: { id: req.user.id }, data: {
      name: name.trim(), phone: phone?.trim() || null, title: title?.trim() || null, wardCoverage: wardCoverage?.trim() || null,
    }, select: { id: true, name: true, email: true, phone: true, avatarUrl: true, title: true, wardCoverage: true, department: { select: { id: true, name: true } } } });
    res.json({ success: true, data: profile });
  } catch (error) { next(error); }
}

export async function uploadSupervisorProfilePhoto(req, res, next) {
  let createdFilePath;
  try {
    const { imageData } = req.body;
    const match = typeof imageData === 'string' && imageData.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return res.status(422).json({ success: false, error: { message: 'Choose a valid JPG or PNG image.' } });

    const [, format, encoded] = match;
    const image = Buffer.from(encoded, 'base64');
    if (!image.length || image.length > 2 * 1024 * 1024) {
      return res.status(422).json({ success: false, error: { message: 'Photo must be 2 MB or smaller.' } });
    }
    const isJpeg = format === 'jpeg' && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
    const isPng = format === 'png' && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (!isJpeg && !isPng) {
      return res.status(422).json({ success: false, error: { message: 'The photo contents do not match a supported JPG or PNG image.' } });
    }

    const extension = isJpeg ? 'jpg' : 'png';
    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(supervisorAvatarPath, { recursive: true });
    createdFilePath = path.join(supervisorAvatarPath, fileName);
    await writeFile(createdFilePath, image, { flag: 'wx', mode: 0o644 });

    const avatarUrl = `/uploads/supervisor-avatars/${fileName}`;
    const profile = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, title: true, wardCoverage: true, department: { select: { id: true, name: true } } },
    });

    const previousAvatar = req.user.avatarUrl;
    if (previousAvatar && previousAvatar !== avatarUrl) {
      try { await removeSupervisorAvatar(previousAvatar); } catch {}
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    if (createdFilePath) {
      try { await unlink(createdFilePath); } catch {}
    }
    next(error);
  }
}

export async function removeSupervisorProfilePhoto(req, res, next) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatarUrl: true } });
    const profile = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, title: true, wardCoverage: true, department: { select: { id: true, name: true } } },
    });
    if (existing?.avatarUrl) {
      try { await removeSupervisorAvatar(existing.avatarUrl); } catch {}
    }
    res.json({ success: true, data: profile });
  } catch (error) { next(error); }
}

export async function updateWorkOrderCrew(req, res, next) {
  try {
    const order = await ownedWorkOrder(req.params.id, req.user.id);
    const workers = req.body.workerNames;
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    if (!Array.isArray(workers) || workers.some((worker) => typeof worker !== 'string' || !worker.trim())) return res.status(422).json({ success: false, error: { message: 'Choose valid worker names.' } });
    const assignedCrew = workers.map((worker) => worker.trim()).join(', ');
    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.workOrder.update({ where: { id: order.id }, data: { assignedCrew } });
      await tx.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: order.status, notes: assignedCrew ? `Assigned crew: ${assignedCrew}` : 'Crew assignment cleared.', changedByUserId: req.user.id, changedByName: req.user.name } });
      return record;
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

export async function addWorkOrderNote(req, res, next) {
  try {
    const order = await ownedWorkOrder(req.params.id, req.user.id);
    const note = req.body.note?.trim();
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    if (!note) return res.status(422).json({ success: false, error: { message: 'A site note is required.' } });
    const record = await prisma.$transaction(async (tx) => {
      const history = await tx.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: order.status, notes: note, changedByUserId: req.user.id, changedByName: req.user.name } });
      await notifyOfficer(tx, order, 'Field Supervisor update', `${req.user.name} added an update to ${order.workOrderCode || order.id}: ${note}`, `work-order-note:${history.id}`);
      return history;
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
}

export async function getSupervisorWorkOrders(req, res, next) {
  try {
    const data = await prisma.workOrder.findMany({ where: { supervisorId: req.user.id, ...VERIFIED_WORK_ORDER_WHERE }, include: workOrderInclude, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] });
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function getSupervisorDashboardData(req, res, next) {
  try {
    const profile = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, phone: true, avatarUrl: true, title: true, wardCoverage: true, department: { select: { id: true, name: true } } } });
    const orders = await prisma.workOrder.findMany({ where: { supervisorId: req.user.id, ...VERIFIED_WORK_ORDER_WHERE }, include: workOrderInclude, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] });
    const inventory = await prisma.inventoryItem.findMany({
      where: { OR: [{ departmentId: req.user.departmentId || -1 }, { departmentId: null }] },
      orderBy: { name: 'asc' },
    });
    const orderIds = orders.map((order) => order.id);
    const [requests, transactions, notifications, workerTasks] = await Promise.all([
      prisma.materialRequest.findMany({ where: { requestedByUserId: req.user.id, workOrderId: { in: orderIds } }, include: { items: { include: { inventoryItem: true } }, workOrder: { select: { id: true, workOrderCode: true, complaintId: true, department: { select: { name: true } } } } }, orderBy: { requestDate: 'desc' } }),
      orderIds.length ? prisma.inventoryTransaction.findMany({ where: { workOrderId: { in: orderIds } }, include: { inventoryItem: true }, orderBy: { createdAt: 'desc' } }) : [],
      prisma.notification.findMany({
        where: {
          userId: req.user.id,
          OR: [
            { complaintId: null, workOrderId: null },
            { complaint: VERIFIED_COMPLAINT_WHERE },
            { workOrder: { complaint: VERIFIED_COMPLAINT_WHERE } },
          ],
        },
        orderBy: { createdAt: 'desc' }, take: 100,
      }),
      prisma.$queryRaw`SELECT task.id, task.work_order_id AS workOrderId, task.supervisor_id AS supervisorId, task.worker_name AS workerName, task.worker_contact AS workerContact, task.task_description AS taskDescription, task.deadline, task.progress, task.status, task.delay_reason AS delayReason, task.created_at AS createdAt, task.updated_at AS updatedAt, order_record.work_order_code AS workOrderCode FROM supervisor_worker_tasks task JOIN work_orders order_record ON order_record.id = task.work_order_id JOIN complaints eligible_complaint ON eligible_complaint.id = order_record.complaint_id AND eligible_complaint.status <> 'REJECTED' WHERE task.supervisor_id = ${req.user.id} AND EXISTS (SELECT 1 FROM complaint_photos verified_photo WHERE verified_photo.complaint_id = order_record.complaint_id AND verified_photo.photo_type = 'INITIAL_EVIDENCE' AND verified_photo.location_verification_status = 'VERIFIED') ORDER BY task.created_at DESC`,
    ]);
    res.json({ success: true, data: { profile, orders, inventory, requests, transactions, notifications, workerTasks } });
  } catch (error) { next(error); }
}

export async function updateProgress(req, res, next) {
  try {
    const order = await ownedWorkOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    if (!['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(order.status)) return res.status(409).json({ success: false, error: { message: 'Progress cannot be changed while this work order is awaiting verification or complete.' } });
    const { progress, progressNotes, estimatedCompletionDate, blockers = [], notifyOfficer: shouldNotifyOfficer = true } = req.body;
    const value = Number(progress);
    if (!Number.isInteger(value) || value < 0 || value > 100) return res.status(422).json({ success: false, error: { message: 'Progress must be between 0 and 100.' } });
    const notes = [progressNotes?.trim(), blockers.length ? `Blockers: ${blockers.join('; ')}` : ''].filter(Boolean).join('\n');
    const updated = await prisma.$transaction(async (tx) => {
      const data = { progress: value, status: ['ASSIGNED', 'REWORK_REQUIRED'].includes(order.status) ? 'IN_PROGRESS' : order.status };
      if (estimatedCompletionDate && Number.isFinite(new Date(estimatedCompletionDate).getTime())) data.deadline = new Date(estimatedCompletionDate);
      const record = await tx.workOrder.update({ where: { id: order.id }, data });
      const history = await tx.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: record.status, notes: notes || `Progress updated to ${value}%.`, changedByUserId: req.user.id, changedByName: req.user.name } });
      await tx.complaintStatusHistory.create({ data: {
        complaintId: order.complaintId, previousStatus: order.complaint.status, newStatus: order.complaint.status,
        title: 'Work progress updated', notes: `${value}% complete.${notes ? ` ${notes}` : ''}`,
        performedByUserId: req.user.id, performedByName: req.user.name,
      } });
      if (shouldNotifyOfficer) await notifyOfficer(tx, order, 'Field work progress updated', `${req.user.name} updated ${order.workOrderCode || order.id} to ${value}%.${notes ? ` ${notes}` : ''}`, `work-progress:${history.id}`);
      if (['ASSIGNED', 'REWORK_REQUIRED'].includes(order.status)) {
        await tx.complaint.update({ where: { id: order.complaintId }, data: { status: 'IN_PROGRESS', assignedOfficerId: order.assignedByOfficerId } });
        await tx.complaintStatusHistory.create({ data: {
          complaintId: order.complaintId, previousStatus: order.complaint.status, newStatus: 'IN_PROGRESS',
          title: 'Field work started', notes: notes || `Field Supervisor ${req.user.name} started the assigned work.`,
          performedByUserId: req.user.id, performedByName: req.user.name,
        } });
        await notifyUser(tx, {
          userId: order.complaint.user.id, role: 'CITIZEN', type: 'WORK_ORDER', title: 'Work started',
          message: `Field work has started on complaint ${order.complaint.complaintCode || order.complaintId}.`,
          complaintId: order.complaintId, workOrderId: order.id,
          relatedEntityType: 'COMPLAINT', relatedEntityId: order.complaintId,
          targetUrl: `/citizen/complaints/${encodeURIComponent(order.complaint.complaintCode || order.complaintId)}`,
          eventKey: `work-started:${order.id}`,
        });
      }
      if (notes || value !== order.progress) await notifyUser(tx, {
        userId: order.complaint.user.id, role: 'CITIZEN', type: 'WORK_ORDER', title: 'Work progress updated',
        message: `Work on complaint ${order.complaint.complaintCode || order.complaintId} is ${value}% complete.${notes ? ` ${notes}` : ''}`,
        complaintId: order.complaintId, workOrderId: order.id,
        relatedEntityType: 'COMPLAINT', relatedEntityId: order.complaintId,
        targetUrl: `/citizen/complaints/${encodeURIComponent(order.complaint.complaintCode || order.complaintId)}`,
        eventKey: `work-progress-citizen:${history.id}`,
      });
      return tx.workOrder.findUnique({ where: { id: order.id }, include: workOrderInclude });
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

export async function reportDelay(req, res, next) {
  try {
    const order = await ownedWorkOrder(req.params.id, req.user.id);
    const { delayReason, revisedDeadline } = req.body;
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    if (!delayReason?.trim()) return res.status(422).json({ success: false, error: { message: 'A delay reason is required.' } });
    const deadline = revisedDeadline ? new Date(revisedDeadline) : null;
    if (deadline && !Number.isFinite(deadline.getTime())) return res.status(422).json({ success: false, error: { message: 'Enter a valid revised deadline.' } });
    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.workOrder.update({ where: { id: order.id }, data: { status: 'OVERDUE', ...(deadline ? { deadline } : {}) } });
      const history = await tx.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: 'OVERDUE', notes: `Delay reported: ${delayReason.trim()}${deadline ? ` Revised deadline: ${deadline.toISOString()}` : ''}`, changedByUserId: req.user.id, changedByName: req.user.name } });
      await notifyOfficer(tx, order, 'Field work delay reported', `${req.user.name} reported a delay for ${order.workOrderCode || order.id}: ${delayReason.trim()}`, `work-delay:${history.id}`);
      return tx.workOrder.findUnique({ where: { id: order.id }, include: workOrderInclude });
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

export async function createWorkerTask(req, res, next) {
  try {
    const { workOrderId, workerName, workerContact, taskDescription, deadline } = req.body;
    const order = await ownedWorkOrder(workOrderId, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    if (!workerName?.trim() || !taskDescription?.trim()) return res.status(422).json({ success: false, error: { message: 'Worker name and task details are required.' } });
    const taskId = randomUUID();
    const deadlineValue = deadline ? new Date(deadline) : null;
    if (deadlineValue && !Number.isFinite(deadlineValue.getTime())) return res.status(422).json({ success: false, error: { message: 'Enter a valid worker deadline.' } });
    const task = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO supervisor_worker_tasks (id, work_order_id, supervisor_id, worker_name, worker_contact, task_description, deadline, progress, status, created_at, updated_at) VALUES (${taskId}, ${order.id}, ${req.user.id}, ${workerName.trim()}, ${workerContact?.trim() || null}, ${taskDescription.trim()}, ${deadlineValue}, 0, 'Not Started', NOW(3), NOW(3))`;
      const rows = await tx.$queryRaw`SELECT id, work_order_id AS workOrderId, supervisor_id AS supervisorId, worker_name AS workerName, worker_contact AS workerContact, task_description AS taskDescription, deadline, progress, status, delay_reason AS delayReason, created_at AS createdAt, updated_at AS updatedAt FROM supervisor_worker_tasks WHERE id = ${taskId} LIMIT 1`;
      await notifyOfficer(tx, order, 'Worker assigned to complaint', `${req.user.name} assigned ${workerName.trim()} to work order ${order.workOrderCode || order.id}.`, `worker-task-created:${taskId}`);
      return rows[0];
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
}

export async function updateWorkerTask(req, res, next) {
  try {
    const existing = await prisma.$queryRaw`SELECT id, work_order_id AS workOrderId, supervisor_id AS supervisorId, worker_name AS workerName, worker_contact AS workerContact, task_description AS taskDescription, deadline, progress, status, delay_reason AS delayReason FROM supervisor_worker_tasks WHERE id = ${req.params.id} AND supervisor_id = ${req.user.id} LIMIT 1`;
    const task = existing[0];
    if (!task) return res.status(404).json({ success: false, error: { message: 'Worker assignment not found.' } });
    const { workerName, workerContact, taskDescription, deadline, progress, status, delayReason } = req.body;
    const validStatuses = ['Not Started', 'In Progress', 'Completed', 'Blocked'];
    const value = Number(progress);
    if (progress !== undefined && (!Number.isInteger(value) || value < 0 || value > 100)) return res.status(422).json({ success: false, error: { message: 'Progress must be between 0 and 100.' } });
    if (status !== undefined && !validStatuses.includes(status)) return res.status(422).json({ success: false, error: { message: 'Choose a valid assignment status.' } });
    const deadlineValue = deadline === undefined ? task.deadline : (deadline ? new Date(deadline) : null);
    if (deadlineValue && !Number.isFinite(new Date(deadlineValue).getTime())) return res.status(422).json({ success: false, error: { message: 'Enter a valid worker deadline.' } });
    const order = await ownedWorkOrder(task.workOrderId, req.user.id);
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`UPDATE supervisor_worker_tasks SET worker_name = ${workerName === undefined ? task.workerName : workerName.trim()}, worker_contact = ${workerContact === undefined ? task.workerContact : workerContact.trim() || null}, task_description = ${taskDescription === undefined ? task.taskDescription : taskDescription.trim()}, deadline = ${deadlineValue}, progress = ${progress === undefined ? task.progress : value}, status = ${status === undefined ? task.status : status}, delay_reason = ${delayReason === undefined ? task.delayReason : delayReason.trim() || null}, updated_at = NOW(3) WHERE id = ${task.id} AND supervisor_id = ${req.user.id}`;
      const rows = await tx.$queryRaw`SELECT id, work_order_id AS workOrderId, supervisor_id AS supervisorId, worker_name AS workerName, worker_contact AS workerContact, task_description AS taskDescription, deadline, progress, status, delay_reason AS delayReason, created_at AS createdAt, updated_at AS updatedAt FROM supervisor_worker_tasks WHERE id = ${task.id} LIMIT 1`;
      const changed = (status !== undefined && status !== task.status) || (progress !== undefined && value !== task.progress) || (delayReason?.trim() && delayReason.trim() !== (task.delayReason || ''));
      if (changed && order) await notifyOfficer(tx, order, 'Field worker update', `${req.user.name} updated ${task.workerName}'s assignment for work order ${order.workOrderCode || order.id}.${status !== undefined ? ` Status: ${status}.` : ''}${progress !== undefined ? ` Progress: ${value}%.` : ''}${delayReason?.trim() ? ` ${delayReason.trim()}` : ''}`, `worker-task-updated:${task.id}:${rows[0]?.updatedAt?.toISOString?.() || Date.now()}`);
      return rows[0];
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

export async function deleteWorkerTask(req, res, next) {
  try {
    const deleted = await prisma.$executeRaw`DELETE FROM supervisor_worker_tasks WHERE id = ${req.params.id} AND supervisor_id = ${req.user.id}`;
    if (!deleted) return res.status(404).json({ success: false, error: { message: 'Worker assignment not found.' } });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function recordMaterialMovement(req, res, next) {
  try {
    const order = await ownedWorkOrder(req.body.workOrderId, req.user.id);
    const item = await prisma.inventoryItem.findFirst({ where: { id: req.body.materialId, OR: [{ departmentId: req.user.departmentId || -1 }, { departmentId: null }] } });
    const quantity = Number(req.body.quantity);
    const typeMap = { RECEIVED: 'STOCK_ADDITION', USED: 'STOCK_DISPATCH', WASTE: 'STOCK_DISPATCH', RETURNED: 'STOCK_RETURN' };
    const transactionType = typeMap[req.body.type];
    if (!order || !item) return res.status(404).json({ success: false, error: { message: 'Assigned work order or department inventory item not found.' } });
    if (!transactionType || !Number.isInteger(quantity) || quantity < 1) return res.status(422).json({ success: false, error: { message: 'Choose a valid movement type and positive quantity.' } });
    const delta = transactionType === 'STOCK_ADDITION' || transactionType === 'STOCK_RETURN' ? quantity : -quantity;
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.inventoryItem.findUnique({ where: { id: item.id } });
      if (current.availableQuantity + delta < 0) throw Object.assign(new Error('The requested quantity exceeds available stock.'), { status: 409 });
      const changed = await tx.inventoryItem.update({ where: { id: item.id }, data: { availableQuantity: { increment: delta } } });
      return tx.inventoryTransaction.create({ data: { inventoryItemId: item.id, transactionType, quantityChange: delta, balanceAfter: changed.availableQuantity, workOrderId: order.id, reason: req.body.reason?.trim() || req.body.type, performedByUserId: req.user.id }, include: { inventoryItem: true } });
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
}

export async function submitMaterialRequisition(req, res, next) {
  try {
    const { workOrderId, materialName, requestedQty, unit, priority, reason, shortageDescription, additionalNotes } = req.body;
    const order = await ownedWorkOrder(workOrderId, req.user.id);
    const item = await prisma.inventoryItem.findFirst({ where: { name: materialName, OR: [{ departmentId: req.user.departmentId || -1 }, { departmentId: null }] } });
    const qty = Number(requestedQty);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    if (!item) return res.status(422).json({ success: false, error: { message: 'Choose a material from department inventory.' } });
    if (!Number.isInteger(qty) || qty < 1) return res.status(422).json({ success: false, error: { message: 'Enter a positive quantity.' } });
    const request = await prisma.$transaction(async (tx) => {
      const record = await tx.materialRequest.create({ data: {
        workOrderId: order.id, requestedByUserId: req.user.id, requestedByName: req.user.name,
        priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority) ? priority : 'MEDIUM',
        reason: [reason?.trim(), shortageDescription?.trim() ? `Shortage: ${shortageDescription.trim()}` : '', additionalNotes?.trim() ? `Additional notes: ${additionalNotes.trim()}` : '', `${qty} ${unit || item.unit} ${item.name}`].filter(Boolean).join(' — '),
        items: { create: { inventoryItemId: item.id, requestedQty: qty } },
      }, include: { items: { include: { inventoryItem: true } }, workOrder: { select: { id: true, workOrderCode: true, assignedByOfficerId: true } } } });
      if (order.assignedByOfficerId) await notifyUser(tx, {
        userId: order.assignedByOfficerId, role: 'OFFICER', type: 'WORK_ORDER',
        title: 'Material request submitted',
        message: `${req.user.name} requested ${qty} ${unit || item.unit} ${item.name}.`,
        complaintId: order.complaintId, workOrderId: order.id,
        relatedEntityType: 'WORK_ORDER', relatedEntityId: order.id,
        targetUrl: '/officer/inventory', eventKey: `material-request:${record.id}`,
      });
      return record;
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
}

export async function submitProgressReport(req, res, next) {
  try {
    const order = await ownedWorkOrder(req.body.workOrderId, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    if (!req.body.workCompleted?.trim()) return res.status(422).json({ success: false, error: { message: 'Report details are required.' } });
    const progress = Number(req.body.currentProgress ?? order.progress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) return res.status(422).json({ success: false, error: { message: 'Report progress must be between 0 and 100.' } });
    const reportDetails = {
      workCompleted: req.body.workCompleted.trim(),
      currentProgress: progress,
      workersInvolved: Array.isArray(req.body.workersInvolved) ? req.body.workersInvolved : [],
      materialsUsed: req.body.materialsUsed || '',
      remainingWork: req.body.remainingWork || '',
      problemsOrDelays: req.body.problemsOrDelays || '',
      nextSteps: req.body.nextSteps || '',
    };
    const report = await prisma.$transaction(async (tx) => {
      await tx.workOrder.update({ where: { id: order.id }, data: { progress } });
      const history = await tx.workOrderStatusHistory.create({ data: {
        workOrderId: order.id, previousStatus: order.status, newStatus: order.status,
        notes: `Progress report: ${JSON.stringify(reportDetails)}`,
        changedByUserId: req.user.id, changedByName: req.user.name,
      } });
      await notifyOfficer(tx, order, 'Field progress report submitted', `${req.user.name} submitted a progress report for ${order.workOrderCode || order.id}: ${reportDetails.workCompleted}`, `progress-report:${history.id}`);
      return history;
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
}
