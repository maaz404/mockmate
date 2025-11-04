const mongoose = require("mongoose");

const scheduledSessionSchema = new mongoose.Schema(
  {
    // CHANGED: userId: String → user: ObjectId
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    // Link to actual interview if session was started
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
    },
  },
  {
    timestamps: true,
  }
);

// CHANGED: Indexes
scheduledSessionSchema.index({ user: 1, scheduledAt: 1 });
scheduledSessionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("ScheduledSession", scheduledSessionSchema);
