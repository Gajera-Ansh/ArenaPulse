// Registration controller - handles tournament signups and approvals

import Registration from '../models/Registration.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendTournamentEnrollmentEmail, sendRegistrationStatusEmail, sendPlayerDeclinedEmail, sendOrganizerRegistrationRequestEmail } from '../utils/emailService.js';

// POST /api/registrations
export const registerForTournament = async (req, res, next) => {
  try {
    const { teamId, tournamentId } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Tournament is not open for registration.' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can register the team.' });
    }

    if (team.pendingPlayers && team.pendingPlayers.length > 0) {
      return res.status(400).json({ success: false, message: 'Your team has pending invitations. All players must accept their invitations before you can register.' });
    }

    const existing = await Registration.findOne({ team: teamId, tournament: tournamentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Team already registered.' });
    }

    // Filter out the captain from pending players
    const pendingEnrollmentPlayers = team.players.filter(p => p.toString() !== req.user._id.toString());

    // If the team is just the captain (size 1), it goes straight to pending
    const status = pendingEnrollmentPlayers.length > 0 ? 'awaiting_players' : 'pending';

    const registration = await Registration.create({
      team: teamId,
      tournament: tournamentId,
      status: status,
      pendingPlayers: pendingEnrollmentPlayers,
    });

    if (pendingEnrollmentPlayers.length > 0) {
      const usersToEmail = await User.find({ _id: { $in: pendingEnrollmentPlayers } });
      for (const u of usersToEmail) {
        sendTournamentEnrollmentEmail(u.email, u.name, req.user.name, team.name, tournament.title);
      }
    }

    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
};

// GET /api/registrations/tournament/:tournamentId
export const getRegistrationsByTournament = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ tournament: req.params.tournamentId })
      .populate('team', 'name tag game logo players captain')
      .populate('pendingPlayers', 'name avatar')
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
    const registration = await Registration.findById(req.params.id)
      .populate('team')
      .populate('tournament', 'title enrolledCount maxTeams');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const previousStatus = registration.status;
    registration.status = status;
    registration.note = note || '';
    await registration.save();

    // Update Tournament enrolledCount
    if (status === 'approved' && previousStatus !== 'approved') {
      await Tournament.findByIdAndUpdate(registration.tournament._id, { $inc: { enrolledCount: 1 } });
    } else if (status === 'rejected' && previousStatus === 'approved') {
      await Tournament.findByIdAndUpdate(registration.tournament._id, { $inc: { enrolledCount: -1 } });
    }

    // Notify the team captain
    await Notification.create({
      user: registration.team.captain,
      message: `Your team registration has been ${status}.${note ? ' Note: ' + note : ''}`,
      type: status === 'approved' ? 'success' : 'warning',
    });

    // Send email to all players if approved or rejected
    if (status === 'approved' || status === 'rejected') {
      const usersToEmail = await User.find({ _id: { $in: registration.team.players } });
      const emails = usersToEmail.map(u => u.email);
      if (emails.length > 0) {
        sendRegistrationStatusEmail(emails, registration.team.name, registration.tournament.title, status);
      }
    }

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

// GET /api/registrations/pending-enrollments
export const getPendingEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Registration.find({ pendingPlayers: req.user._id, status: 'awaiting_players' })
      .populate('team', 'name tag game captain')
      .populate('tournament', 'title startDate endDate')
      .populate({
        path: 'team',
        populate: { path: 'captain', select: 'name avatar' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: enrollments });
  } catch (error) {
    next(error);
  }
};

// GET /api/registrations/my-active-enrollments
export const getMyActiveEnrollments = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ status: { $in: ['pending', 'approved'] } })
      .populate('team', 'name tag players')
      .populate('tournament', 'title game status startDate endDate registrationDeadline prizePool enrolledCount maxTeams')
      .sort({ createdAt: -1 });

    const myRegistrations = registrations.filter(reg => 
      reg.team && reg.team.players.some(p => p.toString() === req.user._id.toString())
    );

    res.status(200).json({ success: true, data: myRegistrations });
  } catch (error) {
    next(error);
  }
};

// POST /api/registrations/:id/accept
export const acceptEnrollment = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('team')
      .populate({ path: 'tournament', populate: { path: 'organizer', select: 'name email' } });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    if (!registration.pendingPlayers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'No pending enrollment found for this user.' });
    }

    // Remove from pendingPlayers
    registration.pendingPlayers = registration.pendingPlayers.filter(p => p.toString() !== req.user._id.toString());

    // If everyone has accepted, move status to 'pending' (ready for organizer)
    if (registration.pendingPlayers.length === 0) {
      registration.status = 'pending';
      
      // Notify captain that registration is fully complete
      await Notification.create({
        user: registration.team.captain,
        message: `Your entire roster has accepted the enrollment request. Your team is officially registered for the tournament!`,
        type: 'success',
      });

      // Email the organizer
      const organizer = registration.tournament.organizer;
      if (organizer && organizer.email) {
        sendOrganizerRegistrationRequestEmail(
          organizer.email,
          organizer.name,
          registration.team.name,
          registration.tournament.title
        );
      }
    }

    await registration.save();
    res.status(200).json({ success: true, message: 'Enrollment accepted.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/registrations/:id/decline
export const declineEnrollment = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('team').populate('tournament');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    if (!registration.pendingPlayers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'No pending enrollment found for this user.' });
    }

    // Completely abort the registration
    await Registration.findByIdAndDelete(req.params.id);

    // Notify the captain that the registration was aborted
    await Notification.create({
      user: registration.team.captain._id ? registration.team.captain._id : registration.team.captain,
      message: `${req.user.name} has declined the enrollment request. Your team's registration for ${registration.tournament.title} has been cancelled.`,
      type: 'warning',
    });

    const captain = await User.findById(registration.team.captain);
    if (captain) {
      sendPlayerDeclinedEmail(captain.email, captain.name, req.user.name, registration.team.name, registration.tournament.title);
    }

    res.status(200).json({ success: true, message: 'Enrollment declined and registration aborted.' });
  } catch (error) {
    next(error);
  }
};
