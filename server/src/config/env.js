const Logger = require("../utils/logger");

function parseArrayEnv(val, defaults = []) {
  if (!val) return defaults;
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  CORS_ORIGINS: parseArrayEnv(process.env.CORS_ORIGINS, [
    "http://localhost:3000",
    "http://localhost:3001",
  ]),
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
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
    if (!ENV.CLERK_SECRET_KEY) {
      Logger.warn(
        "CLERK_SECRET_KEY not set; authentication will fail in production"
      );
    }
  } else {
    if (!ENV.MONGODB_URI) {
      Logger.warn(
        "MONGODB_URI not set; continuing in development without DB connection"
      );
    }
  }
}

module.exports = { ENV, validateEnv };
