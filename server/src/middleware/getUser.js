const { verifyAccess } = require("../utils/jwt");
const User = require("../models/User");

module.exports = async function getUser(req, _res, next) {
  try {
    const header = req.get("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    const payload = verifyAccess(token);
    const user = await User.findById(payload.sub).lean();
    if (user)
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };
    next();
  } catch {
    next();
  }
};
