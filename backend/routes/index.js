import { Router } from 'express';
import healthRoutes from './health.js';
import adminRoutes from './admin.js';

const router = Router();

// Mount Health Check endpoint at /api/health
router.use('/health', healthRoutes);

// Mount Admin APIs at /api/admin (Member 4)
router.use('/admin', adminRoutes);

export default router;
