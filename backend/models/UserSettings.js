const mongoose = require('mongoose');

const weeklyGoalsSchema = new mongoose.Schema(
  {
    tasks: {
      type: Number,
      default: 20,
      min: 0,
      max: 1000,
    },
    habits: {
      type: Number,
      default: 25,
      min: 0,
      max: 1000,
    },
    productivityScore: {
      type: Number,
      default: 75,
      min: 1,
      max: 100,
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    xpAlerts: { type: Boolean, default: true },
    achievementAlerts: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    dailyReminder: { type: Boolean, default: false },
    reminderTime: {
      type: String,
      default: '09:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Reminder time must use HH:mm format.'],
    },
  },
  { _id: false }
);

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dailyCompletionTarget: {
      type: Number,
      default: 60,
      min: 1,
      max: 100,
    },
    weeklyGoals: {
      type: weeklyGoalsSchema,
      default: () => ({}),
    },
    notifications: {
      type: notificationSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserSettings', userSettingsSchema);
