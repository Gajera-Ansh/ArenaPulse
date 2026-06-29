// Auth controller - handles user registration, login, and profile retrieval

import User from '../models/User.js';
import { generateToken } from '../utils/jwtHelper.js';
import { sendWelcomeEmail, sendOTPEmail } from '../utils/emailService.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Only allow player and organizer roles during registration
    const allowedRoles = ['player', 'organizer'];
    const userRole = allowedRoles.includes(role) ? role : 'player';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    // Send welcome email asynchronously
    sendWelcomeEmail(user.email, user.name);

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
export const googleLogin = async (req, res, next) => {
  try {
    const { token, role } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'No Google token provided.' });
    }

    // Fetch user info using the Google access token
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleResponse.ok) {
      return res.status(401).json({ success: false, message: 'Invalid Google token.' });
    }

    const { email, name, picture } = await googleResponse.json();

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      // Generate a random password since they use Google
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      
      const allowedRoles = ['player', 'organizer'];
      const userRole = allowedRoles.includes(role) ? role : 'player';

      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: userRole,
        avatar: picture
      });

      sendWelcomeEmail(user.email, user.name);
    }

    if (user.banned) {
      return res.status(403).json({ success: false, message: 'Your account has been banned.' });
    }

    // Generate our own JWT token
    const jwtToken = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password-otp
export const requestForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

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

// POST /api/auth/verify-forgot-password-otp
export const verifyForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
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

// POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires +password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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

    res.status(200).json({ success: true, message: 'Password reset successfully!' });
  } catch (error) {
    next(error);
  }
};
