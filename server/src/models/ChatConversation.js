const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    sources: [
      {
        id: String,
        title: String,
        score: Number,
        category: String,
        source: String,
      },
    ],
    timestamp: { type: Date, default: Date.now },
    fallback: { type: Boolean, default: false },
    provider: { type: String },
  },
  { _id: false }
);

const ChatConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
    messages: { type: [ChatMessageSchema], default: [] },
    lastInteractionAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ChatConversationSchema.index({ user: 1, interviewId: 1 }, { unique: false });

module.exports = mongoose.model("ChatConversation", ChatConversationSchema);
