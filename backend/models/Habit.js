const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required.'],
      trim: true,
      maxlength: [100, 'Habit name must be at most 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description must be at most 1000 characters.'],
    },
    category: {
      type: String,
      trim: true,
      default: 'Personal',
      maxlength: 50,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator(days) {
          return (
            Array.isArray(days) &&
            days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
          );
        },
        message: 'Days of week must contain values from 0 (Sunday) to 6 (Saturday).',
      },
    },
    target: {
      value: {
        type: Number,
        min: 0.1,
        max: 100000,
        default: 1,
      },
      unit: {
        type: String,
        trim: true,
        maxlength: 30,
        default: 'times',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Habit', habitSchema);
