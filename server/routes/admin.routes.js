// Admin routes - user management, platform stats

import { Router } from 'express';
import { getAllUsers, toggleBan, changeRole, getPlatformStats } from '../controllers/admin.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = Router();

router.get('/users', authMiddleware, roleMiddleware('admin'), getAllUsers);
router.patch('/users/:id/ban', authMiddleware, roleMiddleware('admin'), toggleBan);
router.patch('/users/:id/role', authMiddleware, roleMiddleware('admin'), changeRole);
router.get('/stats', authMiddleware, roleMiddleware('admin'), getPlatformStats);

export default router;
