import { Router } from 'express';
import { createReport, getAllReports, updateReportStatus } from '../controllers/report.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = Router();

// Player routes
router.post('/', authMiddleware, createReport);

// Admin routes
router.get('/', authMiddleware, roleMiddleware('admin'), getAllReports);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateReportStatus);

export default router;
