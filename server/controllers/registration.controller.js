// Registration controller - handles tournament signups and approvals

import Registration from '../models/Registration.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';

// POST /api/registrations
export const registerForTournament = async (req, res, next) => {
  try {
    const { teamId, tournamentId } = req.body;

    // Check tournament exists and is open
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Tournament is not open for registration.' });
    }

    // Check team exists and user is captain
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can register the team.' });
    }

    // Check if already registered
    const existing = await Registration.findOne({ team: teamId, tournament: tournamentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Team already registered.' });
    }

    const registration = await Registration.create({
      team: teamId,
      tournament: tournamentId,
    });

    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
};

// GET /api/registrations/tournament/:tournamentId
export const getRegistrationsByTournament = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ tournament: req.params.tournamentId })
      .populate('team', 'name tag game logo players')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/registrations/:id/status
export const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const registration = await Registration.findById(req.params.id).populate('team');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    registration.status = status;
    registration.note = note || '';
    await registration.save();

    // Notify the team captain
    await Notification.create({
      user: registration.team.captain,
      message: `Your team registration has been ${status}.${note ? ' Note: ' + note : ''}`,
      type: status === 'approved' ? 'success' : 'warning',
    });

    res.status(200).json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/registrations/:id
export const withdrawRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('team');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    if (registration.team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can withdraw.' });
    }

    await Registration.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Registration withdrawn.' });
  } catch (error) {
    next(error);
  }
};
