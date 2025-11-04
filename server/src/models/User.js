const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Only require password if NOT using OAuth
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    name: {
      type: String,
      required: false, // CHANGE THIS FROM true TO false
      trim: true,
      default: "User", // ADD THIS - default value if not provided
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // OAuth fields (for Google login via Passport)
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Last login tracking
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },

    // Subscription info (can be expanded)
    subscription: {
      plan: {
        type: String,
        enum: ["free", "premium"], // CHANGE THIS - remove "basic" if it exists
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "canceled", "past_due", "trialing"],
        default: "active",
      },
      startDate: Date,
      endDate: Date,
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for userProfile
userSchema.virtual("profile", {
  ref: "UserProfile",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Method to check if user has pro plan
userSchema.methods.hasProPlan = function () {
  return (
    this.subscription.plan !== "free" && this.subscription.status === "active"
  );
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model("User", userSchema);
