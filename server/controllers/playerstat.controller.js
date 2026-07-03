// PlayerStat controller - submit and retrieve cumulative player stats

import PlayerStat from '../models/PlayerStat.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';

// Game-specific stat fields configuration
const GAME_STATS_FIELDS = {
  'Valorant': ['kills', 'deaths', 'assists', 'headshots'],
  'Counter-Strike 2': ['kills', 'deaths', 'assists', 'headshots'],
  'BGMI': ['kills', 'deaths', 'damage'],
  'Free Fire': ['kills', 'deaths', 'damage'],
  'Dota 2': ['kills', 'deaths', 'assists'],
  'League of Legends': ['kills', 'deaths', 'assists'],
};

// GET /api/playerstats/fields/:game
// Returns the stat field names for a specific game
export const getGameFields = (req, res) => {
  const { game } = req.params;
  const fields = GAME_STATS_FIELDS[game] || ['kills', 'deaths'];
  res.status(200).json({ success: true, data: fields });
};

// POST /api/playerstats/submit
// Organizer submits stats for multiple players after a match
export const submitPlayerStats = async (req, res, next) => {
  try {
    const { matchId, game, players } = req.body;

    if (!matchId || !game || !players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ success: false, message: 'Match ID, Game, and players array are required.' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const isEdit = match.statsSubmitted;
    const oldPlayerStats = match.playerStats || new Map();
    const validFields = GAME_STATS_FIELDS[game] || ['kills', 'deaths'];

    const bulkOps = players.map(({ userId, stats }) => {
      const oldStats = oldPlayerStats.get(userId) || {};
      const incUpdate = {};

      if (!isEdit) {
        incUpdate[`gameStats.${game}.matches`] = 1;
      }

      for (const field of validFields) {
        const newVal = Number(stats[field]) || 0;
        const oldVal = Number(oldStats[field]) || 0;
        const delta = newVal - oldVal;

        if (delta !== 0) {
          incUpdate[`gameStats.${game}.${field}`] = delta;
        }
      }

      if (Object.keys(incUpdate).length === 0) return null;

      return {
        updateOne: {
          filter: { user: userId },
          update: { $inc: incUpdate },
          upsert: true,
        },
      };
    }).filter(Boolean);

    if (bulkOps.length > 0) {
      await PlayerStat.bulkWrite(bulkOps);
    }

    // Save new stats back to match document
    const newPlayerStats = new Map();
    players.forEach(({ userId, stats }) => {
      const statsObj = {};
      validFields.forEach(f => {
        if (stats[f] !== undefined && stats[f] !== null && stats[f] !== '') {
          statsObj[f] = Number(stats[f]);
        }
      });
      newPlayerStats.set(userId, statsObj);
    });

    match.playerStats = newPlayerStats;
    match.statsSubmitted = true;
    await match.save();

    res.status(200).json({ success: true, message: 'Player stats updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/playerstats/leaderboard?game=Valorant
// Returns ranked player stats for a specific game
export const getPlayerStatsLeaderboard = async (req, res, next) => {
  try {
    const { game } = req.query;

    if (!game) {
      return res.status(400).json({ success: false, message: 'Game query parameter is required.' });
    }

    // Find all PlayerStat documents that have stats for this game
    const stats = await PlayerStat.find({
      [`gameStats.${game}`]: { $exists: true },
      [`gameStats.${game}.matches`]: { $gt: 0 },
    })
      .populate('user', 'name avatar')
      .lean();

    // Find all teams to build a player->team map
    const teams = await Team.find(game ? { game } : {}).select('name tag game captain players').lean();
    const playerTeamMap = {};
    for (const team of teams) {
      const teamId = String(team._id);
      const tInfo = { _id: teamId, name: team.name, tag: team.tag, game: team.game };
      
      const capId = String(team.captain);
      if (!playerTeamMap[capId]) playerTeamMap[capId] = tInfo;
      
      for (const p of team.players) {
        const pId = String(p);
        if (!playerTeamMap[pId]) playerTeamMap[pId] = tInfo;
      }
    }

    // Build result with computed fields (K/D ratio, averages)
    const result = stats.map(doc => {
      const gs = doc.gameStats.get ? doc.gameStats.get(game) : doc.gameStats[game];
      if (!gs) return null;

      const kills = gs.kills || 0;
      const deaths = gs.deaths || 0;
      const assists = gs.assists || 0;
      const headshots = gs.headshots || 0;
      const damage = gs.damage || 0;
      const matchCount = gs.matches || 1;
      
      const playerId = String(doc.user._id);

      return {
        player: doc.user,
        team: playerTeamMap[playerId] || null,
        game,
        kills,
        deaths,
        assists,
        headshots,
        damage,
        matches: matchCount,
        kdRatio: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2),
        avgKills: (kills / matchCount).toFixed(1),
      };
    }).filter(Boolean);

    // Sort by K/D ratio descending, then total kills
    result.sort((a, b) => {
      if (parseFloat(b.kdRatio) !== parseFloat(a.kdRatio)) return parseFloat(b.kdRatio) - parseFloat(a.kdRatio);
      return b.kills - a.kills;
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/playerstats/match-players/:teamAId/:teamBId
// Returns all players from both teams for the organizer to fill stats
export const getMatchPlayers = async (req, res, next) => {
  try {
    const { teamAId, teamBId } = req.params;

    const [teamA, teamB] = await Promise.all([
      Team.findById(teamAId).populate('captain', 'name avatar').populate('players', 'name avatar'),
      Team.findById(teamBId).populate('captain', 'name avatar').populate('players', 'name avatar'),
    ]);

    if (!teamA || !teamB) {
      return res.status(404).json({ success: false, message: 'One or both teams not found.' });
    }

    // Combine captain + players for each team, removing duplicates
    const getTeamMembers = (team) => {
      const members = [];
      const seenIds = new Set();

      if (team.captain) {
        members.push({ _id: team.captain._id, name: team.captain.name, avatar: team.captain.avatar });
        seenIds.add(String(team.captain._id));
      }

      for (const p of team.players) {
        if (!seenIds.has(String(p._id))) {
          members.push({ _id: p._id, name: p.name, avatar: p.avatar });
          seenIds.add(String(p._id));
        }
      }

      return members;
    };

    res.status(200).json({
      success: true,
      data: {
        teamA: { name: teamA.name, tag: teamA.tag, logo: teamA.logo, players: getTeamMembers(teamA) },
        teamB: { name: teamB.name, tag: teamB.tag, logo: teamB.logo, players: getTeamMembers(teamB) },
      },
    });
  } catch (error) {
    next(error);
  }
};
