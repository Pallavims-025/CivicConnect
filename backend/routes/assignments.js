import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  assignComplaint,
  completeAssignment,
  listActiveSupervisors,
  listMyAssignments,
  listOfficerAssignments,
  listPendingVerifications,
  markNotificationRead,
  reviewCompletion,
  updateAssignmentStatus,
  listOfficerMaterialRequests,
  reviewOfficerMaterialRequest,
} from '../controllers/assignmentController.js';

const router = Router();

router.get('/supervisors', authenticate, authorize('OFFICER'), listActiveSupervisors);
router.post('/complaints/:complaintId', authenticate, authorize('OFFICER'), assignComplaint);
router.get('/officer', authenticate, authorize('OFFICER'), listOfficerAssignments);
router.get('/material-requests', authenticate, authorize('OFFICER'), listOfficerMaterialRequests);
router.patch('/material-requests/:id', authenticate, authorize('OFFICER'), reviewOfficerMaterialRequest);
router.get('/mine', authenticate, authorize('SUPERVISOR'), listMyAssignments);
router.patch('/:id/status', authenticate, authorize('SUPERVISOR'), updateAssignmentStatus);
router.post('/:id/complete', authenticate, authorize('SUPERVISOR'), completeAssignment);
router.get('/verifications', authenticate, authorize('OFFICER'), listPendingVerifications);
router.patch('/verifications/:id', authenticate, authorize('OFFICER'), reviewCompletion);

export default router;
