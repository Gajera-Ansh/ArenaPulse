// Admin controller - user management and platform administration

import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import Registration from '../models/Registration.js';
import Team from '../models/Team.js';
import Report from '../models/Report.js';
import { sendTournamentUpdateEmail, sendBanEmail } from '../utils/emailService.js';

// GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/ban
export const toggleBan = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.banned = !user.banned;
    await user.save();

    const { reportId } = req.body;

    // If banned via a report, send the ban email with evidence (excluding reporter)
    if (user.banned && reportId) {
      const report = await Report.findById(reportId);
      if (report) {
        await sendBanEmail(user.email, user.name, report.reason, report.description, report.evidenceUrl);
      }
    }

    // If banned and is an organizer, cancel their active tournaments and notify enrolled players
    if (user.banned && user.role === 'organizer') {
      const activeTournaments = await Tournament.find({ 
        organizer: user._id, 
        status: { $in: ['open', 'live'] } 
      });

      for (const t of activeTournaments) {
        t.status = 'cancelled';
        await t.save();

        const registrations = await Registration.find({ tournament: t._id, status: 'approved' }).populate('team');
        let playerEmails = [];
        
        for (const reg of registrations) {
           const team = await Team.findById(reg.team._id).populate('players', 'email');
           if (team && team.players) {
             playerEmails.push(...team.players.map(p => p.email));
           }
        }
        
        playerEmails = [...new Set(playerEmails)];
        if (playerEmails.length > 0) {
           await sendTournamentUpdateEmail(playerEmails, t.title, 'canceled', user.name);
        }
      }
    }

    res.status(200).json({ success: true, message: `User ${user.banned ? 'banned' : 'unbanned'}.`, data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role
export const changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/stats
export const getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTournaments = await Tournament.countDocuments();
    const activeTournaments = await Tournament.countDocuments({ status: { $in: ['open', 'live'] } });

    res.status(200).json({
      success: true,
      data: { totalUsers, totalTournaments, activeTournaments },
    });
  } catch (error) {
    next(error);
  }
};
