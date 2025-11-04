const Logger = require("./logger");

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map();

/**
 * Simple in-memory rate limiter
 * @param {string} identifier - User ID or IP address
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
 */
function checkRateLimit(identifier, maxRequests = 100, windowMs = 900000) {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  if (record.count >= maxRequests) {
    Logger.warn(`Rate limit exceeded for ${identifier}`);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.resetAt),
    };
  }

  record.count++;
  requestCounts.set(identifier, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: new Date(record.resetAt),
  };
}

/**
 * Clear rate limit for identifier (useful for testing or manual resets)
 * @param {string} identifier
 */
function clearRateLimit(identifier) {
  requestCounts.delete(identifier);
  Logger.info(`Rate limit cleared for ${identifier}`);
}

/**
 * Cleanup expired entries (call periodically)
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  let cleaned = 0;

  for (const [identifier, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(identifier);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    Logger.debug(`Cleaned ${cleaned} expired rate limit entries`);
  }
}

// Cleanup every 5 minutes
const FIVE_MINUTES_MS = 300000;
setInterval(cleanupExpiredEntries, FIVE_MINUTES_MS);

module.exports = {
  checkRateLimit,
  clearRateLimit,
  cleanupExpiredEntries,
};
