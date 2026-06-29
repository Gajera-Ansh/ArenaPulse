// User controller - handles profile retrieval and updates

import User from '../models/User.js';
import { sendOTPEmail } from '../utils/emailService.js';
import crypto from 'crypto';

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/avatar
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const avatarUrl = req.file.path; // Cloudinary returns the URL here
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/search?q=username
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required.' });
    }

    const query = {
      name: { $regex: q, $options: 'i' },
      banned: false,
    };

    if (req.query.role) {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .select('name email avatar role')
      .limit(10);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/request-password-otp
export const requestPasswordChangeOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2 minutes from now
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000); 

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send email
    await sendOTPEmail(user.email, user.name, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/verify-password-otp
export const verifyPasswordChangeOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required.' });

    const user = await User.findById(req.user._id).select('+otp +otpExpires');
    
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // Extend the expiration by 5 minutes so they have time to type their new password
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    res.status(200).json({ success: true, message: 'OTP verified.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) return res.status(400).json({ success: false, message: 'OTP and new password are required.' });

    const user = await User.findById(req.user._id).select('+otp +otpExpires +password');

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    next(error);
  }
};
