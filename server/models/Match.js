// Match model - individual matches with teams, scores, round, and result

import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    scoreA: {
      type: Number,
      default: 0,
    },
    scoreB: {
      type: Number,
      default: 0,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    round: {
      type: Number,
      required: true,
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    nextMatchNumber: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed'],
      default: 'upcoming',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    statsSubmitted: {
      type: Boolean,
      default: false,
    },
    playerStats: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema);

export default Match;
