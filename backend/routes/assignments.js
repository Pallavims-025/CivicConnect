import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  assignComplaint,
  completeAssignment,
  listActiveSupervisors,
  listMyAssignments,
  listOfficerAssignments,
  listNotifications,
  listPendingVerifications,
  markNotificationRead,
  reviewCompletion,
  updateAssignmentStatus,
} from '../controllers/assignmentController.js';

const router = Router();

router.get('/supervisors', authenticate, authorize('OFFICER'), listActiveSupervisors);
router.post('/complaints/:complaintId', authenticate, authorize('OFFICER'), assignComplaint);
router.get('/officer', authenticate, authorize('OFFICER'), listOfficerAssignments);
router.get('/mine', authenticate, authorize('SUPERVISOR'), listMyAssignments);
router.patch('/:id/status', authenticate, authorize('SUPERVISOR'), updateAssignmentStatus);
router.post('/:id/complete', authenticate, authorize('SUPERVISOR'), completeAssignment);
router.get('/verifications', authenticate, authorize('OFFICER'), listPendingVerifications);
router.patch('/verifications/:id', authenticate, authorize('OFFICER'), reviewCompletion);
router.get('/notifications', authenticate, listNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

export default router;
