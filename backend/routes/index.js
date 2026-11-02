import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';

const router = Router();

// Mount Health Check endpoint at /api/health
router.use('/health', healthRoutes);

// Mount Auth endpoints at /api/auth
router.use('/auth', authRoutes);

export default router;
