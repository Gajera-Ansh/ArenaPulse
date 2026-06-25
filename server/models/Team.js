// Team model - esports teams with members, captain, and stats

import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
      maxlength: 30,
    },
    tag: {
      type: String,
      required: [true, 'Team tag is required'],
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    game: {
      type: String,
      required: [true, 'Game is required'],
      trim: true,
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    logo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Team = mongoose.model('Team', teamSchema);

export default Team;
