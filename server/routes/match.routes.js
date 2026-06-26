// Match routes - get matches, update score, submit result

import { Router } from 'express';
import { getMatchesByTournament, getMatchById, updateScore, submitResult } from '../controllers/match.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = Router();

router.get('/tournament/:tournamentId', getMatchesByTournament);
router.get('/:id', getMatchById);
router.patch('/:id/score', authMiddleware, roleMiddleware('organizer', 'admin'), updateScore);
router.post('/:id/result', authMiddleware, roleMiddleware('organizer', 'admin'), submitResult);

export default router;
