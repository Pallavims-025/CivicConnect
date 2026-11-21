import { Router } from 'express';
import {
  getSupervisorProfile,
  getSupervisorWorkOrders,
  updateProgress,
  reportDelay,
  createWorkerTask,
  recordMaterialMovement,
  submitMaterialRequisition,
  submitPhotoEvidence,
  submitProgressReport,
} from '../controllers/supervisorController.js';

const router = Router();

// GET /api/supervisor/profile
router.get('/profile', getSupervisorProfile);

// GET /api/supervisor/work-orders
router.get('/work-orders', getSupervisorWorkOrders);

// PUT /api/supervisor/work-orders/:id/progress
router.put('/work-orders/:id/progress', updateProgress);

// POST /api/supervisor/work-orders/:id/delay
router.post('/work-orders/:id/delay', reportDelay);

// POST /api/supervisor/worker-tasks
router.post('/worker-tasks', createWorkerTask);

// POST /api/supervisor/materials/transaction
router.post('/materials/transaction', recordMaterialMovement);

// POST /api/supervisor/material-requests
router.post('/material-requests', submitMaterialRequisition);

// POST /api/supervisor/photo-evidence
router.post('/photo-evidence', submitPhotoEvidence);

// POST /api/supervisor/progress-reports
router.post('/progress-reports', submitProgressReport);

export default router;
