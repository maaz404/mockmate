/* eslint-disable no-console, no-magic-numbers */
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/database");
const UserProfile = require("../models/UserProfile");

async function upgradeUser() {
  try {
    await connectDB();

    const email = "maazakbar404@gmail.com";
    const clerkUserId = "user_32SjRWLQzT2Adf0C0MPuO0lezl3";

    // First, find if user exists with this email or clerkUserId
    let profile = await UserProfile.findOne({
      $or: [{ email }, { clerkUserId }],
    });

    if (!profile) {
      // Create a new profile for this user
      console.log("Creating new profile for", email);
      profile = await UserProfile.create({
        clerkUserId,
        email,
        firstName: "Maaz",
        lastName: "Sheikh",
        onboardingCompleted: true,
        subscription: {
          plan: "premium",
          interviewsRemaining: null, // unlimited
          nextResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        professionalInfo: {
          currentRole: "Software Developer",
          experience: "mid",
          industry: "Technology",
        },
        preferences: {
          interviewTypes: ["technical", "behavioral"],
          difficulty: "intermediate",
          sessionDuration: 30,
        },
        analytics: {
          totalInterviews: 0,
          averageScore: 0,
          strongAreas: [],
          improvementAreas: [],
        },
      });
    } else {
      // Update existing profile
      console.log("Updating existing profile for", email);

      // Update clerkUserId if missing or different
      if (!profile.clerkUserId || profile.clerkUserId !== clerkUserId) {
        profile.clerkUserId = clerkUserId;
      }

      // Update email if missing or different
      if (!profile.email || profile.email !== email) {
        profile.email = email;
      }

      // Upgrade subscription
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      profile.subscription = {
        plan: "premium",
        interviewsRemaining: null, // unlimited
        nextResetDate: new Date(Date.now() + thirtyDaysMs),
      };

      // Ensure required fields are present
      if (!profile.onboardingCompleted) {
        profile.onboardingCompleted = true;
      }

      if (!profile.firstName) {
        profile.firstName = "Maaz";
      }

      if (!profile.lastName) {
        profile.lastName = "Sheikh";
      }

      if (!profile.professionalInfo) {
        profile.professionalInfo = {
          currentRole: "Software Developer",
          experience: "mid",
          industry: "Technology",
        };
      }

      if (!profile.preferences) {
        profile.preferences = {
          interviewTypes: ["technical", "behavioral"],
          difficulty: "intermediate",
          sessionDuration: 30,
        };
      }

      if (!profile.analytics) {
        profile.analytics = {
          totalInterviews: 0,
          averageScore: 0,
          strongAreas: [],
          improvementAreas: [],
        };
      }

      await profile.save();
    }

    console.log("✅ Successfully upgraded user to premium");
    console.log({
      email: profile.email,
      clerkUserId: profile.clerkUserId,
      subscription: profile.subscription,
      onboardingCompleted: profile.onboardingCompleted,
    });
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

upgradeUser();
