const mongoose = require("mongoose");

// Scheduled practice/interview session for a user
const scheduledSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "Practice Session",
    },
    type: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "system-design",
        "case-study",
        "coding",
        "mock",
      ],
      default: "technical",
    },
    duration: {
      type: Number, // minutes
      default: 30,
      min: 5,
      max: 180,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    notes: String,
    status: {
      type: String,
      enum: ["scheduled", "completed", "canceled"],
      default: "scheduled",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduledSessionSchema.index({ userId: 1, scheduledAt: 1 });

module.exports = mongoose.model("ScheduledSession", scheduledSessionSchema);
