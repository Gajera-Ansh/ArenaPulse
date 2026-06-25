// Checkin model - QR-based tournament day player check-in records

import mongoose from 'mongoose';

const checkinSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One player can only check in once per match
checkinSchema.index({ match: 1, player: 1 }, { unique: true });

const Checkin = mongoose.model('Checkin', checkinSchema);

export default Checkin;
