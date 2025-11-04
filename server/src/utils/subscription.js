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
    const { plan, nextResetDate } = profile.subscription;
    if (isUnlimited(plan)) return false; // unlimited plans don't reset

    const now = new Date();
    let shouldReset = false;
    if (!nextResetDate) shouldReset = true;
    else if (new Date(nextResetDate) <= now) shouldReset = true;

    if (!shouldReset) return false;
    const quota = getMonthlyQuota(plan);
    profile.subscription.interviewsRemaining =
      quota === Infinity ? null : quota;
    // Set next reset ~30 days from now (simplistic rolling window)
    const DAYS_IN_CYCLE = 30; // eslint-disable-line no-magic-numbers
    const HOURS_PER_DAY = 24; // eslint-disable-line no-magic-numbers
    const MINUTES_PER_HOUR = 60; // eslint-disable-line no-magic-numbers
    const SECONDS_PER_MINUTE = 60; // eslint-disable-line no-magic-numbers
    const MS_PER_SECOND = 1000; // eslint-disable-line no-magic-numbers
    const next = new Date(
      now.getTime() +
        DAYS_IN_CYCLE *
          HOURS_PER_DAY *
          MINUTES_PER_HOUR *
          SECONDS_PER_MINUTE *
          MS_PER_SECOND
    );
    profile.subscription.nextResetDate = next;
    await profile.save();
    return true;
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

    const { plan } = profile.subscription;
    if (isUnlimited(plan)) {
      return { updated: false, remaining: null };
    }

    // Idempotency guard
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
    return {
      updated: false,
      remaining: profile.subscription.interviewsRemaining,
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
    return profile.subscription.interviewsRemaining;
  } catch (e) {
    Logger.warn("getRemaining failed", e);
    return 0;
  }
}

module.exports = { consumeFreeInterview, ensureMonthlyQuota, getRemaining };
