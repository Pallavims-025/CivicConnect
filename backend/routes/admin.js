import { Router } from 'express';
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

const router = Router();

// Platform Telemetry & Stats
router.get('/stats', getAdminStats);

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
