const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 300,
    },
    category: {
      type: String,
      default: 'General',
      maxlength: 40,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    icon: {
      type: String,
      default: 'trophy',
      maxlength: 40,
    },
    criteriaType: {
      type: String,
      required: true,
      maxlength: 40,
    },
    criteriaValue: {
      type: Number,
      required: true,
      min: 1,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

achievementSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
