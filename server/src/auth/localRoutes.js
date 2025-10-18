const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile"); // Add at the top

// Logout route
router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session?.destroy(() => {
      res.clearCookie("connect.sid"); // or your session cookie name if different
      res.json({ success: true });
    });
  });
});
// Sign up route
router.post("/signup", async (req, res, next) => {
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

// Sign in route
router.post("/signin", (req, res, next) => {
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

// Get current user
router.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
