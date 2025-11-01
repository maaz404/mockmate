const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Minimal user serialization to session
passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  });
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

function configurePassport() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL = "/api/session/auth/google/callback",
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn("Google OAuth not configured: missing client id/secret");
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Normalize user data
          const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value || null,
            name:
              profile.displayName ||
              `${profile.name?.givenName || ""} ${
                profile.name?.familyName || ""
              }`.trim(),
            avatar: profile.photos?.[0]?.value || null,
          };

          // Optionally: upsert into DB here to create/find user profile
          // Leaving DB persistence to routes to keep config minimal

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  return passport;
}

module.exports = { configurePassport, passport };
