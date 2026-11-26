import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { completeAssignment } from '../controllers/assignmentController.js';
import {
  getSupervisorProfile,
  getSupervisorDashboardData,
  updateSupervisorProfile,
  uploadSupervisorProfilePhoto,
  removeSupervisorProfilePhoto,
  updateWorkOrderCrew,
  addWorkOrderNote,
  getSupervisorWorkOrders,
  updateProgress,
  reportDelay,
  createWorkerTask,
  updateWorkerTask,
  deleteWorkerTask,
  recordMaterialMovement,
  submitMaterialRequisition,
  submitProgressReport,
} from '../controllers/supervisorController.js';

const router = Router();

router.use(authenticate, authorize('SUPERVISOR'));

// GET /api/supervisor/profile
router.get('/profile', getSupervisorProfile);
router.put('/profile', updateSupervisorProfile);
router.post('/profile/photo', uploadSupervisorProfilePhoto);
router.delete('/profile/photo', removeSupervisorProfilePhoto);
router.get('/dashboard-data', getSupervisorDashboardData);
router.put('/work-orders/:id/crew', updateWorkOrderCrew);
router.post('/work-orders/:id/notes', addWorkOrderNote);

// GET /api/supervisor/work-orders
router.get('/work-orders', getSupervisorWorkOrders);

// PUT /api/supervisor/work-orders/:id/progress
router.put('/work-orders/:id/progress', updateProgress);

// POST /api/supervisor/work-orders/:id/delay
router.post('/work-orders/:id/delay', reportDelay);

// POST /api/supervisor/worker-tasks
router.post('/worker-tasks', createWorkerTask);
router.put('/worker-tasks/:id', updateWorkerTask);
router.delete('/worker-tasks/:id', deleteWorkerTask);

// POST /api/supervisor/materials/transaction
router.post('/materials/transaction', recordMaterialMovement);

// POST /api/supervisor/material-requests
router.post('/material-requests', submitMaterialRequisition);

// POST /api/supervisor/photo-evidence
router.post('/photo-evidence', (req, res, next) => {
  req.params.id = req.body.workOrderId;
  req.body = { photos: req.body.afterPhotos, remarks: req.body.repairNotes };
  return completeAssignment(req, res, next);
});

// POST /api/supervisor/progress-reports
router.post('/progress-reports', submitProgressReport);

export default router;
