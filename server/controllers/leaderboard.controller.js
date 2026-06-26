// Leaderboard controller - aggregates player and team rankings

import Match from '../models/Match.js';
import Team from '../models/Team.js';

// GET /api/leaderboard/teams
export const getTeamLeaderboard = async (req, res, next) => {
  try {
    const teamWins = await Match.aggregate([
      { $match: { status: 'completed', winner: { $ne: null } } },
      { $group: { _id: '$winner', wins: { $sum: 1 } } },
      { $sort: { wins: -1 } },
      { $limit: 20 },
    ]);

    const leaderboard = await Team.populate(teamWins, {
      path: '_id',
      select: 'name tag game logo',
    });

    const result = leaderboard.map((entry) => ({
      team: entry._id,
      wins: entry.wins,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/leaderboard/tournaments/:tournamentId
export const getTournamentStandings = async (req, res, next) => {
  try {
    const standings = await Match.aggregate([
      { $match: { tournament: req.params.tournamentId, status: 'completed', winner: { $ne: null } } },
      { $group: { _id: '$winner', wins: { $sum: 1 } } },
      { $sort: { wins: -1 } },
    ]);

    const result = await Team.populate(standings, { path: '_id', select: 'name tag logo' });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
