const express = require("express");
const sessionRouter = express.Router();
const { passport } = require("../config/passport");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const { generateTokenPair } = require("../config/jwt");
const { ok, fail } = require("../utils/responder");
const Logger = require("../utils/logger");

console.log("📋 Session auth routes loaded");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Health check
sessionRouter.get("/health", (req, res) => {
  const strategies = passport._strategies
    ? Object.keys(passport._strategies)
    : [];
  ok(res, {
    status: "healthy",
    passport: !!passport,
    strategies,
    hasGoogleStrategy: strategies.includes("google"),
  });
});

// Test route
sessionRouter.get("/test", (req, res) => {
  ok(res, { message: "Session auth routes working" });
});

// Kick off Google OAuth
sessionRouter.get(
  "/auth/google",
  (req, res, next) => {
    console.log("🔵 /auth/google route hit - initiating Google OAuth");

    // Check if Google strategy exists
    if (!passport._strategies || !passport._strategies.google) {
      console.error("❌ Google strategy not found in passport");
      return res.redirect(`${CLIENT_URL}/login?error=oauth_not_configured`);
    }

    console.log("✅ Google strategy found, authenticating...");
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
  })
);

// Google OAuth callback
sessionRouter.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log("🔵 /auth/google/callback route hit");
    next();
  },
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login?error=oauth_failed`,
    session: true,
  }),
  async (req, res) => {
    try {
      console.log("✅ Google OAuth callback - authentication successful");

      // req.user is now a full User document from passport
      const user = req.user;

      if (!user || !user._id) {
        console.error("❌ No user in req.user after authentication");
        Logger.error("OAuth callback: No user in req.user");
        return res.redirect(`${CLIENT_URL}/login?error=no_user`);
      }

      console.log("✅ User authenticated:", user.email);

      // Generate JWT tokens for the user
      const { accessToken, refreshToken } = generateTokenPair(user);
      console.log("✅ JWT tokens generated");

      // Find or create user profile
      let profile = await UserProfile.findOne({ user: user._id });

      if (!profile) {
        console.log("➕ Creating new profile for user");
        try {
          // Create new profile with proper structure
          profile = await UserProfile.create({
            user: user._id,
            email: user.email,
            firstName: user.name?.split(" ")[0] || "User",
            lastName: user.name?.split(" ").slice(1).join(" ") || "",
            profileImage: user.picture || "",
            onboardingCompleted: false,
            lastLoginAt: new Date(),
          });
          console.log("✅ Profile created successfully");
          Logger.info(`Created profile for Google OAuth user: ${user.email}`);
        } catch (profileError) {
          console.error("❌ Profile creation failed:", profileError);
          Logger.error("Profile creation error:", profileError);
          // Continue anyway - user is authenticated, profile can be created later
        }
      } else {
        console.log("✅ Existing profile found");
        // Update last login
        profile.lastLoginAt = new Date();
        await profile.save();
      }

      // Redirect to client with JWT tokens in query params
      const redirectUrl = `${CLIENT_URL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`;

      console.log("🔄 Redirecting to:", redirectUrl);
      console.log(
        "📋 Access Token (first 20 chars):",
        accessToken.substring(0, 20) + "..."
      );
      console.log(
        "📋 Refresh Token (first 20 chars):",
        refreshToken.substring(0, 20) + "..."
      );

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      console.error("Error stack:", error.stack);
      Logger.error("OAuth callback error:", error);
      // Use CLIENT_URL for error redirect
      return res.redirect(`${CLIENT_URL}/login?error=callback_error`);
    }
  }
);

// Current session info (for session-based auth)
sessionRouter.get("/me", (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return ok(res, { user: null, authenticated: false });
  }

  // Return user info without password
  const userInfo = {
    id: req.user._id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    isVerified: req.user.isVerified,
  };

  return ok(res, { user: userInfo, authenticated: true });
});

// Logout (destroys session)
sessionRouter.post("/logout", (req, res, next) => {
  if (!req.isAuthenticated?.()) {
    return ok(res, { loggedOut: true });
  }

  req.logout(function (err) {
    if (err) {
      Logger.error("Logout error:", err);
      return next(err);
    }

    req.session?.destroy?.((destroyErr) => {
      if (destroyErr) {
        Logger.error("Session destroy error:", destroyErr);
      }
    });

    return ok(res, { loggedOut: true });
  });
});

console.log("✅ Session auth routes configured");

module.exports = sessionRouter;
