/**
 * CivicConnect - Member 3: Field Supervisor Controller
 * REST API handlers for work orders, worker assignments, repair progress,
 * material inventory movements, requisitions, photo evidence, and progress reports.
 */

// Simulated storage matching MySQL schema tables
const mockSupervisorState = {
  profile: {
    id: 'usr-sup-01',
    name: 'Supervisor M. Rao',
    employeeId: 'EMP-SUP-2024-08',
    department: 'Roads & Bridges Dept',
    email: 'm.rao@civicconnect.gov.in',
    phone: '+91 98451 22334',
    assignedArea: 'Central Zone - Ward 14 Indiranagar',
    shift: 'Day Shift (08:00 AM - 05:00 PM)',
  },
};

/**
 * GET /api/supervisor/profile
 */
export async function getSupervisorProfile(req, res) {
  return res.json({
    success: true,
    data: mockSupervisorState.profile,
  });
}

/**
 * GET /api/supervisor/work-orders
 */
export async function getSupervisorWorkOrders(req, res) {
  return res.json({
    success: true,
    message: 'Supervisor work orders retrieved successfully',
    supervisor: mockSupervisorState.profile.name,
    timestamp: new Date().toISOString(),
  });
}

/**
 * PUT /api/supervisor/work-orders/:id/progress
 */
export async function updateProgress(req, res) {
  const { id } = req.params;
  const { progress, progressNotes, blockers, estimatedCompletionDate, notifyOfficer } = req.body;

  const numProgress = parseInt(progress) || 0;

  return res.json({
    success: true,
    message: `Work Order #${id} progress updated to ${numProgress}%`,
    data: {
      workOrderId: id,
      progress: numProgress,
      progressNotes,
      blockers,
      estimatedCompletionDate,
      officerNotified: !!notifyOfficer,
      updatedAt: new Date().toISOString(),
      complaintStatus: 'IN_PROGRESS', // Kept unresolved per project policy!
    },
  });
}

/**
 * POST /api/supervisor/work-orders/:id/delay
 */
export async function reportDelay(req, res) {
  const { id } = req.params;
  const { delayReason, revisedDeadline } = req.body;

  if (!delayReason) {
    return res.status(400).json({ success: false, error: 'delayReason is required' });
  }

  return res.json({
    success: true,
    message: `Delay reported for Work Order #${id}`,
    data: {
      workOrderId: id,
      delayReason,
      revisedDeadline,
      status: 'OVERDUE',
      reportedAt: new Date().toISOString(),
    },
  });
}

/**
 * POST /api/supervisor/worker-tasks
 */
export async function createWorkerTask(req, res) {
  const { workOrderId, workerId, taskDescription, deadline } = req.body;

  if (!workOrderId || !workerId || !taskDescription) {
    return res.status(400).json({ success: false, error: 'workOrderId, workerId, and taskDescription are required' });
  }

  const taskId = `TSK-${Date.now().toString().slice(-4)}`;

  return res.status(201).json({
    success: true,
    message: 'Worker task successfully assigned',
    data: {
      id: taskId,
      workOrderId,
      workerId,
      taskDescription,
      deadline,
      progress: 0,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
    },
  });
}

/**
 * POST /api/supervisor/materials/transaction
 */
export async function recordMaterialMovement(req, res) {
  const { workOrderId, materialId, materialName, type, quantity, reason } = req.body;
  const qty = parseInt(quantity);

  if (!workOrderId || !type || !qty || qty <= 0) {
    return res.status(400).json({ success: false, error: 'Valid workOrderId, type, and positive quantity are required.' });
  }

  return res.json({
    success: true,
    message: `Recorded ${type} transaction of ${qty} units for #${workOrderId}`,
    data: {
      transactionId: `TXN-${Date.now().toString().slice(-4)}`,
      workOrderId,
      materialId,
      materialName,
      type,
      quantity: qty,
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * POST /api/supervisor/material-requests
 */
export async function submitMaterialRequisition(req, res) {
  const { workOrderId, materialName, requestedQty, unit, priority, reason } = req.body;
  const qty = parseInt(requestedQty);

  if (!workOrderId || !materialName || !qty || qty <= 0) {
    return res.status(400).json({ success: false, error: 'workOrderId, materialName, and valid requestedQty are required.' });
  }

  const reqId = `MR-2026-${Date.now().toString().slice(-3)}`;

  return res.status(201).json({
    success: true,
    message: 'Material requisition submitted to Municipal Officer queue',
    data: {
      id: reqId,
      workOrderId,
      materialName,
      requestedQty: qty,
      unit: unit || 'Units',
      priority: priority || 'MEDIUM',
      reason,
      status: 'Pending Approval',
      requestDate: new Date().toISOString(),
    },
  });
}

/**
 * POST /api/supervisor/photo-evidence
 */
export async function submitPhotoEvidence(req, res) {
  const { workOrderId, beforePhotos, afterPhotos, repairNotes, gpsCoordinates, manualLocation } = req.body;

  if (!workOrderId) {
    return res.status(400).json({ success: false, error: 'workOrderId is required.' });
  }

  return res.json({
    success: true,
    message: 'Photo evidence received. Work Order transitioned to AWAITING_VERIFICATION.',
    data: {
      workOrderId,
      verificationStatus: 'AWAITING_VERIFICATION',
      beforePhotosCount: beforePhotos?.length || 0,
      afterPhotosCount: afterPhotos?.length || 0,
      gpsCoordinates,
      manualLocation,
      repairNotes,
      submittedAt: new Date().toISOString(),
    },
  });
}

/**
 * POST /api/supervisor/progress-reports
 */
export async function submitProgressReport(req, res) {
  const { workOrderId, workCompleted, currentProgress, workersInvolved, materialsUsed, nextSteps } = req.body;

  const reportId = `PR-2026-${Date.now().toString().slice(-3)}`;

  return res.status(201).json({
    success: true,
    message: 'Progress report archived and officer notified.',
    data: {
      id: reportId,
      workOrderId,
      workCompleted,
      currentProgress: parseInt(currentProgress) || 0,
      workersInvolved,
      materialsUsed,
      nextSteps,
      timestamp: new Date().toISOString(),
    },
  });
}
