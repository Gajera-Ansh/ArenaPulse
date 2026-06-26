// Notification controller - get and manage user notifications

import Notification from '../models/Notification.js';

// GET /api/notifications
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications
export const clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ success: true, message: 'Notifications cleared.' });
  } catch (error) {
    next(error);
  }
};
