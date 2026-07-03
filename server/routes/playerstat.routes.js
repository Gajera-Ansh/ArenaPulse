// PlayerStat routes - submit and retrieve player game stats

import { Router } from 'express';
import { getGameFields, submitPlayerStats, getPlayerStatsLeaderboard, getMatchPlayers, getMyStats } from '../controllers/playerstat.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/fields/:game', getGameFields);
router.get('/leaderboard', getPlayerStatsLeaderboard);

// Protected (player/organizer)
router.get('/me', authMiddleware, getMyStats);

// Protected (organizer only)
router.post('/submit', authMiddleware, submitPlayerStats);
router.get('/match-players/:teamAId/:teamBId', authMiddleware, getMatchPlayers);

export default router;
