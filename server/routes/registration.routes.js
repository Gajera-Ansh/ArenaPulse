// Registration routes - register, list, approve/reject, withdraw

import { Router } from 'express';
import { registerForTournament, getRegistrationsByTournament, updateRegistrationStatus, withdrawRegistration, getPendingEnrollments, getMyActiveEnrollments, acceptEnrollment, declineEnrollment, getUserEnrollments } from '../controllers/registration.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = Router();

router.post('/', authMiddleware, registerForTournament);
router.get('/pending-enrollments', authMiddleware, getPendingEnrollments);
router.get('/my-active-enrollments', authMiddleware, getMyActiveEnrollments);
router.get('/user/:userId', getUserEnrollments);
router.get('/tournament/:tournamentId', authMiddleware, getRegistrationsByTournament);
router.patch('/:id/status', authMiddleware, roleMiddleware('organizer', 'admin'), updateRegistrationStatus);
router.post('/:id/accept', authMiddleware, acceptEnrollment);
router.post('/:id/decline', authMiddleware, declineEnrollment);
router.delete('/:id', authMiddleware, withdrawRegistration);

export default router;
