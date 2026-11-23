import { createHash } from 'node:crypto';

export async function notifyUser(tx, {
  userId,
  role,
  type = 'GENERAL',
  title,
  message,
  complaintId = null,
  workOrderId = null,
  relatedEntityType = null,
  relatedEntityId = null,
  targetUrl = null,
  eventKey,
}) {
  if (!userId || !title || !message || !eventKey) return null;
  const notificationCode = `EVT-${createHash('sha256').update(`${eventKey}:${userId}`).digest('hex').slice(0, 40)}`;
  const data = {
    userId,
    targetRole: role,
    notificationType: type,
    title: String(title).slice(0, 255),
    message: String(message),
    complaintId,
    workOrderId,
    linkId: relatedEntityId || complaintId || workOrderId,
    relatedEntityType,
    relatedEntityId,
    targetUrl,
  };
  return tx.notification.upsert({
    where: { notificationCode },
    create: { notificationCode, ...data },
    update: {},
  });
}

export async function notifyDepartmentOfficers(tx, {
  departmentId,
  excludeUserId = null,
  ...notification
}) {
  if (!departmentId) return;
  const officers = await tx.user.findMany({
    where: { role: 'OFFICER', departmentId, isActive: true, approvalStatus: 'APPROVED', ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    select: { id: true },
  });
  await Promise.all(officers.map((officer) => notifyUser(tx, { ...notification, userId: officer.id, role: 'OFFICER' })));
}
