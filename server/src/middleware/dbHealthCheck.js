const mongoose = require("mongoose");
const Logger = require("../utils/logger");

// MongoDB connection states
const DB_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
};

const HTTP_SERVICE_UNAVAILABLE = 503;
const HTTP_INTERNAL_ERROR = 500;

/**
 * Enhanced database health check middleware
 * Provides detailed connection status and automatic recovery
 */
const dbHealthCheck = async (req, res, next) => {
  try {
    const readyState = mongoose.connection.readyState;

    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    switch (readyState) {
      case DB_STATES.DISCONNECTED: // disconnected
        Logger.warn("Database disconnected, attempting reconnection...");
        return res.status(HTTP_SERVICE_UNAVAILABLE).json({
          success: false,
          error: "DATABASE_DISCONNECTED",
          message: "Database connection lost. Please try again.",
          requestId: req.requestId,
        });

      case DB_STATES.CONNECTING: // connecting
        Logger.info("Database connecting, please wait...");
        return res.status(HTTP_SERVICE_UNAVAILABLE).json({
          success: false,
          error: "DATABASE_CONNECTING",
          message: "Database is connecting. Please retry in a moment.",
          requestId: req.requestId,
        });

      case DB_STATES.DISCONNECTING: // disconnecting
        Logger.warn("Database disconnecting...");
        return res.status(HTTP_SERVICE_UNAVAILABLE).json({
          success: false,
          error: "DATABASE_DISCONNECTING",
          message: "Database is disconnecting. Please retry in a moment.",
          requestId: req.requestId,
        });

      case DB_STATES.CONNECTED: // connected
        // Perform a quick ping test to ensure the connection is actually working
        try {
          await mongoose.connection.db.admin().ping();
          return next();
        } catch (pingError) {
          Logger.error("Database ping failed:", pingError.message);
          return res.status(HTTP_SERVICE_UNAVAILABLE).json({
            success: false,
            error: "DATABASE_PING_FAILED",
            message: "Database connection appears broken. Please try again.",
            requestId: req.requestId,
          });
        }

      default:
        Logger.warn(`Unknown database ready state: ${readyState}`);
        return res.status(HTTP_SERVICE_UNAVAILABLE).json({
          success: false,
          error: "DATABASE_UNKNOWN_STATE",
          message: "Database in unknown state. Please try again.",
          requestId: req.requestId,
        });
    }
  } catch (error) {
    Logger.error("Database health check error:", error.message);
    return res.status(HTTP_INTERNAL_ERROR).json({
      success: false,
      error: "HEALTH_CHECK_FAILED",
      message: "Failed to check database health.",
      requestId: req.requestId,
    });
  }
};

module.exports = dbHealthCheck;
