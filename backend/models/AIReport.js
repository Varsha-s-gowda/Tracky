const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    items: { type: [String], default: [] },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    detail: { type: String, default: '' },
    category: { type: String, default: 'general' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { _id: false }
);

const aiReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly'],
      required: true,
    },
    // YYYY-MM-DD for daily reports, week-start YYYY-MM-DD for weekly reports.
    periodKey: { type: String, required: true },
    rangeStart: { type: String, required: true },
    rangeEnd: { type: String, required: true },
    title: { type: String, required: true, maxlength: 160 },
    summary: { type: String, default: '', maxlength: 6000 },
    sections: { type: [sectionSchema], default: [] },
    recommendations: { type: [recommendationSchema], default: [] },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    insights: { type: mongoose.Schema.Types.Mixed, default: {} },
    source: { type: String, enum: ['rules', 'ai'], default: 'rules' },
    aiStatus: {
      type: String,
      enum: ['not_configured', 'generated', 'failed', 'skipped'],
      default: 'not_configured',
    },
    aiError: { type: String, default: '', maxlength: 300 },
    model: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aiReportSchema.index({ userId: 1, type: 1, periodKey: 1 }, { unique: true });
aiReportSchema.index({ userId: 1, generatedAt: -1 });

module.exports = mongoose.model('AIReport', aiReportSchema);
