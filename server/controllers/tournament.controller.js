// Tournament controller - handles tournament CRUD and status transitions

import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import { sendNewTournamentEmail, sendTournamentUpdateEmail } from '../utils/emailService.js';
import { generateRoundRobin } from '../utils/bracketGenerator.js';

// POST /api/tournaments
export const createTournament = async (req, res, next) => {
  try {
    const { title, game, bracketType, maxTeams, playersPerTeam, startDate, endDate, registrationDeadline, prizePool, rules, status } = req.body;

    const tournament = await Tournament.create({
      title,
      game,
      bracketType,
      maxTeams,
      playersPerTeam,
      startDate,
      endDate,
      registrationDeadline,
      prizePool,
      rules,
      status: status || 'open',
      organizer: req.user._id,
    });

    // Fetch all players to send the new tournament announcement
    const players = await User.find({ role: 'player' }).select('email');
    const playerEmails = players.map(player => player.email);

    if (playerEmails.length > 0) {
      sendNewTournamentEmail(
        playerEmails,
        title,
        game,
        prizePool,
        req.user.name // organizer's name from auth middleware
      );
    }

    res.status(201).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

// GET /api/tournaments
export const getAllTournaments = async (req, res, next) => {
  try {
    const { game, status, organizer } = req.query;
    const filter = {};

    if (game) filter.game = { $regex: game, $options: 'i' };
    if (status) filter.status = status;
    if (organizer) filter.organizer = organizer;

    const tournaments = await Tournament.find(filter)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tournaments });
  } catch (error) {
    next(error);
  }
};

// GET /api/tournaments/:id
export const getTournamentById = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name email avatar')
      .populate('winner', 'name tag logo');

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tournaments/:id
export const updateTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const updated = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Notify approved teams about the update
    const registrations = await Registration.find({ tournament: req.params.id, status: 'approved' })
      .populate({
        path: 'team',
        populate: { path: 'players', select: 'email' }
      });
    
    const playerEmails = [];
    const notifs = [];
    registrations.forEach(reg => {
      if (reg.team && reg.team.players) {
        reg.team.players.forEach(p => {
          if (p.email && !playerEmails.includes(p.email)) playerEmails.push(p.email);
          notifs.push({
            user: p._id,
            message: `Tournament "${updated.title}" has been updated. Please check the tournament page for the latest details.`,
            type: 'info'
          });
        });
      }
    });

    if (playerEmails.length > 0) {
      sendTournamentUpdateEmail(playerEmails, updated.title, 'updated', req.user.name);
    }
    
    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tournaments/:id/status
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    tournament.status = status;
    await tournament.save();

    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tournaments/:id
export const deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Notify approved teams about the cancellation before deleting
    const registrations = await Registration.find({ tournament: req.params.id, status: 'approved' })
      .populate({
        path: 'team',
        populate: { path: 'players', select: 'email' }
      });
    
    const playerEmails = [];
    const notifs = [];
    registrations.forEach(reg => {
      if (reg.team && reg.team.players) {
        reg.team.players.forEach(p => {
          if (p.email && !playerEmails.includes(p.email)) playerEmails.push(p.email);
          notifs.push({
            user: p._id,
            message: `Tournament "${tournament.title}" has been canceled by the organizer.`,
            type: 'warning'
          });
        });
      }
    });

    if (playerEmails.length > 0) {
      sendTournamentUpdateEmail(playerEmails, tournament.title, 'deleted', req.user.name);
    }
    
    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    await Tournament.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Tournament deleted.' });
  } catch (error) {
    next(error);
  }
};
// POST /api/tournaments/:id/start
export const startTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (tournament.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Tournament is already started or closed.' });
    }

    // Fetch all approved teams
    const registrations = await Registration.find({ tournament: tournament._id, status: 'approved' }).populate('team');
    
    if (registrations.length < 2) {
      return res.status(400).json({ success: false, message: 'Not enough approved teams to start a bracket (minimum 2).' });
    }

    // Bracket generation
    const teams = [...registrations];
    // Shuffle teams
    teams.sort(() => Math.random() - 0.5);

    // Calculate nearest power of 2 for single elim bracket
    const N = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    
    let matchesToInsert = [];

    if (tournament.bracketType === 'round-robin') {
      matchesToInsert = generateRoundRobin(teams, tournament._id);
    } else {
      // Single elimination logic
      let byes = N - teams.length;
      let teamIndex = 0;
      let matchNumber = 1;

    const totalRounds = Math.log2(N);
    let currentRoundMatches = N / 2;
    let startMatchOfRound = 1;

    for (let r = 1; r <= totalRounds; r++) {
      for (let i = 0; i < currentRoundMatches; i++) {
        const isRound1 = r === 1;
        let teamA = null;
        let teamB = null;

        if (isRound1) {
          if (byes > 0) {
            teamA = teams[teamIndex++];
            teamB = null; // Bye
            byes--;
          } else {
            teamA = teams[teamIndex++];
            teamB = teams[teamIndex++];
          }
        }

        let nextMatchNumber = null;
        if (r < totalRounds) {
          const startMatchOfNextRound = startMatchOfRound + currentRoundMatches;
          nextMatchNumber = startMatchOfNextRound + Math.floor(i / 2);
        }

        let status = 'upcoming';
        let winner = null;

        if (isRound1 && (teamA === null || teamB === null)) {
          status = 'completed';
          winner = teamA || teamB;
        }

        matchesToInsert.push({
          tournament: tournament._id,
          teamA: teamA ? teamA.team._id : null,
          teamB: teamB ? teamB.team._id : null,
          round: r,
          matchNumber,
          nextMatchNumber,
          status,
          winner: winner ? winner.team._id : null,
        });
        matchNumber++;
      }
      startMatchOfRound += currentRoundMatches;
      currentRoundMatches /= 2;
    }

      // Second pass: advance Byes to the next round automatically
      for (const match of matchesToInsert) {
        if (match.winner && match.nextMatchNumber) {
          const nextMatch = matchesToInsert.find(m => m.matchNumber === match.nextMatchNumber);
          if (nextMatch) {
            if (!nextMatch.teamA) nextMatch.teamA = match.winner;
            else nextMatch.teamB = match.winner;
          }
        }
      }
    }

    // Save matches to DB
    await Match.insertMany(matchesToInsert);

    // Update tournament status
    tournament.status = 'live';
    await tournament.save();

    res.status(200).json({ success: true, message: 'Tournament started and bracket generated!' });
  } catch (error) {
    next(error);
  }
};

// GET /api/tournaments/pending/ratings
export const getPendingRatings = async (req, res, next) => {
  try {
    // Find all approved registrations for the user
    const registrations = await Registration.find({
      status: 'approved',
      lockedRoster: req.user._id
    }).populate('tournament');
    
    // Filter tournaments that are completed and user hasn't rated yet
    const pendingTournaments = registrations
      .map(r => r.tournament)
      .filter(t => t && t.status === 'completed' && !t.ratings?.some(r => r.player.toString() === req.user._id.toString()));
      
    // Deduplicate
    const uniquePending = Array.from(new Set(pendingTournaments.map(t => t._id.toString())))
      .map(id => pendingTournaments.find(t => t._id.toString() === id));

    res.status(200).json({ success: true, data: uniquePending });
  } catch (error) {
    next(error);
  }
};

// POST /api/tournaments/:id/rate
export const rateTournament = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const tournamentId = req.params.id;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    
    // Check if user already rated
    if (tournament.ratings?.some(r => r.player.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: 'You have already rated this tournament' });
    }
    
    tournament.ratings = tournament.ratings || [];
    tournament.ratings.push({ player: req.user._id, rating: Number(rating) });
    await tournament.save();
    
    res.status(200).json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/tournaments/:id/standings
export const getTournamentStandings = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    // Deep populate to get player names and avatars
    const matches = await Match.find({ tournament: req.params.id, status: 'completed' })
      .populate({
        path: 'teamA',
        select: 'name players captain',
        populate: [
          { path: 'players', select: 'name avatar' },
          { path: 'captain', select: 'name avatar' }
        ]
      })
      .populate({
        path: 'teamB',
        select: 'name players captain',
        populate: [
          { path: 'players', select: 'name avatar' },
          { path: 'captain', select: 'name avatar' }
        ]
      });

    const playerAgg = {};

    matches.forEach(m => {
      if (!m.playerStats || m.playerStats.size === 0) return;
      
      const teamA_players = [...(m.teamA?.players || [])];
      if (m.teamA?.captain) teamA_players.push(m.teamA.captain);
      const teamB_players = [...(m.teamB?.players || [])];
      if (m.teamB?.captain) teamB_players.push(m.teamB.captain);

      for (const [pId, stats] of m.playerStats.entries()) {
        if (!playerAgg[pId]) {
          let playerObj = teamA_players.find(p => p && String(p._id) === pId);
          let teamName = m.teamA?.name;
          if (!playerObj) {
            playerObj = teamB_players.find(p => p && String(p._id) === pId);
            teamName = m.teamB?.name;
          }
          
          if (!playerObj) continue;
          
          playerAgg[pId] = {
            _id: playerObj._id,
            name: playerObj.name,
            avatar: playerObj.avatar,
            team: teamName,
            matchesPlayed: 0,
            stats: {}
          };
        }
        
        playerAgg[pId].matchesPlayed += 1;
        
        // Sum up stats
        Object.entries(stats).forEach(([key, val]) => {
          if (typeof val === 'number') {
            playerAgg[pId].stats[key] = (playerAgg[pId].stats[key] || 0) + val;
          }
        });
      }
    });

    const standings = Object.values(playerAgg);
    
    // Sort primarily by kills if available
    standings.sort((a, b) => (b.stats.kills || 0) - (a.stats.kills || 0));
    
    // Assign ranks
    standings.forEach((p, idx) => p.rank = idx + 1);

    res.status(200).json({ success: true, data: standings });
  } catch (error) {
    next(error);
  }
};

// GET /api/tournaments/:id/participants
export const getTournamentParticipants = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ 
      tournament: req.params.id,
      status: 'approved'
    }).populate('team', 'name tag logo players captain');
    
    // Extract unique teams
    const teams = registrations.map(reg => reg.team).filter(Boolean);
    
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};
