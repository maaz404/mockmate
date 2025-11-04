const crypto = require("crypto");

/**
 * Generate a random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} Hex-encoded token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate verification token with expiry
 * @returns {Object} { token: string, expires: Date }
 */
function generateVerificationToken() {
  const ONE_HOUR_MS = 3600000;
  return {
    token: generateToken(),
    expires: new Date(Date.now() + ONE_HOUR_MS),
  };
}

/**
 * Generate password reset token with expiry
 * @returns {Object} { token: string, expires: Date }
 */
function generatePasswordResetToken() {
  const ONE_HOUR_MS = 3600000;
  return {
    token: generateToken(),
    expires: new Date(Date.now() + ONE_HOUR_MS),
  };
}

/**
 * Hash token for storage (use with sensitive tokens)
 * @param {string} token
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  generateToken,
  generateVerificationToken,
  generatePasswordResetToken,
  hashToken,
};
