// Team routes - CRUD, invite, join, remove member

import { Router } from 'express';
import { createTeam, getMyTeams, getUserTeams, getAllTeams, getTeamById, updateTeam, deleteTeam, invitePlayer, joinTeam, removeMember, getInvitations, acceptInvite, declineInvite } from '../controllers/team.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

router.post('/', authMiddleware, upload.single('logo'), createTeam);
router.get('/', authMiddleware, getMyTeams);
router.get('/invitations', authMiddleware, getInvitations);
router.get('/all', getAllTeams);
router.get('/user/:userId', getUserTeams);
router.get('/:id', getTeamById);
router.put('/:id', authMiddleware, upload.single('logo'), updateTeam);
router.delete('/:id', authMiddleware, deleteTeam);
router.post('/:id/invite', authMiddleware, invitePlayer);
router.post('/:id/join', authMiddleware, joinTeam);
router.post('/:id/accept', authMiddleware, acceptInvite);
router.post('/:id/decline', authMiddleware, declineInvite);
router.delete('/:id/members/:playerId', authMiddleware, removeMember);

export default router;
