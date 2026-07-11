import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ['Cheating/Hacking', 'Toxicity/Harassment', 'Smurfing', 'Griefing', 'Other'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    evidenceUrl: {
      type: String,
      trim: true,
      required: [true, 'Evidence URL is required to submit a report'],
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
