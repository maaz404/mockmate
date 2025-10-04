// Simple in-memory dashboard cache with 30s TTL
// Structure: { metrics, recommendation, horizon, ts }
const DASHBOARD_CACHE = {
  metrics: null,
  recommendation: null,
  horizon: null,
  ts: 0,
};

export function getDashboardCache() {
  return DASHBOARD_CACHE;
}

export function setDashboardCache({ metrics, recommendation, horizon }) {
  DASHBOARD_CACHE.metrics = metrics;
  DASHBOARD_CACHE.recommendation = recommendation;
  DASHBOARD_CACHE.horizon = horizon;
  DASHBOARD_CACHE.ts = Date.now();
}

export function isDashboardCacheFresh(horizon, ttlMs = 30000) {
  if (!DASHBOARD_CACHE.ts) return false;
  if (DASHBOARD_CACHE.horizon !== horizon) return false;
  return Date.now() - DASHBOARD_CACHE.ts < ttlMs;
}
