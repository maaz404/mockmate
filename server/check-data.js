const mongoose = require("mongoose");
const Interview = require("./src/models/Interview");
const UserProfile = require("./src/models/UserProfile");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB\n");

    // Find by user ID instead of email
    const userId = "68e66b347eca3f9348f8b960";
    const profile = await UserProfile.findOne({ user: userId });

    if (!profile) {
      console.log(`No profile found for user ID ${userId}`);
      mongoose.connection.close();
      return;
    }

    console.log("=== USER PROFILE INFO ===");
    console.log("User ID:", profile.user);
    console.log("Email:", profile.email);
    console.log("Name:", profile.firstName, profile.lastName);

    console.log("=== BEFORE UPDATE ===");
    console.log("Subscription Plan:", profile.subscription?.plan);
    console.log(
      "Interviews Used This Month:",
      profile.subscription?.interviewsUsedThisMonth
    );
    console.log(
      "Total Interviews (analytics):",
      profile.analytics?.totalInterviews || 0
    );
    console.log(
      "Average Score (analytics):",
      profile.analytics?.averageScore || 0
    );

    // Initialize missing subscription fields
    if (profile.subscription.interviewsUsedThisMonth === undefined) {
      profile.subscription.interviewsUsedThisMonth = 0;
    }
    if (!profile.subscription.lastInterviewReset) {
      profile.subscription.lastInterviewReset = new Date();
    }

    // Fetch all interviews
    const interviews = await Interview.find({ user: profile.user }).lean();
    const completedInterviews = interviews.filter(
      (i) => i.status === "completed"
    );

    console.log("\n=== RECALCULATING ANALYTICS ===");
    console.log("Total Interviews Found:", interviews.length);
    console.log("Completed Interviews:", completedInterviews.length);

    // Recalculate analytics
    profile.analytics.totalInterviews = interviews.length;
    profile.analytics.completedInterviews = completedInterviews.length;

    // Calculate average score from completed interviews
    if (completedInterviews.length > 0) {
      const scores = completedInterviews
        .map((i) => i.results?.overallScore)
        .filter((score) => score !== null && score !== undefined);

      if (scores.length > 0) {
        const avgScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        profile.analytics.averageScore = Math.round(avgScore);
      }
    }

    profile.analytics.lastCalculated = new Date();
    profile.markModified("analytics");
    profile.markModified("subscription");

    await profile.save({ validateModifiedOnly: true });

    console.log("\n=== AFTER UPDATE ===");
    console.log("Subscription Plan:", profile.subscription.plan);
    console.log(
      "Interviews Used This Month:",
      profile.subscription.interviewsUsedThisMonth
    );
    console.log(
      "Total Interviews (analytics):",
      profile.analytics.totalInterviews
    );
    console.log(
      "Completed Interviews (analytics):",
      profile.analytics.completedInterviews
    );
    console.log("Average Score (analytics):", profile.analytics.averageScore);

    console.log("\n✅ Analytics updated successfully!");

    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
