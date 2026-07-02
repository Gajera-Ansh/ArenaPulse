// PlayerStat model - cumulative per-player game stats (kills, deaths, etc.)

import mongoose from 'mongoose';

const playerStatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,  // Only ONE document per player
    },
    gameStats: {
      type: Map,
      of: {
        kills: { type: Number, default: 0 },
        deaths: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        headshots: { type: Number, default: 0 },
        damage: { type: Number, default: 0 },
        matches: { type: Number, default: 0 },  // how many matches these stats come from
      },
      default: {},
    },
  },
  { timestamps: true }
);

const PlayerStat = mongoose.model('PlayerStat', playerStatSchema);

export default PlayerStat;
