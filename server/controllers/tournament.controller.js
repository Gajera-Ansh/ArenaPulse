// Tournament controller - handles tournament CRUD and status transitions

import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import { sendNewTournamentEmail, sendTournamentUpdateEmail } from '../utils/emailService.js';

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

    // Calculate nearest power of 2 for bracket
    const N = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    
    // Pad with nulls for Byes
    while (teams.length < N) teams.push(null);

    const matchesToInsert = [];
    let matchNumber = 1;

    const totalRounds = Math.log2(N);
    let currentRoundMatches = N / 2;
    let startMatchOfRound = 1;

    for (let r = 1; r <= totalRounds; r++) {
      for (let i = 0; i < currentRoundMatches; i++) {
        const isRound1 = r === 1;
        const teamA = isRound1 ? teams[i * 2] : null;
        const teamB = isRound1 ? teams[i * 2 + 1] : null;

        let nextMatchNumber = null;
        if (r < totalRounds) {
          const startMatchOfNextRound = startMatchOfRound + currentRoundMatches;
          nextMatchNumber = startMatchOfNextRound + Math.floor(i / 2);
        }

        let status = 'upcoming';
        let winner = null;

        // If it's round 1 and one team is null (a Bye)
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
