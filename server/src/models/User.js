const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const SubscriptionSchema = new Schema(
  {
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    interviewsRemaining: { type: Number, default: 50 },
    nextResetDate: { type: Date },
  },
  { _id: false }
);

const AnalyticsSchema = new Schema(
  {
    totalInterviews: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    googleId: { type: String, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    name: { type: String, trim: true },
    avatar: { type: String },
    authProvider: {
      type: String,
      enum: ["google", "local"],
      required: true,
      default: "google",
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: 8,
      select: false, // never return password hash by default
    },
    subscription: { type: SubscriptionSchema, default: () => ({}) },
    analytics: { type: AnalyticsSchema, default: () => ({}) },
    preferences: { type: Object, default: () => ({}) },
    legacyProfileId: { type: Types.ObjectId, ref: "UserProfile" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
