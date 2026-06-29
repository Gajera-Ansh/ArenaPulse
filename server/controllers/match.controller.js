// Match controller - handles score updates and result reporting

import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import Team from '../models/Team.js';

// GET /api/matches/tournament/:tournamentId
export const getMatchesByTournament = async (req, res, next) => {
  try {
    const matches = await Match.find({ tournament: req.params.tournamentId })
      .populate('teamA', 'name tag logo')
      .populate('teamB', 'name tag logo')
      .populate('winner', 'name tag')
      .sort({ round: 1, matchNumber: 1 });

    res.status(200).json({ success: true, data: matches });
  } catch (error) {
    next(error);
  }
};

// GET /api/matches/:id
export const getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA', 'name tag logo players')
      .populate('teamB', 'name tag logo players')
      .populate('tournament', 'title game');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    res.status(200).json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/matches/:id/score
export const updateScore = async (req, res, next) => {
  try {
    const { scoreA, scoreB } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.status = 'live';
    await match.save();

    // Socket.IO emit will be added here later
    res.status(200).json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

// POST /api/matches/:id/result
export const submitResult = async (req, res, next) => {
  try {
    const { scoreA, scoreB } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.status = 'completed';

    // Determine winner
    if (scoreA > scoreB) {
      match.winner = match.teamA;
    } else if (scoreB > scoreA) {
      match.winner = match.teamB;
    }

    await match.save();

    // Auto-advance winner to next match
    if (match.nextMatchNumber) {
      const nextMatch = await Match.findOne({
        tournament: match.tournament,
        matchNumber: match.nextMatchNumber,
      });

      if (nextMatch) {
        if (!nextMatch.teamA) {
          nextMatch.teamA = match.winner;
        } else {
          nextMatch.teamB = match.winner;
        }
        await nextMatch.save();
      }
    } else {
      // This is the final match. Mark the tournament as completed.
      const Tournament = (await import('../models/Tournament.js')).default;
      await Tournament.findByIdAndUpdate(match.tournament, {
        status: 'completed',
        winner: match.winner
      });
      
      // Notify about tournament completion
      if (match.winner) {
        const winningTeam = await Team.findById(match.winner).select('players name');
        if (winningTeam && winningTeam.players) {
          const notifs = winningTeam.players.map(p => ({
            user: p,
            message: `Congratulations! Your team "${winningTeam.name}" won the tournament!`,
            type: 'success'
          }));
          await Notification.insertMany(notifs);
        }
      }
    }

    // Notify all players in Team A and Team B about the match result
    if (match.teamA && match.teamB) {
      const [teamA, teamB] = await Promise.all([
        Team.findById(match.teamA).select('players name'),
        Team.findById(match.teamB).select('players name')
      ]);

      const notifs = [];
      const createMatchNotifs = (team, isWinner, otherTeamName) => {
        if (!team || !team.players) return;
        const msg = isWinner 
          ? `Victory! Your team "${team.name}" defeated "${otherTeamName}".`
          : `Defeat. Your team "${team.name}" lost to "${otherTeamName}".`;
        const type = isWinner ? 'success' : 'info';
        
        team.players.forEach(p => {
          notifs.push({ user: p, message: msg, type: 'match' });
        });
      };

      if (teamA && teamB) {
        createMatchNotifs(teamA, String(match.winner) === String(teamA._id), teamB.name);
        createMatchNotifs(teamB, String(match.winner) === String(teamB._id), teamA.name);
        if (notifs.length > 0) {
          await Notification.insertMany(notifs);
        }
      }
    }

    res.status(200).json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};
