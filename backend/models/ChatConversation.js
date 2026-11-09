const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New conversation',
      trim: true,
      maxlength: 120,
    },
    messageCount: { type: Number, default: 0, min: 0 },
    lastMessagePreview: { type: String, default: '', maxlength: 200 },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatConversationSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
