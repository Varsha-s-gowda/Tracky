const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required.'],
      trim: true,
      maxlength: [120, 'Task title must be at most 120 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description must be at most 2000 characters.'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: 50,
    },
    tags: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required.'],
    },
    dueTime: {
      type: String,
      default: '',
      match: [/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Due time must use HH:mm format.'],
    },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    postponeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPostponedAt: {
      type: Date,
      default: null,
    },
    recurrenceSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    generatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, dueDate: 1, status: 1 });
taskSchema.index({ userId: 1, status: 1, priority: 1 });
taskSchema.index(
  { userId: 1, recurrenceSeriesId: 1, dueDate: 1 },
  {
    unique: true,
    partialFilterExpression: { recurrenceSeriesId: { $type: 'objectId' } },
  }
);

module.exports = mongoose.model('Task', taskSchema);
