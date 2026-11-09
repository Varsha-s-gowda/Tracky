const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'task_reminder',
  'pending_priority',
  'habit_reminder',
  'streak_milestone',
  'achievement',
  'daily_goal',
  'daily_report',
  'weekly_report',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, maxlength: 160 },
    body: { type: String, default: '', maxlength: 500 },
    link: { type: String, default: '', maxlength: 300 },
    dedupeKey: { type: String, required: true },
    readAt: { type: Date, default: null },
    // Cleared notifications are kept as tombstones so the same dedupe key is not
    // recreated by the next sync after a user dismisses it.
    dismissedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
notificationSchema.index({ userId: 1, dismissedAt: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
