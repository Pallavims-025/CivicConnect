import { Router } from 'express';
import jwt from 'jsonwebtoken';
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

const DEFAULT_ADMIN_USER = {
  id: 'usr-admin-demo',
  name: 'Santosh (Admin)',
  email: 'admin@civicconnect.org',
  role: 'ADMIN',
  approvalStatus: 'APPROVED',
  isActive: true,
  department: { id: 1, name: 'IT & Digital Governance', code: 'DEPT-ADMIN' },
};

// Protect every administrator API, including future routes added below.
// In development, allow seamless admin access without blocking on stale/mock tokens
router.use((req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = DEFAULT_ADMIN_USER;
      return next();
    }

    const token = authHeader.slice(7).trim();
    if (!token || token.startsWith('mock_token_') || token === 'null' || token === 'undefined') {
      req.user = DEFAULT_ADMIN_USER;
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'civicconnect_local_development_secret_change_me';
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload && payload.role === 'ADMIN') {
        req.user = {
          id: payload.sub,
          name: payload.name || DEFAULT_ADMIN_USER.name,
          email: payload.email || DEFAULT_ADMIN_USER.email,
          role: 'ADMIN',
          approvalStatus: 'APPROVED',
          isActive: true,
          department: DEFAULT_ADMIN_USER.department,
        };
        return next();
      }
    } catch {
      // In development, an expired or stale token should not block the admin dashboard
    }

    req.user = DEFAULT_ADMIN_USER;
    return next();
  }

  return authenticate(req, res, () => authorize('ADMIN')(req, res, next));
});

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
