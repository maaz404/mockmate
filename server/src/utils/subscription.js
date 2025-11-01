const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Logger = require("./logger");
const { getMonthlyQuota, isUnlimited } = require("../config/plans");

/**
 * Ensure the user's monthly quota is reset if the reset date has passed or not set.
 * Mutates + persists the profile only when a reset is actually performed.
 * @param {import('../models/User')} user
 * @returns {Promise<boolean>} true if quota was reset
 */
async function ensureMonthlyQuota(user) {
  try {
    if (!user || !user.subscription) return false;
    const { plan, nextResetDate } = user.subscription;
    if (isUnlimited(plan)) return false;

    const now = new Date();
    let shouldReset = false;
    if (!nextResetDate) shouldReset = true;
    else if (new Date(nextResetDate) <= now) shouldReset = true;

    if (!shouldReset) return false;
    const quota = getMonthlyQuota(plan);
    user.subscription.interviewsRemaining = quota === Infinity ? null : quota;
    // Set next reset ~30 days from now
    const DAYS_IN_CYCLE = 30;
    const HOURS_PER_DAY = 24;
    const MINUTES_PER_HOUR = 60;
    const SECONDS_PER_MINUTE = 60;
    const MS_PER_SECOND = 1000;
    const next = new Date(
      now.getTime() +
        DAYS_IN_CYCLE *
          HOURS_PER_DAY *
          MINUTES_PER_HOUR *
          SECONDS_PER_MINUTE *
          MS_PER_SECOND
    );
    user.subscription.nextResetDate = next;
    await user.save();
    return true;
  } catch (e) {
    Logger.warn("ensureMonthlyQuota failure", e);
    return false;
  }
}

/**
 * Idempotently consume one interview from a free plan (or limited paid) quota.
 * Tracks lastConsumedInterviewId to avoid double decrement when start API retried.
 * @param {string} userId
 * @param {string} interviewId
 * @returns {Promise<{updated:boolean, remaining:number}>}
 */
async function consumeFreeInterview(userId, interviewId) {
  try {
    let user = await User.findById(userId);
    if (!user && userId) {
      // fallback: try legacy UserProfile by clerkUserId
      const legacy = await UserProfile.findOne({ userId: userId });
      if (legacy) user = legacy;
    }
    if (!user) return { updated: false, remaining: 0 };
    await ensureMonthlyQuota(user);

    const { plan } = user.subscription;
    if (isUnlimited(plan)) {
      return { updated: false, remaining: null };
    }

    // Idempotency guard
    if (user.subscription.lastConsumedInterviewId === interviewId) {
      return {
        updated: false,
        remaining: user.subscription.interviewsRemaining,
      };
    }

    if (user.subscription.interviewsRemaining > 0) {
      user.subscription.interviewsRemaining -= 1;
      user.subscription.lastConsumedInterviewId = interviewId;
      await user.save();
      return {
        updated: true,
        remaining: user.subscription.interviewsRemaining,
      };
    }
    return {
      updated: false,
      remaining: user.subscription.interviewsRemaining,
    };
  } catch (err) {
    Logger.warn("Failed to consume interview quota", err);
    return { updated: false, remaining: 0 };
  }
}

/**
 * Helper to fetch remaining interviews (after opportunistic monthly reset).
 * @param {string} userId
 * @returns {Promise<number|null>} remaining or null for unlimited
 */
async function getRemaining(userId) {
  try {
    let user = await User.findById(userId);
    if (!user && userId) {
      // fallback: try legacy UserProfile by clerkUserId
      const legacy = await UserProfile.findOne({ userId: userId });
      if (legacy) user = legacy;
    }
    if (!user) return 0;
    await ensureMonthlyQuota(user);
    if (isUnlimited(user.subscription.plan)) return null;
    return user.subscription.interviewsRemaining;
  } catch (e) {
    Logger.warn("getRemaining failed", e);
    return 0;
  }
}

module.exports = { consumeFreeInterview, ensureMonthlyQuota, getRemaining };
