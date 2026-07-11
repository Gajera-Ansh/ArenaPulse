// Tournament model - tournament config, format, schedule, prizes, and status

import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tournament title is required'],
      trim: true,
      maxlength: 100,
    },
    game: {
      type: String,
      required: [true, 'Game is required'],
      trim: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bracketType: {
      type: String,
      enum: ['single-elimination', 'round-robin'],
      default: 'single-elimination',
    },
    maxTeams: {
      type: Number,
      required: true,
      min: 4,
      max: 64,
    },
    playersPerTeam: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
      max: 10,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    prizePool: {
      type: String,
      default: '',
    },
    rules: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'live', 'completed', 'cancelled'],
      default: 'draft',
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    ratings: [{
      player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 }
    }],
  },
  { timestamps: true }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
