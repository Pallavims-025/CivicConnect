import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createComplaint, listCategories, listMyComplaints, listOfficerComplaints } from '../controllers/complaintController.js';

const router = Router();

router.get('/categories', authenticate, authorize('CITIZEN'), listCategories);
router.post('/', authenticate, authorize('CITIZEN'), createComplaint);
router.get('/mine', authenticate, authorize('CITIZEN'), listMyComplaints);
router.get('/officer-map', authenticate, authorize('OFFICER'), listOfficerComplaints);

export default router;
