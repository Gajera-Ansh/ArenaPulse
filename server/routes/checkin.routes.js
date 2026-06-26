// Checkin routes - generate QR, verify, list by match

import { Router } from 'express';
import { generateCheckin, verifyCheckin, getCheckinsByMatch } from '../controllers/checkin.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = Router();

router.post('/generate', authMiddleware, generateCheckin);
router.post('/verify', authMiddleware, roleMiddleware('organizer', 'admin'), verifyCheckin);
router.get('/match/:matchId', authMiddleware, getCheckinsByMatch);

export default router;
