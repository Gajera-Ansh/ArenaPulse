// Leaderboard controller - aggregates team and player rankings

import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import User from '../models/User.js';

// GET /api/leaderboard/teams?game=Valorant
export const getTeamLeaderboard = async (req, res, next) => {
  try {
    const { game } = req.query;

    // Step 1: If game filter is present, find matching team IDs first
    let teamFilter = {};
    if (game) {
      const filteredTeams = await Team.find({ game }).select('_id');
      const teamIds = filteredTeams.map(t => t._id);
      teamFilter = { $in: teamIds };
    }

    // Step 2: Aggregate wins from completed matches
    const winPipeline = [
      { $match: { status: 'completed', winner: { $ne: null }, ...(game ? { winner: teamFilter } : {}) } },
      { $group: { _id: '$winner', wins: { $sum: 1 } } },
    ];
    const winResults = await Match.aggregate(winPipeline);

    // Step 3: Aggregate total matches played (as teamA or teamB)
    const matchFilterBase = { status: 'completed' };
    
    // Get all teams that have participated
    const teamAMatches = await Match.aggregate([
      { $match: { ...matchFilterBase, teamA: { $ne: null } } },
      { $group: { _id: '$teamA', played: { $sum: 1 } } },
    ]);
    
    const teamBMatches = await Match.aggregate([
      { $match: { ...matchFilterBase, teamB: { $ne: null } } },
      { $group: { _id: '$teamB', played: { $sum: 1 } } },
    ]);

    // Step 4: Aggregate tournaments won
    const tourneyWinFilter = game ? { winner: { $ne: null }, game } : { winner: { $ne: null } };
    const tourneyWins = await Tournament.aggregate([
      { $match: tourneyWinFilter },
      { $group: { _id: '$winner', tournamentsWon: { $sum: 1 } } },
    ]);

    // Step 5: Merge all data
    const statsMap = {};

    // Add matches played
    for (const entry of teamAMatches) {
      const id = String(entry._id);
      if (!statsMap[id]) statsMap[id] = { wins: 0, played: 0, tournamentsWon: 0 };
      statsMap[id].played += entry.played;
    }
    for (const entry of teamBMatches) {
      const id = String(entry._id);
      if (!statsMap[id]) statsMap[id] = { wins: 0, played: 0, tournamentsWon: 0 };
      statsMap[id].played += entry.played;
    }

    // Add wins
    for (const entry of winResults) {
      const id = String(entry._id);
      if (!statsMap[id]) statsMap[id] = { wins: 0, played: 0, tournamentsWon: 0 };
      statsMap[id].wins = entry.wins;
    }

    // Add tournaments won
    for (const entry of tourneyWins) {
      const id = String(entry._id);
      if (!statsMap[id]) statsMap[id] = { wins: 0, played: 0, tournamentsWon: 0 };
      statsMap[id].tournamentsWon = entry.tournamentsWon;
    }

    // Step 6: Build result array
    const teamIds = Object.keys(statsMap).map(id => new mongoose.Types.ObjectId(id));
    let teamsQuery = Team.find({ _id: { $in: teamIds } }).select('name tag game logo');
    if (game) {
      teamsQuery = teamsQuery.where('game').equals(game);
    }
    const teams = await teamsQuery;

    const result = teams.map(team => {
      const id = String(team._id);
      const stats = statsMap[id] || { wins: 0, played: 0, tournamentsWon: 0 };
      const losses = stats.played - stats.wins;
      const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

      return {
        team: { _id: team._id, name: team.name, tag: team.tag, game: team.game, logo: team.logo },
        wins: stats.wins,
        losses,
        played: stats.played,
        winRate,
        tournamentsWon: stats.tournamentsWon,
      };
    });

    // Sort: tournaments won first, then win rate, then total wins
    result.sort((a, b) => {
      if (b.tournamentsWon !== a.tournamentsWon) return b.tournamentsWon - a.tournamentsWon;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.wins - a.wins;
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};


// GET /api/leaderboard/tournaments/:tournamentId
export const getTournamentStandings = async (req, res, next) => {
  try {
    const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);
    const standings = await Match.aggregate([
      { $match: { tournament: tournamentId, status: 'completed', winner: { $ne: null } } },
      { $group: { _id: '$winner', wins: { $sum: 1 } } },
      { $sort: { wins: -1 } },
    ]);

    const result = await Team.populate(standings, { path: '_id', select: 'name tag logo' });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
