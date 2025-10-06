// Centralized subscription plan limits & metadata (server)
// Mirror changes to client/src/config/plans.js when updating.

const PLANS = Object.freeze({
  free: {
    key: "free",
    label: "Free",
    interviews: 5, // monthly quota
    unlimited: false,
    features: [
      "Core practice interviews",
      "Basic analytics",
      "Limited follow-up questions",
    ],
  },
  premium: {
    key: "premium",
    label: "Premium",
    interviews: null, // unlimited
    unlimited: true,
    features: [
      "Unlimited interviews",
      "Advanced analytics & reports",
      "Adaptive difficulty",
      "Video/facial analysis",
      "Priority AI generation",
    ],
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    interviews: null,
    unlimited: true,
    features: ["Everything in Premium", "Team collaboration", "Org analytics"],
  },
});

function getPlan(key) {
  return PLANS[key] || PLANS.free;
}

function isUnlimited(planKey) {
  const plan = getPlan(planKey);
  return !!plan.unlimited || plan.interviews == null;
}

function getMonthlyQuota(planKey) {
  const plan = getPlan(planKey);
  return plan.interviews == null ? Infinity : plan.interviews;
}

module.exports = { PLANS, getPlan, isUnlimited, getMonthlyQuota };
