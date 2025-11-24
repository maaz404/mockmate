const mongoose = require("mongoose");
require("dotenv").config();

const UserProfile = require("./src/models/UserProfile");

async function fixExistingProfiles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all profiles without properly initialized subscription
    const profiles = await UserProfile.find({
      $or: [
        { subscription: { $exists: false } },
        { "subscription.plan": { $exists: false } },
        { "subscription.lastInterviewReset": { $exists: false } },
      ],
    });

    console.log(
      `Found ${profiles.length} profiles with missing subscription data`
    );

    for (const profile of profiles) {
      if (!profile.subscription) {
        profile.subscription = {};
      }

      profile.subscription.plan = profile.subscription.plan || "free";
      profile.subscription.status = profile.subscription.status || "active";
      profile.subscription.interviewsRemaining =
        profile.subscription.interviewsRemaining ?? 10;
      profile.subscription.interviewsUsedThisMonth =
        profile.subscription.interviewsUsedThisMonth || 0;
      profile.subscription.lastInterviewReset =
        profile.subscription.lastInterviewReset || new Date();
      profile.subscription.cancelAtPeriodEnd =
        profile.subscription.cancelAtPeriodEnd || false;

      await profile.save();
      console.log(`Fixed subscription for profile ${profile._id}`);
    }

    console.log("All profiles fixed!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing profiles:", error);
    process.exit(1);
  }
}

fixExistingProfiles();
