const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const { forgotPassword, resetPassword, getMeJWT } = require("../controllers/authController");
const { protectJWT } = require("../middleware/auth");

// Rate limiters for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: "Too many password reset requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Generous limit for authenticated endpoints
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Logout route
router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session?.destroy(() => {
      res.clearCookie("connect.sid"); // or your session cookie name if different
      res.json({ success: true });
    });
  });
});

// Sign up route (rate limited)
router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      authProvider: "local",
    });
    await user.save();
    await UserProfile.create({
      userId: user._id,
      email: user.email,
      firstName,
      lastName,
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json({
        message: "User registered successfully.",
        user: { email: user.email, firstName, lastName },
      });
    });
  } catch (err) {
    next(err);
  }
});

// Sign in route (rate limited)
router.post("/signin", authLimiter, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({
        success: false,
        message: info.message || "Invalid credentials",
      });
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ success: true, user });
    });
  })(req, res, next);
});

// Get current user (session-based)
router.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Forgot password (strict rate limiting)
router.post("/forgot-password", passwordResetLimiter, forgotPassword);

// Reset password (rate limited)
router.put("/reset-password/:token", authLimiter, resetPassword);

// Get current user (JWT-based) - for mobile apps or JWT-only clients
router.get("/me-jwt", generalApiLimiter, protectJWT, getMeJWT);

module.exports = router;
