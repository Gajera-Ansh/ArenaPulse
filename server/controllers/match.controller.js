// Match controller - handles score updates and result reporting

import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import { sendRatingRequestEmail } from '../utils/emailService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const handleTournamentCompletion = async (tournamentId, winnerTeamId, io) => {
  const tournament = await Tournament.findByIdAndUpdate(tournamentId, {
    status: 'completed',
    winner: winnerTeamId
  }, { new: true }).populate('organizer');

  if (io) {
    const populatedWinner = await Team.findById(winnerTeamId).select('name tag');
    io.emit('tournament_completed', { tournamentId, winner: populatedWinner });
  }

  if (winnerTeamId) {
    const winningTeam = await Team.findById(winnerTeamId).select('players name');
    if (winningTeam && winningTeam.players) {
      const notifs = winningTeam.players.map(p => ({
        user: p,
        message: `Congratulations! Your team "${winningTeam.name}" won the tournament!`,
        type: 'success'
      }));
      await Notification.insertMany(notifs);
    }
  }

  // Send rating emails to all participants
  try {
    const registrations = await Registration.find({ tournament: tournamentId, status: 'approved' });
    const allPlayerIds = [];
    registrations.forEach(reg => {
      if (reg.lockedRoster) {
        reg.lockedRoster.forEach(playerId => {
          allPlayerIds.push(playerId);
        });
      }
    });

    const uniquePlayerIds = [...new Set(allPlayerIds.map(id => id.toString()))];
    const players = await User.find({ _id: { $in: uniquePlayerIds } });
    const organizerName = tournament.organizer ? tournament.organizer.name : 'the organizer';

    for (const player of players) {
      sendRatingRequestEmail(player.email, player.name, tournament.title, organizerName);
    }
  } catch (error) {
    console.error('Error sending rating emails:', error);
  }
};

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
    
    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      { scoreA, scoreB, status: 'live' },
      { new: true }
    )
      .populate('teamA', 'name tag logo')
      .populate('teamB', 'name tag logo');

    if (!updatedMatch) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    // Socket.IO emit
    const io = req.app.get('io');
    if (io) {
      io.emit('score_updated', updatedMatch);
    }
    
    res.status(200).json({ success: true, data: updatedMatch });
  } catch (error) {
    next(error);
  }
};

// POST /api/matches/:id/result
export const submitResult = async (req, res, next) => {
  try {
    const { scoreA, scoreB } = req.body;
    const match = await Match.findById(req.params.id)
      .populate('teamA', 'name tag logo')
      .populate('teamB', 'name tag logo');

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

    // Handle tournament progression
    const tournamentObj = await Tournament.findById(match.tournament);

    if (tournamentObj.bracketType === 'round-robin') {
      // Check if all matches are completed
      const allMatches = await Match.find({ tournament: match.tournament });
      const allCompleted = allMatches.every(m => m.status === 'completed');
      
      if (allCompleted) {
        // Calculate points (1 win = 1 point)
        const points = {};
        allMatches.forEach(m => {
          if (m.winner) {
            points[m.winner] = (points[m.winner] || 0) + 1;
          }
        });
        
        let maxPoints = -1;
        for (const teamId in points) {
          if (points[teamId] > maxPoints) {
            maxPoints = points[teamId];
          }
        }
        
        const tiedTeams = Object.keys(points).filter(teamId => points[teamId] === maxPoints);
        let tournamentWinner = null;

        if (tiedTeams.length === 1) {
          // Clear winner
          tournamentWinner = tiedTeams[0];
        } else if (tiedTeams.length === 2) {
          // 2-way tie: Head-to-head tiebreaker
          const headToHeadMatch = allMatches.find(m => 
            (String(m.teamA) === tiedTeams[0] && String(m.teamB) === tiedTeams[1]) ||
            (String(m.teamA) === tiedTeams[1] && String(m.teamB) === tiedTeams[0])
          );
          if (headToHeadMatch && headToHeadMatch.winner) {
            tournamentWinner = String(headToHeadMatch.winner);
          } else {
            tournamentWinner = tiedTeams[0]; // fallback
          }
        } else if (tiedTeams.length > 2) {
          // 3-way or more tie: Score Differential tiebreaker
          let bestDiff = -Infinity;
          for (const teamId of tiedTeams) {
            let diff = 0;
            allMatches.forEach(m => {
              if (String(m.teamA) === teamId) {
                diff += (m.scoreA || 0) - (m.scoreB || 0);
              } else if (String(m.teamB) === teamId) {
                diff += (m.scoreB || 0) - (m.scoreA || 0);
              }
            });
            if (diff > bestDiff) {
              bestDiff = diff;
              tournamentWinner = teamId;
            }
          }
        }
        
        const io = req.app.get('io');
        await handleTournamentCompletion(match.tournament, tournamentWinner, io);
      }
    } else {
      // Single elimination logic
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
        const io = req.app.get('io');
        await handleTournamentCompletion(match.tournament, match.winner, io);
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

    const io = req.app.get('io');
    if (io) {
      io.emit('match_completed', match);
    }

    res.status(200).json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

export const getMatchPrediction = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate('tournament', 'game');
    if (!match || !match.teamA || !match.teamB) {
      return res.status(404).json({ success: false, message: 'Match or teams not found.' });
    }

    const djangoUrl = process.env.VITE_DJANGO_URL || 'http://localhost:8000';
    const response = await fetch(`${djangoUrl}/analytics/predict/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        teamA: match.teamA, 
        teamB: match.teamB, 
        game: match.tournament?.game,
        scoreA: match.scoreA,
        scoreB: match.scoreB
      })
    });

    const data = await response.json();
    if (!data.success) {
      return res.status(400).json({ success: false, message: data.message });
    }

    res.status(200).json({ success: true, data: data.data });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prediction.' });
  }
};

export const generateMatchSummary = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA', 'name players')
      .populate('teamB', 'name players')
      .populate('tournament', 'game organizer');
      
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    if (String(match.tournament.organizer) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (match.status !== 'completed' || match.nextMatchNumber !== null) {
      return res.status(400).json({ success: false, message: 'Can only summarize completed Grand Finals.' });
    }
    
    if (match.summary) {
      return res.status(200).json({ success: true, data: match });
    }

    // Determine MVP
    let mvpText = "No player stats available.";
    if (match.playerStats && match.playerStats.size > 0) {
      let bestPlayer = null;
      let highestKills = -1;
      
      for (const [playerId, stats] of match.playerStats.entries()) {
        const kills = Number(stats.kills) || 0;
        if (kills > highestKills) {
          highestKills = kills;
          let pName = stats.name;
          if (!pName && playerId) {
            try {
              const user = await User.findById(playerId).select('username');
              pName = user ? user.username : 'An unknown player';
            } catch (e) {
              pName = 'An unknown player';
            }
          }
          bestPlayer = pName || 'An unknown player';
        }
      }
      if (bestPlayer && highestKills > 0) {
        mvpText = `The MVP was ${bestPlayer} with an impressive ${highestKills} kills.`;
      }
    }

    const winnerName = String(match.winner) === String(match.teamA._id) ? match.teamA.name : match.teamB.name;
    const loserName = String(match.winner) === String(match.teamA._id) ? match.teamB.name : match.teamA.name;
    const winScore = String(match.winner) === String(match.teamA._id) ? match.scoreA : match.scoreB;
    const loseScore = String(match.winner) === String(match.teamA._id) ? match.scoreB : match.scoreA;

    const prompt = `
      Act as an energetic esports caster. Write a thrilling 3-sentence summary of this Grand Final match for the game "${match.tournament.game}".
      Team "${winnerName}" defeated "${loserName}" with a final score of ${winScore} to ${loseScore}.
      ${mvpText}
      Make it sound hype, prestigious, and highlight the winning team's ultimate victory. Do not use hashtags.
    `;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ success: false, message: 'Gemini API key is not configured in the server environment variables.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    match.summary = responseText.trim();
    await match.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('score_updated', match);
    }

    res.status(200).json({ success: true, data: match });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ success: false, message: 'Failed to generate match summary.' });
  }
};
