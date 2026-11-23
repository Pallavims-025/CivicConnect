import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  countUnreadNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/assignmentController.js';

const router = Router();
router.use(authenticate);
router.get('/', listNotifications);
router.get('/unread-count', countUnreadNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
