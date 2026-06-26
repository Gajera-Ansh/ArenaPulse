// Team controller - handles team CRUD, invitations, and member management

import Team from '../models/Team.js';
import Notification from '../models/Notification.js';

// POST /api/teams
export const createTeam = async (req, res, next) => {
  try {
    const { name, tag, game, players } = req.body;

    let playersArray = [req.user._id.toString()];
    if (players && Array.isArray(players)) {
      playersArray = [...new Set([req.user._id.toString(), ...players])];
    }

    const team = await Team.create({
      name,
      tag,
      game,
      captain: req.user._id,
      players: playersArray,
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams
export const getMyTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ players: req.user._id })
      .populate('captain', 'name email avatar')
      .populate('players', 'name email avatar');

    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/all
export const getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate('captain', 'name email avatar')
      .populate('players', 'name email avatar')
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
      .populate('captain', 'name email avatar')
      .populate('players', 'name email avatar');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    res.status(200).json({ success: true, data: team });
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

    const { name, tag, game } = req.body;
    team.name = name || team.name;
    team.tag = tag || team.tag;
    team.game = game || team.game;

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
