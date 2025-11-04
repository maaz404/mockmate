const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Logger = require("../utils/logger");

console.log("🔧 Initializing Passport strategies...");

// Serialize user ID to session
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// Deserialize user from session by ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    Logger.error("Passport deserialize error:", error);
    done(error, null);
  }
});

function configurePassport() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL = "/api/session/auth/google/callback",
  } = process.env;

  console.log("📋 Google OAuth Configuration Check:");
  console.log(
    "  GOOGLE_CLIENT_ID:",
    GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "  GOOGLE_CLIENT_SECRET:",
    GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
  );
  console.log("  GOOGLE_CALLBACK_URL:", GOOGLE_CALLBACK_URL);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    Logger.warn("⚠️  Google OAuth not configured: missing client id/secret");
    console.log("❌ Google OAuth will NOT work - credentials missing!");
    return passport;
  }

  console.log("✅ Google OAuth credentials found - configuring strategy...");

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔵 Google Strategy callback triggered");
          console.log("📧 Google email:", profile.emails?.[0]?.value);

          // Extract user data from Google profile
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;

          // UPDATED: Better name extraction with fallback
          const name =
            profile.displayName ||
            `${profile.name?.givenName || ""} ${
              profile.name?.familyName || ""
            }`.trim() ||
            email?.split("@")[0] || // Use email prefix as fallback
            "User"; // Final fallback

          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            console.error("❌ No email found in Google profile");
            return done(new Error("No email found in Google profile"), null);
          }

          // Check if user exists by googleId first
          let user = await User.findOne({ googleId });

          if (!user) {
            // Check if user exists by email
            user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
              // Link Google account to existing email account
              console.log("🔗 Linking Google account to existing user:", email);
              user.googleId = googleId;
              user.isVerified = true;
              if (!user.name) user.name = name; // Add name if missing
              await user.save();
              Logger.info(`Linked Google account to existing user: ${email}`);
            } else {
              // Create new user
              console.log("➕ Creating new user from Google profile:", email);
              user = await User.create({
                email: email.toLowerCase(),
                name: name, // Now guaranteed to have a value
                googleId,
                isVerified: true,
                authProvider: "google", // ADD THIS if field exists
                password: Math.random().toString(36).slice(-12),
                subscription: {
                  plan: "free", // CHANGED: Use "free" instead of "premium"
                  status: "active",
                },
              });
              Logger.info(`Created new user via Google OAuth: ${email}`);

              // Create basic user profile
              try {
                await UserProfile.create({
                  user: user._id,
                  email: email.toLowerCase(),
                  firstName:
                    profile.name?.givenName || name.split(" ")[0] || "User",
                  lastName:
                    profile.name?.familyName ||
                    name.split(" ").slice(1).join(" ") ||
                    "",
                  profileImage: avatar,
                  onboardingCompleted: false,
                });
                console.log("✅ Created profile for new Google user");
                Logger.info(`Created profile for new Google user: ${email}`);
              } catch (profileError) {
                console.error(
                  "⚠️ Failed to create user profile:",
                  profileError
                );
                Logger.error("Failed to create user profile:", profileError);
              }
            }
          } else {
            console.log("✅ Existing Google user found:", email);
          }

          // Update last login
          await user.updateLastLogin();

          console.log("✅ Google OAuth successful for user:", user.email);
          return done(null, user);
        } catch (error) {
          console.error("❌ Google OAuth strategy error:", error);
          Logger.error("Google OAuth strategy error:", error);
          return done(error, null);
        }
      }
    )
  );

  Logger.success("✅ Google OAuth configured successfully");
  console.log("✅ Passport Google strategy registered");
  return passport;
}

console.log("✅ Passport module loaded");

module.exports = { configurePassport, passport };
