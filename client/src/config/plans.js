// Centralized subscription plan limits & metadata (client)
// Keep in sync with server/src/config/plans.js

export const PLANS = Object.freeze({
  free: {
    key: "free",
    label: "Free",
    interviews: 5,
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
    interviews: null,
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

export function getPlan(key) {
  return PLANS[key] || PLANS.free;
}

export function isUnlimited(planKey) {
  const plan = getPlan(planKey);
  return !!plan.unlimited || plan.interviews == null;
}

export function getMonthlyQuota(planKey) {
  const plan = getPlan(planKey);
  return plan.interviews == null ? Infinity : plan.interviews;
}
