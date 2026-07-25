import express from 'express';
import { getTournamentMessages } from '../controllers/chat.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:tournamentId', authMiddleware, getTournamentMessages);

export default router;
