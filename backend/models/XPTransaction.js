const mongoose = require('mongoose');

const XP_TYPES = [
  'task_completion',
  'habit_completion',
  'daily_all_tasks',
  'habit_streak_7',
  'habit_streak_30',
];

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: XP_TYPES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: '',
      maxlength: 200,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      default: null,
    },
    dateKey: {
      type: String,
      required: true,
    },
    dedupeKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// One transaction per reward event. The server builds the key; clients can
// never submit an XP amount or a reward identity.
xpTransactionSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
xpTransactionSchema.index({ userId: 1, createdAt: -1 });
xpTransactionSchema.index({ userId: 1, dateKey: 1 });
xpTransactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('XPTransaction', xpTransactionSchema);
module.exports.XP_TYPES = XP_TYPES;
