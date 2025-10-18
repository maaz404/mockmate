const express = require("express");
const passport = require("passport");
const router = express.Router();

// Google OAuth entry point
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: true }),
  (req, res) => {
    // Redirect to frontend dashboard after successful login
    res.redirect(process.env.CLIENT_URL + "/dashboard");
  }
);

module.exports = router;
