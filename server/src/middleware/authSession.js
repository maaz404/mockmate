module.exports = function requireSessionAuth(req, res, next) {
  // In dev, allow mock fallback
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.MOCK_AUTH_FALLBACK === "true"
  ) {
    if (!req.user) {
      req.user = {
        id: "dev-user-123",
        email: "dev@example.com",
        name: "Dev User",
      };
    }
    req.auth = { userId: req.user.id, id: req.user.id };
    return next();
  }

  if (req.isAuthenticated && req.isAuthenticated()) {
    req.auth = { userId: req.user.id, id: req.user.id };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: "UNAUTHORIZED",
    message: "Authentication required",
  });
};
