const jwt = require("jsonwebtoken");
const { ENV } = require("./env");
const Logger = require("../utils/logger");

/**
 * Generate JWT access token
 * @param {Object} payload - User data to encode
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
function generateAccessToken(payload) {
  const { id, email, role } = payload;

  return jwt.sign({ id, email, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
    issuer: "mockmate-api",
    audience: "mockmate-client",
  });
}

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to encode
 * @param {string} payload.id - User ID
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  const { id } = payload;

  return jwt.sign({ id, type: "refresh" }, ENV.JWT_SECRET, {
    expiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN,
    issuer: "mockmate-api",
    audience: "mockmate-client",
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, ENV.JWT_SECRET, {
      issuer: "mockmate-api",
      audience: "mockmate-client",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
}

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
function generateTokenPair(user) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: user._id.toString() }),
    expiresIn: ENV.JWT_EXPIRES_IN,
  };
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    Logger.error("Failed to decode token:", error);
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokenPair,
  decodeToken,
};
