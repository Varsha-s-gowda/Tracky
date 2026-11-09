const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A user can only have one record per habit per calendar day.
habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: 1, completed: 1 });

module.exports = mongoose.model('HabitLog', habitLogSchema);
