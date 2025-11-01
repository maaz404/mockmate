/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */
/*
  Upgrade a user's subscription to premium (development utility)
  Usage examples:
    node src/scripts/upgradeUserSubscription.js --email="user@example.com"
    node src/scripts/upgradeUserSubscription.js --userId="clerk_user_id"

  Environment:
    MONGODB_URI must be set (or the same variables your connectDB uses)
*/

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/database");
const UserProfile = require("../models/UserProfile");

function parseArgs() {
  const ARG_OFFSET = 2;
  const args = process.argv.slice(ARG_OFFSET);
  const out = {};
  args.forEach((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  });
  return out;
}

async function run() {
  const { email, userId, firstName, lastName, forceCreate } = parseArgs();
  if (!email && !userId) {
    console.error("\n❌ Please provide --email or --userId");
    process.exit(1);
  }

  try {
    await connectDB();

    let profile;
    if (email) {
      const regex = new RegExp(`^${email}$`, "i");
      profile = await UserProfile.findOne({ email: regex });
    } else if (userId) {
      profile = await UserProfile.findOne({ userId: userId });
    }

    if (!profile) {
      if (forceCreate === "true" || forceCreate === "1") {
        if (!email) {
          console.error("❌ Cannot create profile without --email.");
          process.exit(3);
        }
        const testUserId = userId || `manual-${Date.now()}`;
        profile = await UserProfile.create({
          testUserId,
          email,
          firstName: firstName || "Premium",
          lastName: lastName || "User",
          subscription: { plan: "premium", interviewsRemaining: 999 },
          onboardingCompleted: true,
        });
        console.log("🆕 Created new profile for user before upgrading.");
      } else {
        console.error(
          "❌ User profile not found for given identifier. Pass --force-create=true and --email to create one."
        );
        process.exit(2);
      }
    }

    const {
      getPlan,
      getMonthlyQuota,
      isUnlimited,
    } = require("../config/plans");
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // eslint-disable-line no-magic-numbers
    const premiumPlan = getPlan("premium");
    profile.subscription = {
      plan: premiumPlan.key,
      interviewsRemaining: isUnlimited(premiumPlan.key)
        ? getMonthlyQuota(premiumPlan.key) // Infinity for unlimited; store null to represent unlimited
        : getMonthlyQuota(premiumPlan.key),
      nextResetDate: new Date(Date.now() + THIRTY_DAYS_MS),
    };
    if (!isFinite(profile.subscription.interviewsRemaining)) {
      // Normalize Infinity to null for persistence clarity
      profile.subscription.interviewsRemaining = null;
    }

    await profile.save();

    console.log("✅ Upgraded user to premium");
    console.log({
      email: profile.email,
      userId: profile.testUserId,
      subscription: profile.subscription,
    });
  } catch (err) {
    console.error("❌ Upgrade failed:", err?.message || err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
