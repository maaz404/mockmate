const Logger = require("../utils/logger");

function parseArrayEnv(val, defaults = []) {
  if (!val) return defaults;
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// OPTIMIZATION: Define constants for magic numbers
const DEFAULT_PORT = 5000;
const PARSE_RADIX = 10;

const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, PARSE_RADIX) || DEFAULT_PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:5000",
  CORS_ORIGINS: parseArrayEnv(process.env.CORS_ORIGINS, [
    "http://localhost:3000",
    "http://localhost:3001",
  ]),
  // Google OAuth configuration (migrated from Clerk)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  // Legacy fallback for development
  MOCK_AUTH_FALLBACK: process.env.MOCK_AUTH_FALLBACK === "true",
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10),
};

function validateEnv() {
  if (ENV.NODE_ENV === "production") {
    if (!ENV.MONGODB_URI) {
      Logger.error("MONGODB_URI is required in production");
      process.exit(1);
    }
    // MIGRATION: Validate Google OAuth credentials instead of Clerk
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
      Logger.error(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for authentication in production"
      );
      process.exit(1);
    }
    if (!ENV.SESSION_SECRET) {
      Logger.error("SESSION_SECRET is required in production");
      process.exit(1);
    }
  } else {
    if (!ENV.MONGODB_URI) {
      Logger.warn(
        "MONGODB_URI not set; continuing in development without DB connection"
      );
    }
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
      Logger.warn(
        "Google OAuth credentials not set; authentication may not work properly"
      );
    }
    if (!ENV.SESSION_SECRET) {
      Logger.warn(
        "SESSION_SECRET not set; using default (insecure for production)"
      );
    }
  }
}

module.exports = { ENV, validateEnv };
