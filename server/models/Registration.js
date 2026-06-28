// Registration model - team or player tournament registration entries

import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    status: {
      type: String,
      enum: ['awaiting_players', 'pending', 'approved', 'rejected'],
      default: 'awaiting_players',
    },
    pendingPlayers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One team can only register once per tournament
registrationSchema.index({ team: 1, tournament: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
