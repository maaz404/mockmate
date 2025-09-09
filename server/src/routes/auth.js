const express = require("express");
const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Register endpoint - Coming soon",
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Login endpoint - Coming soon",
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Get current user endpoint - Coming soon",
  });
});

module.exports = router;
