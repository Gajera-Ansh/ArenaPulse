// Team routes - CRUD, invite, join, remove member

import { Router } from 'express';
import { createTeam, getMyTeams, getTeamById, updateTeam, deleteTeam, invitePlayer, joinTeam, removeMember } from '../controllers/team.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, createTeam);
router.get('/', authMiddleware, getMyTeams);
router.get('/:id', getTeamById);
router.put('/:id', authMiddleware, updateTeam);
router.delete('/:id', authMiddleware, deleteTeam);
router.post('/:id/invite', authMiddleware, invitePlayer);
router.post('/:id/join', authMiddleware, joinTeam);
router.delete('/:id/members/:playerId', authMiddleware, removeMember);

export default router;
