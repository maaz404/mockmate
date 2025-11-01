const express = require("express");
const sessionRouter = express.Router();
const { passport } = require("../config/passport");
const UserProfile = require("../models/UserProfile");
const { ok } = require("../utils/responder");

// Kick off Google OAuth
sessionRouter.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
sessionRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const { id, email, name, avatar } = req.user || {};
      if (!id) {
        return res.redirect("/login?error=oauth_failed");
      }

      // Upsert user profile with compatibility: store under clerkUserId field as well for now
      let profile = await UserProfile.findOne({
        $or: [{ userId: id }, { clerkUserId: id }],
      });
      const names = (name || "").split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";
      const base = {
        userId: id,
        clerkUserId: id, // temporary compatibility field
        email: email || profile?.email || "",
        firstName: firstName || profile?.firstName || "",
        lastName: lastName || profile?.lastName || "",
        profileImage: avatar || profile?.profileImage || "",
        lastLoginAt: new Date(),
      };
      if (profile) {
        profile.set(base);
        await profile.save();
      } else {
        profile = await UserProfile.create(base);
      }

      // Redirect to app dashboard
      return res.redirect("/dashboard");
    } catch (e) {
      return res.redirect("/login?error=profile_upsert_failed");
    }
  }
);

// Current session info
sessionRouter.get("/me", (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return ok(res, { user: null, authenticated: false });
  }
  return ok(res, { user: req.user, authenticated: true });
});

// Logout
sessionRouter.post("/logout", (req, res, next) => {
  if (!req.isAuthenticated?.()) {
    return ok(res, { loggedOut: true });
  }
  req.logout(function (err) {
    if (err) return next(err);
    req.session?.destroy?.(() => {});
    return ok(res, { loggedOut: true });
  });
});

module.exports = sessionRouter;
