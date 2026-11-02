import { Router } from 'express';
import healthRoutes from './health.js';
import supervisorRoutes from './supervisor.js';

const router = Router();

// Mount Health Check endpoint at /api/health
router.use('/health', healthRoutes);

// Mount Field Supervisor endpoints at /api/supervisor (Member 3)
router.use('/supervisor', supervisorRoutes);

export default router;
