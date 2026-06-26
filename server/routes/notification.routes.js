// Notification routes - get, mark read, clear

import { Router } from 'express';
import { getMyNotifications, markAsRead, clearNotifications } from '../controllers/notification.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getMyNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);
router.delete('/', authMiddleware, clearNotifications);

export default router;
