import { Router } from 'express';
import healthRoutes from './health.js';

const router = Router();

// Mount Health Check endpoint at /api/health
router.use('/health', healthRoutes);

export default router;
