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
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL || "/api/session/auth/google/callback",
  SESSION_SECRET:
    process.env.SESSION_SECRET || "your-session-secret-change-in-production",
  RATE_LIMIT_WINDOW_MS:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@mockmate.com",
};

function validateEnv() {
  const errors = [];
  const warnings = [];

  // Critical checks for production
  if (ENV.NODE_ENV === "production") {
    if (!ENV.MONGODB_URI) {
      errors.push("MONGODB_URI is required in production");
    }
    if (!ENV.JWT_SECRET) {
      errors.push("JWT_SECRET is required in production");
    }
    if (
      !ENV.SESSION_SECRET ||
      ENV.SESSION_SECRET === "your-session-secret-change-in-production"
    ) {
      warnings.push("SESSION_SECRET should be changed in production");
    }

    // OAuth warnings
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
      warnings.push(
        "Google OAuth not configured - users won't be able to sign in with Google"
      );
    }

    // Email warnings
    if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS) {
      warnings.push(
        "Email not configured - password reset and verification emails will not work"
      );
    }
  } else {
    // Development checks
    if (!ENV.MONGODB_URI) {
      warnings.push("MONGODB_URI not set; continuing without DB connection");
    }
    if (!ENV.JWT_SECRET) {
      warnings.push(
        "JWT_SECRET not set; using default (change for production!)"
      );
      ENV.JWT_SECRET = "dev-secret-change-me-in-production";
    }
  }

  // Log errors and warnings
  if (errors.length > 0) {
    errors.forEach((err) => Logger.error(`❌ ENV ERROR: ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    warnings.forEach((warn) => Logger.warn(`⚠️  ENV WARNING: ${warn}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    Logger.success("✅ Environment configuration validated");
  }
}

module.exports = { ENV, validateEnv };
