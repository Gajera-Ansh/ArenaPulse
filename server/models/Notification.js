// Notification model - user notifications with type, message, and read status

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'invite', 'match', 'result'],
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// TTL Index: Automatically delete notifications after 48 hours (172800 seconds)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
