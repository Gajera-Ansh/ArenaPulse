// Checkin controller - handles QR code generation and verification

import Checkin from '../models/Checkin.js';
import QRCode from 'qrcode';

// POST /api/checkins/generate
export const generateCheckin = async (req, res, next) => {
  try {
    const { matchId } = req.body;

    // Check if already generated
    const existing = await Checkin.findOne({ match: matchId, player: req.user._id });
    if (existing) {
      return res.status(200).json({ success: true, data: existing });
    }

    // Generate QR code data
    const qrData = `arenapulse:checkin:${matchId}:${req.user._id}:${Date.now()}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const checkin = await Checkin.create({
      match: matchId,
      player: req.user._id,
      qrCode,
    });

    res.status(201).json({ success: true, data: checkin });
  } catch (error) {
    next(error);
  }
};

// POST /api/checkins/verify
export const verifyCheckin = async (req, res, next) => {
  try {
    const { matchId, playerId } = req.body;

    const checkin = await Checkin.findOne({ match: matchId, player: playerId });

    if (!checkin) {
      return res.status(404).json({ success: false, message: 'Check-in not found.' });
    }

    checkin.verified = true;
    await checkin.save();

    res.status(200).json({ success: true, message: 'Player verified.', data: checkin });
  } catch (error) {
    next(error);
  }
};

// GET /api/checkins/match/:matchId
export const getCheckinsByMatch = async (req, res, next) => {
  try {
    const checkins = await Checkin.find({ match: req.params.matchId })
      .populate('player', 'name email avatar');

    res.status(200).json({ success: true, data: checkins });
  } catch (error) {
    next(error);
  }
};
