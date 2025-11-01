const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
    emailVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

/**
 * Pre-save hook to hash password before saving
 * Only hash if password is modified and user is using local auth
 */
UserSchema.pre("save", async function (next) {
  // Only hash password if it's modified and user uses local auth
  if (!this.isModified("password") || this.authProvider !== "local") {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password to check
 * @returns {Promise<boolean>} - True if passwords match
 */
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Method to generate and return JWT token
 * @returns {string} - Signed JWT token
 */
UserSchema.methods.getSignedJwtToken = function () {
  const payload = {
    id: this._id,
    email: this.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || "default-secret-change-in-production", {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

/**
 * Method to generate password reset token
 * @returns {string} - Reset token (unhashed for email)
 */
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = require("crypto").randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = require("crypto")
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
