// Admin controller - user management and platform administration

import User from '../models/User.js';
import Tournament from '../models/Tournament.js';

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
