import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createComplaint, getOfficerComplaint, listCategories, listDuplicateReviews, listMyComplaints, listOfficerComplaints, listOfficerMapComplaints, reviewDuplicateMatch, updateComplaintStatus } from '../controllers/complaintController.js';

const router = Router();

router.get('/categories', authenticate, authorize('CITIZEN'), listCategories);
router.post('/', authenticate, authorize('CITIZEN'), createComplaint);
router.get('/mine', authenticate, authorize('CITIZEN'), listMyComplaints);
router.get('/officer', authenticate, authorize('OFFICER'), listOfficerComplaints);
router.get('/officer/duplicates', authenticate, authorize('OFFICER'), listDuplicateReviews);
router.patch('/officer/duplicates/:matchId', authenticate, authorize('OFFICER'), reviewDuplicateMatch);
router.get('/officer/:id', authenticate, authorize('OFFICER'), getOfficerComplaint);
router.get('/officer-map', authenticate, authorize('OFFICER'), listOfficerMapComplaints);
router.patch('/:id/status', authenticate, authorize('OFFICER'), updateComplaintStatus);

export default router;
