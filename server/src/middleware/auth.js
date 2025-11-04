const { verifyToken } = require("../config/jwt");
const User = require("../models/User");
const Logger = require("../utils/logger");

const requireAuth = async (req, res, next) => {
  try {
    const header = req.get("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    // Dev fallback (optional)
    if (
      !token &&
      process.env.NODE_ENV !== "production" &&
      process.env.MOCK_AUTH_FALLBACK === "true"
    ) {
      req.user = {
        id: "000000000000000000000001",
        email: "dev@example.com",
        role: "user",
      };
      return next();
    }

    if (!token) {
      return res
        .status(401)
        .json({ code: "UNAUTHENTICATED", message: "Missing token" });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.id).lean();
    if (!user)
      return res
        .status(401)
        .json({ code: "UNAUTHENTICATED", message: "User not found" });

    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    return next();
  } catch (err) {
    Logger?.error?.("Authentication error", { message: err.message });
    return res
      .status(401)
      .json({ code: "UNAUTHENTICATED", message: "Invalid or expired token" });
  }
};

module.exports = requireAuth;
