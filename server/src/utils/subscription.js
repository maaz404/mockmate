const UserProfile = require("../models/UserProfile");
const Logger = require("./logger");

/**
 * Safely decrement remaining interviews for a free plan user.
 * Guards against double decrement on the same interview start.
 * @param {string} userId Clerk user id
 * @param {string} interviewId Interview id (used to mark consumption)
 * @returns {Promise<{updated:boolean, remaining:number}>}
 */
async function consumeFreeInterview(userId, interviewId) {
  try {
    const profile = await UserProfile.findOne({ clerkUserId: userId });
    if (!profile) return { updated: false, remaining: 0 };
    if (profile.subscription.plan !== "free") {
      return {
        updated: false,
        remaining: profile.subscription.interviewsRemaining,
      };
    }

    // Idempotency: track lastConsumedInterviewId
    if (profile.subscription.lastConsumedInterviewId === interviewId) {
      return {
        updated: false,
        remaining: profile.subscription.interviewsRemaining,
      };
    }

    if (profile.subscription.interviewsRemaining > 0) {
      profile.subscription.interviewsRemaining -= 1; // eslint-disable-line no-plusplus
      profile.subscription.lastConsumedInterviewId = interviewId;
      await profile.save();
      return {
        updated: true,
        remaining: profile.subscription.interviewsRemaining,
      };
    }
    return { updated: false, remaining: 0 };
  } catch (err) {
    Logger.warn("Failed to consume free interview quota", err);
    return { updated: false, remaining: 0 };
  }
}

module.exports = { consumeFreeInterview };
