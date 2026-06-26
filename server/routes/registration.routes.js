// Registration routes - register, list, approve/reject, withdraw

import { Router } from 'express';
import { registerForTournament, getRegistrationsByTournament, updateRegistrationStatus, withdrawRegistration } from '../controllers/registration.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = Router();

router.post('/', authMiddleware, registerForTournament);
router.get('/tournament/:tournamentId', authMiddleware, getRegistrationsByTournament);
router.patch('/:id/status', authMiddleware, roleMiddleware('organizer', 'admin'), updateRegistrationStatus);
router.delete('/:id', authMiddleware, withdrawRegistration);

export default router;
