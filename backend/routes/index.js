import { Router } from 'express';
import healthRoutes from './health.js';
<<<<<<< HEAD
import adminRoutes from './admin.js';
=======
import authRoutes from './auth.js';
>>>>>>> c4ea025775427627c398aca7f22d92c3685098df

const router = Router();

// Mount Health Check endpoint at /api/health
router.use('/health', healthRoutes);

<<<<<<< HEAD
// Mount Admin APIs at /api/admin (Member 4)
router.use('/admin', adminRoutes);
=======
// Mount Auth endpoints at /api/auth
router.use('/auth', authRoutes);
>>>>>>> c4ea025775427627c398aca7f22d92c3685098df

export default router;
