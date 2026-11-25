import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAdminStats,
  getAuditLogs,
} from '../controllers/adminController.js';
import { getAdminProfile, uploadAdminProfilePhoto } from '../controllers/adminProfileController.js';
import { getAdminDashboard } from '../controllers/adminDashboardController.js';

const router = Router();

// Protect every administrator API, including future routes added below.
router.use(authenticate, authorize('ADMIN'));

// Authenticated administrator's own profile and avatar.
router.get('/profile', getAdminProfile);
router.post('/profile/photo', uploadAdminProfilePhoto);

// Platform Telemetry & Stats
router.get('/stats', getAdminStats);
router.get('/dashboard', getAdminDashboard);

// Audit Trail
router.get('/audit', getAuditLogs);

// User & Role Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Department & Category Configuration
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

export default router;
