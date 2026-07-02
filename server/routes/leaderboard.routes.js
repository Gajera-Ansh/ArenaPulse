// Leaderboard routes - team and player rankings

import { Router } from 'express';
import { getTeamLeaderboard, getTournamentStandings } from '../controllers/leaderboard.controller.js';

const router = Router();

router.get('/teams', getTeamLeaderboard);
router.get('/tournaments/:tournamentId', getTournamentStandings);

export default router;
