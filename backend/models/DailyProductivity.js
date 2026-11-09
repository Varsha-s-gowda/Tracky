const mongoose = require('mongoose');

const breakdownSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    weight: { type: Number, required: true },
    ratio: { type: Number, required: true },
    points: { type: Number, required: true },
  },
  { _id: false }
);

const dailyProductivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    target: {
      type: Number,
      default: 60,
      min: 1,
      max: 100,
    },
    successful: {
      type: Boolean,
      default: false,
    },
    hasActivity: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['success', 'missed', 'rest'],
      default: 'rest',
    },
    tasksTotal: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    highPriorityTotal: { type: Number, default: 0 },
    highPriorityCompleted: { type: Number, default: 0 },
    habitsScheduled: { type: Number, default: 0 },
    habitsCompleted: { type: Number, default: 0 },
    scheduledItems: { type: Number, default: 0 },
    completedItems: { type: Number, default: 0 },
    breakdown: { type: [breakdownSchema], default: [] },
  },
  { timestamps: true }
);

dailyProductivitySchema.index({ userId: 1, date: 1 }, { unique: true });
dailyProductivitySchema.index({ userId: 1, dateKey: 1 }, { unique: true });
dailyProductivitySchema.index({ userId: 1, successful: 1, dateKey: -1 });

module.exports = mongoose.model('DailyProductivity', dailyProductivitySchema);
