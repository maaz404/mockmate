const UserProfile = require("../models/UserProfile");
const Logger = require("./logger");
const { getMonthlyQuota, isUnlimited } = require("../config/plans");

/**
 * Ensure the user's monthly quota is reset if the reset date has passed or not set.
 * Mutates + persists the profile only when a reset is actually performed.
 * @param {import('../models/UserProfile')} profile
 * @returns {Promise<boolean>} true if quota was reset
 */
async function ensureMonthlyQuota(profile) {
  try {
    if (!profile || !profile.subscription) return false;
    const { plan, lastInterviewReset, interviewsUsedThisMonth } =
      profile.subscription;
    if (isUnlimited(plan)) return false; // unlimited plans don't reset

    const now = new Date();
    const lastReset = lastInterviewReset
      ? new Date(lastInterviewReset)
      : new Date(0);
    const daysSinceReset = Math.floor(
      (now - lastReset) / (1000 * 60 * 60 * 24)
    );

    // Reset if 30 days have passed
    if (daysSinceReset >= 30) {
      profile.subscription.interviewsUsedThisMonth = 0;
      profile.subscription.lastInterviewReset = now;
      await profile.save();
      Logger.info(
        `Monthly quota reset for user ${profile.user} (plan: ${plan})`
      );
      return true;
    }

    return false;
  } catch (e) {
    Logger.warn("ensureMonthlyQuota failure", e);
    return false;
  }
}

/**
 * Idempotently consume one interview from a free plan (or limited paid) quota.
 * Tracks lastConsumedInterviewId to avoid double decrement when start API retried.
 * @param {string} userId - MongoDB user ID (not Clerk ID)
 * @param {string} interviewId
 * @returns {Promise<{updated:boolean, remaining:number}>}
 */
async function consumeFreeInterview(userId, interviewId) {
  try {
    // CHANGED: clerkUserId → user
    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return { updated: false, remaining: 0 };
    await ensureMonthlyQuota(profile); // opportunistic reset

    const { plan, interviewsUsedThisMonth } = profile.subscription;
    if (isUnlimited(plan)) {
      return { updated: false, remaining: null };
    }

    // Idempotency guard
    if (profile.subscription.lastConsumedInterviewId === interviewId) {
      const quota = getMonthlyQuota(plan);
      const remaining = Math.max(0, quota - interviewsUsedThisMonth);
      return {
        updated: false,
        remaining,
      };
    }

    const quota = getMonthlyQuota(plan);
    const remaining = Math.max(0, quota - interviewsUsedThisMonth);

    if (remaining > 0) {
      profile.subscription.interviewsUsedThisMonth += 1;
      profile.subscription.lastConsumedInterviewId = interviewId;
      await profile.save();
      return {
        updated: true,
        remaining: remaining - 1,
      };
    }
    return {
      updated: false,
      remaining: 0,
    };
  } catch (err) {
    Logger.warn("Failed to consume interview quota", err);
    return { updated: false, remaining: 0 };
  }
}

/**
 * Helper to fetch remaining interviews (after opportunistic monthly reset).
 * @param {string} userId - MongoDB user ID (not Clerk ID)
 * @returns {Promise<number|null>} remaining or null for unlimited
 */
async function getRemaining(userId) {
  try {
    // CHANGED: clerkUserId → user
    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return 0;
    await ensureMonthlyQuota(profile);
    if (isUnlimited(profile.subscription.plan)) return null;

    const quota = getMonthlyQuota(profile.subscription.plan);
    const remaining = Math.max(
      0,
      quota - profile.subscription.interviewsUsedThisMonth
    );
    return remaining;
  } catch (e) {
    Logger.warn("getRemaining failed", e);
    return 0;
  }
}

module.exports = { consumeFreeInterview, ensureMonthlyQuota, getRemaining };
