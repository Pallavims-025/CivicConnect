import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import complaintRoutes from './complaints.js';

const router = Router();

// Mount Health Check endpoint at /api/health
router.use('/health', healthRoutes);

// Mount Auth endpoints at /api/auth
router.use('/auth', authRoutes);

// Complaint records and locations use the existing Prisma complaint model.
router.use('/complaints', complaintRoutes);

export default router;
