import { prisma } from '../lib/prisma.js';
import { parseComplaintPhotos } from '../lib/photoUtils.js';
import { randomUUID } from 'node:crypto';

const workOrderInclude = {
  department: true,
  complaint: { include: { category: true, user: { select: { id: true, name: true } }, photos: true } },
  photos: { orderBy: { createdAt: 'asc' } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
  materialRequests: { include: { items: { include: { inventoryItem: true } } } },
  repairVerifications: { orderBy: { submittedAt: 'desc' }, take: 1 },
};

async function ownedWorkOrder(id, supervisorId) {
  return prisma.workOrder.findFirst({ where: { id, supervisorId }, include: workOrderInclude });
}

async function notifyOfficer(tx, order, title, message) {
  if (!order.assignedByOfficerId) return;
  await tx.notification.create({ data: {
    userId: order.assignedByOfficerId,
    targetRole: 'OFFICER',
    notificationType: 'WORK_ORDER',
    title,
    message,
    complaintId: order.complaintId,
    workOrderId: order.id,
    linkId: order.id,
  } });
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
    const record = await prisma.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: order.status, notes: note, changedByUserId: req.user.id, changedByName: req.user.name } });
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
}

export async function getSupervisorWorkOrders(req, res, next) {
  try {
    const data = await prisma.workOrder.findMany({ where: { supervisorId: req.user.id }, include: workOrderInclude, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] });
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function getSupervisorDashboardData(req, res, next) {
  try {
    const profile = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, phone: true, avatarUrl: true, title: true, wardCoverage: true, department: { select: { id: true, name: true } } } });
    const orders = await prisma.workOrder.findMany({ where: { supervisorId: req.user.id }, include: workOrderInclude, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] });
    const inventory = await prisma.inventoryItem.findMany({
      where: { OR: [{ departmentId: req.user.departmentId || -1 }, { departmentId: null }] },
      orderBy: { name: 'asc' },
    });
    const orderIds = orders.map((order) => order.id);
    const [requests, transactions, notifications, workerTasks] = await Promise.all([
      prisma.materialRequest.findMany({ where: { requestedByUserId: req.user.id, workOrderId: { in: orderIds } }, include: { items: { include: { inventoryItem: true } }, workOrder: { select: { id: true, workOrderCode: true, complaintId: true, department: { select: { name: true } } } } }, orderBy: { requestDate: 'desc' } }),
      orderIds.length ? prisma.inventoryTransaction.findMany({ where: { workOrderId: { in: orderIds } }, include: { inventoryItem: true }, orderBy: { createdAt: 'desc' } }) : [],
      prisma.notification.findMany({ where: { OR: [{ userId: req.user.id }, { userId: null, targetRole: 'SUPERVISOR' }] }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.$queryRaw`SELECT task.id, task.work_order_id AS workOrderId, task.supervisor_id AS supervisorId, task.worker_name AS workerName, task.worker_contact AS workerContact, task.task_description AS taskDescription, task.deadline, task.progress, task.status, task.delay_reason AS delayReason, task.created_at AS createdAt, task.updated_at AS updatedAt, order_record.work_order_code AS workOrderCode FROM supervisor_worker_tasks task JOIN work_orders order_record ON order_record.id = task.work_order_id WHERE task.supervisor_id = ${req.user.id} ORDER BY task.created_at DESC`,
    ]);
    res.json({ success: true, data: { profile, orders, inventory, requests, transactions, notifications, workerTasks } });
  } catch (error) { next(error); }
}

export async function updateProgress(req, res, next) {
  try {
    const order = await ownedWorkOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    const { progress, progressNotes, estimatedCompletionDate, blockers = [], notifyOfficer = true } = req.body;
    const value = Number(progress);
    if (!Number.isInteger(value) || value < 0 || value > 100) return res.status(422).json({ success: false, error: { message: 'Progress must be between 0 and 100.' } });
    const notes = [progressNotes?.trim(), blockers.length ? `Blockers: ${blockers.join('; ')}` : ''].filter(Boolean).join('\n');
    const updated = await prisma.$transaction(async (tx) => {
      const data = { progress: value, status: order.status === 'ASSIGNED' ? 'IN_PROGRESS' : order.status };
      if (estimatedCompletionDate && Number.isFinite(new Date(estimatedCompletionDate).getTime())) data.deadline = new Date(estimatedCompletionDate);
      const record = await tx.workOrder.update({ where: { id: order.id }, data });
      await tx.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: record.status, notes: notes || `Progress updated to ${value}%.`, changedByUserId: req.user.id, changedByName: req.user.name } });
      if (notifyOfficer) await notifyOfficer(tx, order, 'Field work progress updated', `${req.user.name} updated ${order.workOrderCode || order.id} to ${value}%.`);
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
      await tx.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: 'OVERDUE', notes: `Delay reported: ${delayReason.trim()}${deadline ? ` Revised deadline: ${deadline.toISOString()}` : ''}`, changedByUserId: req.user.id, changedByName: req.user.name } });
      await notifyOfficer(tx, order, 'Field work delay reported', `${req.user.name} reported a delay for ${order.workOrderCode || order.id}: ${delayReason.trim()}`);
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
    await prisma.$executeRaw`INSERT INTO supervisor_worker_tasks (id, work_order_id, supervisor_id, worker_name, worker_contact, task_description, deadline, progress, status, created_at, updated_at) VALUES (${taskId}, ${order.id}, ${req.user.id}, ${workerName.trim()}, ${workerContact?.trim() || null}, ${taskDescription.trim()}, ${deadlineValue}, 0, 'Not Started', NOW(3), NOW(3))`;
    const task = await prisma.$queryRaw`SELECT id, work_order_id AS workOrderId, supervisor_id AS supervisorId, worker_name AS workerName, worker_contact AS workerContact, task_description AS taskDescription, deadline, progress, status, delay_reason AS delayReason, created_at AS createdAt, updated_at AS updatedAt FROM supervisor_worker_tasks WHERE id = ${taskId} LIMIT 1`;
    res.status(201).json({ success: true, data: task[0] });
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
    await prisma.$executeRaw`UPDATE supervisor_worker_tasks SET worker_name = ${workerName === undefined ? task.workerName : workerName.trim()}, worker_contact = ${workerContact === undefined ? task.workerContact : workerContact.trim() || null}, task_description = ${taskDescription === undefined ? task.taskDescription : taskDescription.trim()}, deadline = ${deadlineValue}, progress = ${progress === undefined ? task.progress : value}, status = ${status === undefined ? task.status : status}, delay_reason = ${delayReason === undefined ? task.delayReason : delayReason.trim() || null}, updated_at = NOW(3) WHERE id = ${task.id} AND supervisor_id = ${req.user.id}`;
    const updated = await prisma.$queryRaw`SELECT id, work_order_id AS workOrderId, supervisor_id AS supervisorId, worker_name AS workerName, worker_contact AS workerContact, task_description AS taskDescription, deadline, progress, status, delay_reason AS delayReason, created_at AS createdAt, updated_at AS updatedAt FROM supervisor_worker_tasks WHERE id = ${task.id} LIMIT 1`;
    res.json({ success: true, data: updated[0] });
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
      if (order.assignedByOfficerId) await tx.notification.create({ data: { userId: order.assignedByOfficerId, targetRole: 'OFFICER', notificationType: 'WORK_ORDER', title: 'Material request submitted', message: `${req.user.name} requested ${qty} ${unit || item.unit} ${item.name}.`, workOrderId: order.id, linkId: order.id } });
      return record;
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
}

export async function submitPhotoEvidence(req, res, next) {
  try {
    const { workOrderId, beforePhotos = [], afterPhotos, repairNotes } = req.body;
    const order = await ownedWorkOrder(workOrderId, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Assigned work order not found.' } });
    const photos = parseComplaintPhotos(afterPhotos);
    const before = parseComplaintPhotos(beforePhotos);
    if (!photos.length || !repairNotes?.trim()) return res.status(422).json({ success: false, error: { message: 'Upload at least one completion photo and add repair notes.' } });
    const result = await prisma.$transaction(async (tx) => {
      await tx.workOrderPhoto.createMany({ data: [
        ...before.map((photo) => ({ workOrderId: order.id, uploadedByUserId: req.user.id, imageUrl: photo.imageUrl, photoType: 'BEFORE' })),
        ...photos.map((photo) => ({ workOrderId: order.id, uploadedByUserId: req.user.id, imageUrl: photo.imageUrl, photoType: 'AFTER', caption: repairNotes.trim() })),
      ] });
      const updated = await tx.workOrder.update({ where: { id: order.id }, data: { status: 'AWAITING_VERIFICATION', progress: 100, completedDate: new Date(), afterPhotoUrl: photos[0].imageUrl } });
      await tx.repairVerification.create({ data: { complaintId: order.complaintId, workOrderId: order.id, submittedBySupervisorId: req.user.id, supervisorName: req.user.name, completionDetails: repairNotes.trim(), beforePhotoUrl: order.complaint.photos[0]?.imageUrl || null, completionPhotoUrl: photos[0].imageUrl, status: 'AWAITING_VERIFICATION' } });
      await tx.workOrderStatusHistory.create({ data: { workOrderId: order.id, previousStatus: order.status, newStatus: 'AWAITING_VERIFICATION', notes: repairNotes.trim(), changedByUserId: req.user.id, changedByName: req.user.name } });
      await notifyOfficer(tx, order, 'Work completion awaits verification', `${req.user.name} submitted completion evidence for ${order.workOrderCode || order.id}.`);
      return updated;
    });
    res.status(201).json({ success: true, data: result });
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
      await notifyOfficer(tx, order, 'Field progress report submitted', `${req.user.name} submitted a progress report for ${order.workOrderCode || order.id}.`);
      return history;
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
}
