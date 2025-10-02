/*
  Seed script to populate MongoDB Atlas with a sample user profile and interview
  Usage: node src/scripts/seedDevAtlas.js
  Requires MONGODB_URI in environment (Atlas connection string)
*/
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/database");
const UserProfile = require("../models/UserProfile");
const Interview = require("../models/Interview");

async function run() {
  try {
    await connectDB();

    const clerkUserId = process.env.SEED_CLERK_USER_ID || "seed-user-123";
    const email = process.env.SEED_EMAIL || "seed.user@example.com";

    let profile = await UserProfile.findOne({ clerkUserId });
    if (!profile) {
      profile = await UserProfile.create({
        clerkUserId,
        email,
        firstName: "Seed",
        lastName: "User",
        professionalInfo: {
          currentRole: "Software Engineer",
          experience: "mid",
          industry: "technology",
          skills: [
            { name: "JavaScript", confidence: 4, category: "programming" },
            { name: "React", confidence: 4, category: "framework" },
          ],
        },
        preferences: {
          interviewTypes: ["technical", "behavioral"],
          difficulty: "intermediate",
        },
        subscription: { plan: "premium", interviewsRemaining: 999 },
        onboardingCompleted: true,
      });
      // eslint-disable-next-line no-console
      console.log("✅ Created seed UserProfile");
    } else {
      // eslint-disable-next-line no-console
      console.log("ℹ️  Seed UserProfile already exists");
    }

    // Create a sample interview
    const sample = await Interview.create({
      userId: clerkUserId,
      userProfile: profile._id,
      config: {
        jobRole: "Frontend Developer",
        industry: "technology",
        experienceLevel: "mid",
        interviewType: "technical",
        difficulty: "intermediate",
        duration: 30,
        questionCount: 5,
        adaptiveDifficulty: { enabled: false },
      },
      status: "completed",
      questions: [],
      metrics: {
        totalQuestions: 0,
        avgScore: 0,
        totalDurationMs: 0,
      },
    });
    // eslint-disable-next-line no-console
    console.log("✅ Created sample Interview:", sample._id.toString());

    // eslint-disable-next-line no-console
    console.log("🎉 Seed complete. Collections:");
    const collections = await mongoose.connection.db.collections();
    // eslint-disable-next-line no-console
    console.log(collections.map((c) => c.collectionName));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", err?.message || err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
