// Team controller - handles team CRUD, invitations, and member management

import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import { sendTeamInvitationEmail, sendTeamCompleteEmail, sendTeamRemovalEmail } from '../utils/emailService.js';

// POST /api/teams
export const createTeam = async (req, res, next) => {
  try {
    const { name, tag, game, players } = req.body;

    let parsedPlayers = [];
    if (players) {
      parsedPlayers = typeof players === 'string' ? JSON.parse(players) : players;
    }

    const pendingPlayers = parsedPlayers.filter(p => p !== req.user._id.toString());
    const logo = req.file ? req.file.path : `https://ui-avatars.com/api/?name=${encodeURIComponent(tag || name)}&background=random&color=fff&size=200&bold=true`;

    const team = await Team.create({
      name,
      tag,
      game,
      logo,
      captain: req.user._id,
      players: [req.user._id.toString()],
      pendingPlayers,
    });

    if (pendingPlayers.length > 0) {
      const usersToEmail = await User.find({ _id: { $in: pendingPlayers } });
      for (const u of usersToEmail) {
        sendTeamInvitationEmail(u.email, u.name, req.user.name, team.name, team.tag);
      }
    }

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams
export const getMyTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ $or: [{ players: req.user._id }, { formerPlayers: req.user._id }] })
      .populate('captain', 'name email avatar banned')
      .populate('players', 'name email avatar banned');

    // Fetch tournament count for each team
    const teamsWithCounts = await Promise.all(teams.map(async (team) => {
      const tournamentCount = await Registration.countDocuments({ 
        team: team._id,
        status: { $in: ['pending', 'approved'] }
      });
      const isFormerMember = team.formerPlayers.some(p => p.toString() === req.user._id.toString()) && 
                             !team.players.some(p => (p._id ? p._id.toString() : p.toString()) === req.user._id.toString());
      return { ...team.toObject(), tournamentCount, isFormerMember };
    }));

    res.status(200).json({ success: true, data: teamsWithCounts });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/user/:userId
export const getUserTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ $or: [{ players: req.params.userId }, { formerPlayers: req.params.userId }] })
      .populate('captain', 'name email avatar banned')
      .populate('players', 'name email avatar banned');

    const teamsWithCounts = await Promise.all(teams.map(async (team) => {
      const tournamentCount = await Registration.countDocuments({ 
        team: team._id,
        status: { $in: ['pending', 'approved'] }
      });
      const isFormerMember = team.formerPlayers.some(p => p.toString() === req.params.userId.toString()) && 
                             !team.players.some(p => (p._id ? p._id.toString() : p.toString()) === req.params.userId.toString());
      return { ...team.toObject(), tournamentCount, isFormerMember };
    }));

    res.status(200).json({ success: true, data: teamsWithCounts });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/invitations
export const getInvitations = async (req, res, next) => {
  try {
    const invitations = await Team.find({ pendingPlayers: req.user._id })
      .populate('captain', 'name avatar banned')
      .select('name tag game logo captain createdAt');

    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/all
export const getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate('captain', 'name email avatar banned')
      .populate('players', 'name email avatar banned')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:id
export const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('captain', 'name email avatar banned')
      .populate('players', 'name email avatar banned')
      .populate('pendingPlayers', 'name email avatar banned');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const tournamentCount = await Registration.countDocuments({ 
      team: team._id,
      status: { $in: ['pending', 'approved'] } 
    });

    // Using .toObject() or .lean() is better, but spread works if it's a mongoose doc.
    const teamData = { ...team.toObject(), tournamentCount };

    res.status(200).json({ success: true, data: teamData });
  } catch (error) {
    next(error);
  }
};

// PUT /api/teams/:id
export const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Only captain can update
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can update the team.' });
    }

    const { name, tag, game, players } = req.body;
    team.name = name || team.name;
    team.tag = tag || team.tag;
    team.game = game || team.game;
    
    if (req.file) {
      team.logo = req.file.path;
    }

    let parsedPlayers = null;
    if (players) {
      parsedPlayers = typeof players === 'string' ? JSON.parse(players) : players;
    }

    if (parsedPlayers && Array.isArray(parsedPlayers)) {
      const incomingPlayers = parsedPlayers.filter(p => p !== req.user._id.toString());
      const confirmedPlayers = team.players.map(p => p.toString());
      const existingPending = team.pendingPlayers.map(p => p.toString());

      const newlyInvited = incomingPlayers.filter(p => !confirmedPlayers.includes(p) && !existingPending.includes(p));

      // Find players that were removed and add them to formerPlayers
      const removedPlayers = confirmedPlayers.filter(
        (p) => p !== req.user._id.toString() && !incomingPlayers.includes(p)
      );
      for (const p of removedPlayers) {
        if (!team.formerPlayers.includes(p)) {
          team.formerPlayers.push(p);
          const userToRemove = await User.findById(p);
          if (userToRemove) {
            sendTeamRemovalEmail(userToRemove.email, userToRemove.name, team.name);
          }
        }
      }

      team.pendingPlayers = incomingPlayers.filter(p => !confirmedPlayers.includes(p));
      team.players = [req.user._id.toString(), ...incomingPlayers.filter(p => confirmedPlayers.includes(p))];

      if (newlyInvited.length > 0) {
        const usersToEmail = await User.find({ _id: { $in: newlyInvited } });
        for (const u of usersToEmail) {
          sendTeamInvitationEmail(u.email, u.name, req.user.name, team.name, team.tag);
        }
      }
    }

    await team.save();
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

// POST /api/teams/:id/invite
export const invitePlayer = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can invite players.' });
    }

    if (team.players.includes(playerId)) {
      return res.status(400).json({ success: false, message: 'Player is already in the team.' });
    }

    // Send notification to the player
    await Notification.create({
      user: playerId,
      message: `You have been invited to join team "${team.name}".`,
      type: 'invite',
    });

    res.status(200).json({ success: true, message: 'Invite sent.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/teams/:id/join
export const joinTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.players.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are already in this team.' });
    }

    team.players.push(req.user._id);
    
    // Remove from formerPlayers if they are rejoining
    if (team.formerPlayers && team.formerPlayers.includes(req.user._id)) {
      team.formerPlayers = team.formerPlayers.filter(p => p.toString() !== req.user._id.toString());
    }

    await team.save();

    res.status(200).json({ success: true, message: 'Joined team successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/teams/:id/members/:playerId
export const removeMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can remove members.' });
    }

    if (req.params.playerId === team.captain.toString()) {
      return res.status(400).json({ success: false, message: 'Captain cannot be removed.' });
    }

    if (!team.formerPlayers.includes(req.params.playerId)) {
      team.formerPlayers.push(req.params.playerId);
      const userToRemove = await User.findById(req.params.playerId);
      if (userToRemove) {
        sendTeamRemovalEmail(userToRemove.email, userToRemove.name, team.name);
      }
    }
    team.players = team.players.filter((p) => p.toString() !== req.params.playerId);
    await team.save();

    res.status(200).json({ success: true, message: 'Member removed.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/teams/:id
export const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can delete the team.' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Team deleted.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/teams/:id/accept
export const acceptInvite = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (!team.pendingPlayers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'No pending invitation found for this team.' });
    }

    // Move from pending to active
    team.pendingPlayers = team.pendingPlayers.filter(p => p.toString() !== req.user._id.toString());
    team.players.push(req.user._id);

    // Remove from formerPlayers if they are rejoining
    if (team.formerPlayers && team.formerPlayers.includes(req.user._id)) {
      team.formerPlayers = team.formerPlayers.filter(p => p.toString() !== req.user._id.toString());
    }

    await team.save();

    // Notify Captain
    await Notification.create({
      user: team.captain,
      message: `${req.user.name} has accepted your invitation to join ${team.name}!`,
      type: 'success',
    });

    if (team.pendingPlayers.length === 0) {
      const captain = await User.findById(team.captain);
      if (captain) {
        sendTeamCompleteEmail(captain.email, captain.name, team.name);
      }
    }

    res.status(200).json({ success: true, message: 'Invitation accepted successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/teams/:id/decline
export const declineInvite = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (!team.pendingPlayers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'No pending invitation found for this team.' });
    }

    // Remove from pending
    team.pendingPlayers = team.pendingPlayers.filter(p => p.toString() !== req.user._id.toString());

    await team.save();

    res.status(200).json({ success: true, message: 'Invitation declined.' });
  } catch (error) {
    next(error);
  }
};
