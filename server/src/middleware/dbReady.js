const { isDbConnected } = require("../config/database");
const C = require("../utils/constants");

/**
 * Middleware to ensure DB is connected before handling DB-backed routes.
 * If INMEMORY_FALLBACK=true and not in production, attaches req.useInMemory=true
 * so downstream handlers can route to an in-memory store instead.
 */
module.exports = function dbReady(req, res, next) {
  try {
    const connected = isDbConnected ? isDbConnected() : false;
    const allowFallback =
      process.env.INMEMORY_FALLBACK === "true" &&
      process.env.NODE_ENV !== "production";

    if (!connected) {
      if (allowFallback) {
        req.useInMemory = true;
        return next();
      }
      return res.status(C.HTTP_STATUS_SERVICE_UNAVAILABLE).json({
        success: false,
        message:
          "Database is not connected. Start MongoDB or enable INMEMORY_FALLBACK for dev.",
      });
    }
    return next();
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err?.message || String(err) });
  }
};
