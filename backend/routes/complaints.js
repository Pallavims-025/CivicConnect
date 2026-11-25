import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createComplaint, getOfficerComplaint, listCategories, listDuplicateReviews, listMyComplaints, listOfficerComplaints, listOfficerMapComplaints, retryComplaintPhotoVerification, reviewComplaintPhotoLocation, reviewDuplicateMatch, updateComplaintStatus } from '../controllers/complaintController.js';

const router = Router();

router.get('/categories', authenticate, authorize('CITIZEN'), listCategories);
router.post('/', authenticate, authorize('CITIZEN'), createComplaint);
router.get('/mine', authenticate, authorize('CITIZEN'), listMyComplaints);
router.post('/:id/photos/retry', authenticate, authorize('CITIZEN'), retryComplaintPhotoVerification);
router.get('/officer', authenticate, authorize('OFFICER'), listOfficerComplaints);
router.get('/officer/duplicates', authenticate, authorize('OFFICER'), listDuplicateReviews);
router.patch('/officer/duplicates/:matchId', authenticate, authorize('OFFICER'), reviewDuplicateMatch);
router.patch('/officer/:id/photos/:photoId/location-review', authenticate, authorize('OFFICER'), reviewComplaintPhotoLocation);
router.get('/officer/:id', authenticate, authorize('OFFICER'), getOfficerComplaint);
router.get('/officer-map', authenticate, authorize('OFFICER'), listOfficerMapComplaints);
router.patch('/:id/status', authenticate, authorize('OFFICER'), updateComplaintStatus);

export default router;
