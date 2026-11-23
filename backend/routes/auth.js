import { Router } from 'express';
import {
  signup,
  login,
  me,
  logout,
  pendingOfficers,
  approveOfficer,
  listUsers,
  updateUserStatus,
  updateCitizenProfile,
  updateOfficerProfile,
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Authenticated routes
router.get('/me', authenticate, me);
router.patch('/citizen-profile', authenticate, authorize('CITIZEN'), updateCitizenProfile);
router.patch('/officer-profile', authenticate, authorize('OFFICER'), updateOfficerProfile);
router.post('/logout', authenticate, logout);

// Admin-only routes
router.get('/pending-officers', authenticate, authorize('ADMIN'), pendingOfficers);
router.patch('/approve-officer/:id', authenticate, authorize('ADMIN'), approveOfficer);
router.get('/users', authenticate, authorize('ADMIN'), listUsers);
router.patch('/users/:id/status', authenticate, authorize('ADMIN'), updateUserStatus);

export default router;
