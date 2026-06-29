// Tournament routes - CRUD, status updates

import { Router } from 'express';
import { createTournament, getAllTournaments, getTournamentById, updateTournament, updateStatus, deleteTournament, startTournament } from '../controllers/tournament.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);
router.post('/', authMiddleware, roleMiddleware('organizer', 'admin'), createTournament);
router.put('/:id', authMiddleware, roleMiddleware('organizer', 'admin'), updateTournament);
router.patch('/:id/status', authMiddleware, roleMiddleware('organizer', 'admin'), updateStatus);
router.post('/:id/start', authMiddleware, roleMiddleware('organizer', 'admin'), startTournament);
router.delete('/:id', authMiddleware, roleMiddleware('organizer', 'admin'), deleteTournament);

export default router;
