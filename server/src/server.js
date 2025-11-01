const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
// Load environment variables BEFORE loading config/env so ENV gets real values
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { configurePassport, passport } = require("./config/passport");
const connectDB = require("./config/database");
const Logger = require("./utils/logger");
const { ENV, validateEnv } = require("./config/env");
// Validate env after loading
if (process.env.NODE_ENV !== "test") {
  validateEnv();
}

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const interviewRoutes = require("./routes/interview");
const questionRoutes = require("./routes/question");
const reportRoutes = require("./routes/report");
const videoRoutes = require("./routes/video");
const codingRoutes = require("./routes/coding");
const chatbotRoutes = require("./routes/chatbot");
const healthRoutes = require("./routes/health");
const uploadRoutes = require("./routes/uploads");
const interviewMediaRoutes = require("./routes/interviewMedia");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

// Create Express app
const app = express();
// Early middleware: request id before anything else that may log
const requestId = require("./middleware/requestId");
app.use(requestId);
// Response time + structured log middleware (lightweight)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    try {
      const end = process.hrtime.bigint();
      // eslint-disable-next-line no-magic-numbers
      const ms = Number(end - start) / 1e6;
      // Skip noisy health & metrics high-frequency endpoints logging at info
      const skip =
        /\/api\/(health|bootstrap)/.test(req.path) && res.statusCode < 400;
      if (!skip) {
        // eslint-disable-next-line no-console
        console.log(
          JSON.stringify({
            ts: new Date().toISOString(),
            level:
              res.statusCode >= 500
                ? "error"
                : res.statusCode >= 400
                ? "warn"
                : "info",
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            // eslint-disable-next-line no-magic-numbers
            durationMs: ms.toFixed(2),
          })
        );
      }
    } catch (_) {
      /* ignore */
    }
  });
  next();
});

// Set trust proxy for proper IP detection
app.set("trust proxy", 1);

// Connect to database (await before starting server to ensure persistence layer ready)
// In test env we let tests control lifecycle; they import app without awaiting network listener.
const dbReadyPromise = connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
// Default rate-limit window (ms)
// eslint-disable-next-line no-magic-numbers
const SECOND_MS = 1000;
// eslint-disable-next-line no-magic-numbers
const MINUTE_MS = 60 * SECOND_MS;
// eslint-disable-next-line no-magic-numbers
const FIFTEEN_MINUTES_MS = 15 * MINUTE_MS;
const DEFAULT_MAX_REQUESTS = 100;
const limiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || FIFTEEN_MINUTES_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS || DEFAULT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration (dynamic) -------------------------------------------------
// Goal: eliminate local dev friction (CORS errors) while keeping production strict.
// Strategy:
//  - Production: only explicit ENV.CORS_ORIGINS list.
//  - Dev/Test: auto-allow localhost + loopback + (optionally private LAN when ALLOW_LAN_CORS=true) plus ENV list.
//  - Always allow requests with no Origin (curl, server internal calls).
//  - Allow custom dev headers used for mock auth / profile hydration.
//  - Provide verbose one-time logging & per-block logs with hint.
const LOCAL_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const LAN_REGEX =
  /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i; // RFC1918 ranges
const allowLan = process.env.ALLOW_LAN_CORS === "true";
const allowedSet = new Set(ENV.CORS_ORIGINS.filter(Boolean));
// Core headers the frontend actually sends (Axios + our custom ones)
const CORE_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
  "Origin",
  // Custom user metadata headers (dev)
  "x-user-email",
  "x-user-firstname",
  "x-user-lastname",
  "x-user-id",
  // Allow client to send trace/request correlation if desired
  "x-request-id",
];
if (!global.__CORS_LOGGED) {
  // eslint-disable-next-line no-console
  console.log("CORS base allowlist (env):", Array.from(allowedSet));
  // eslint-disable-next-line no-console
  console.log(
    `CORS dev patterns: localhost/loopback always allowed${
      allowLan ? ", plus private LAN ranges" : ""
    }`
  );
  // eslint-disable-next-line no-console
  console.log("CORS allowed headers:", CORE_ALLOWED_HEADERS);
  global.__CORS_LOGGED = true;
}

// (Reserved hook for future response diagnostics; currently no-op)
app.use((req, _res, next) => next());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin or server-to-server
      const isExplicit = allowedSet.has(origin);
      const isLocalDev =
        ENV.NODE_ENV !== "production" && LOCAL_REGEX.test(origin);
      const isLanDev =
        ENV.NODE_ENV !== "production" && allowLan && LAN_REGEX.test(origin);
      if (isExplicit || isLocalDev || isLanDev) return cb(null, true);
      // eslint-disable-next-line no-console
      console.warn("CORS blocked origin:", origin, {
        hint: "Add to CORS_ORIGINS env or set ALLOW_LAN_CORS=true for private network in dev",
      });
      return cb(new Error("CORS_NOT_ALLOWED"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: CORE_ALLOWED_HEADERS,
    maxAge: 86400, // cache preflight for a day in browsers that honor it
    optionsSuccessStatus: 200,
  })
);

// Fallback handler to convert a CORS_NOT_ALLOWED error into JSON (so client gets structured info in dev)
app.use((err, req, res, next) => {
  if (err && err.message === "CORS_NOT_ALLOWED") {
    // Deliberately DO NOT set Access-Control-Allow-Origin so browser still blocks, but we log meaningfully.
    if (!res.headersSent) {
      return res.status(403).json({
        success: false,
        code: "CORS_NOT_ALLOWED",
        message: "Origin not permitted by CORS policy",
        origin: req.headers.origin,
        allowed: Array.from(allowedSet),
        allowLan,
        environment: ENV.NODE_ENV,
      });
    }
  }
  return next(err);
});

// Compression (disable for SSE endpoints like /api/chatbot/stream to avoid breaking event stream)
app.use(
  compression({
    filter: (req, res) => {
      if (req.path && req.path.startsWith("/api/chatbot/stream")) {
        return false; // disable compression for SSE
      }
      return compression.filter(req, res);
    },
  })
);

// Logging (attach request id token to morgan output)
const morganFormat =
  process.env.NODE_ENV === "development" ? "dev" : "combined";
app.use(
  morgan(morganFormat, {
    stream: { write: (str) => process.stdout.write(str) },
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sessions & Passport (Google OAuth)
app.use(cookieParser());
const SESSION_SECRET =
  process.env.SESSION_SECRET || "dev_session_secret_change_me";
// Session cookie lifetime helpers
const MS_IN_SECOND = 1000; // eslint-disable-line no-magic-numbers
const SECONDS_IN_MINUTE = 60; // eslint-disable-line no-magic-numbers
const MINUTES_IN_HOUR = 60; // eslint-disable-line no-magic-numbers
const HOURS_IN_DAY = 24; // eslint-disable-line no-magic-numbers
const DAYS = 7; // eslint-disable-line no-magic-numbers
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      maxAge:
        MS_IN_SECOND *
        SECONDS_IN_MINUTE *
        MINUTES_IN_HOUR *
        HOURS_IN_DAY *
        DAYS,
    },
  })
);
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Health check route (before Clerk middleware)
const { isDbConnected } = require("./config/database");
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "MockMate API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ok: typeof isDbConnected === "function" ? isDbConnected() : true,
  });
});
// Additional health diagnostics
app.use("/api/health", healthRoutes);

// Environment / readiness endpoint
app.get("/api/system/readiness", (req, res) => {
  const cloudinaryReady = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  const openAiReady = !!process.env.OPENAI_API_KEY;
  const dbReady = typeof isDbConnected === "function" ? isDbConnected() : true;
  const warnings = [];
  if (!cloudinaryReady) warnings.push("Cloudinary not configured");
  if (!openAiReady) warnings.push("OpenAI not configured");
  return res.status(200).json({
    success: true,
    ready: cloudinaryReady && openAiReady && dbReady,
    services: {
      cloudinary: {
        ready: cloudinaryReady,
        reason: cloudinaryReady ? undefined : "Cloudinary not configured",
      },
      openAI: {
        ready: openAiReady,
        reason: openAiReady ? undefined : "OpenAI not configured",
      },
      database: {
        ready: dbReady,
        reason: dbReady ? undefined : "Database not connected",
      },
    },
    warnings,
    timestamp: new Date().toISOString(),
  });
});

// Public routes that don't need authentication
app.get("/favicon.ico", (req, res) => {
  const NO_CONTENT = 204;
  return res.status(NO_CONTENT).end();
});

// Handle webpack hot reload files and other static files
app.get("/*.js", (req, res) => {
  res.status(404).json({ message: "Not found" });
});
app.get("/*.json", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

// REMOVED: Clerk middleware - now using session-based authentication
// Session auth is configured via express-session + passport earlier in the middleware stack

// API routes
const sessionAuthRoutes = require("./routes/sessionAuth");
app.use("/api/session", sessionAuthRoutes);
app.use("/api/auth", authRoutes); // Legacy Clerk routes - can be removed
app.use("/api/users", userRoutes);
// Lightweight bootstrap route (auth + profile + analytics) placed near user routes for discoverability
app.get("/api/bootstrap", async (req, res) => {
  // In dev mock mode allow unauth to still get a stub
  try {
    const usingMock =
      process.env.NODE_ENV !== "production" &&
      process.env.MOCK_AUTH_FALLBACK === "true";
    const authCtx = req.auth || {};
    let userId = authCtx.userId || authCtx.id;
    if (!userId && usingMock) {
      // Allow header override in mock mode (tests pass x-user-id)
      const headerUser = req.headers["x-user-id"];
      if (headerUser) userId = headerUser;
    }
    const { ok, fail } = require("./utils/responder");
    if (!userId && !usingMock) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const UserProfile = require("./models/UserProfile");
    let profile = null;
    if (userId) {
      try {
        profile = await UserProfile.findOne({ clerkUserId: userId }).lean();
      } catch (dbErr) {
        // Non-fatal for bootstrap; continue with stubbed analytics
        if (process.env.NODE_ENV === "development") {
          req.log &&
            req.log("warn", "Bootstrap DB fetch failed", {
              detail: dbErr.message,
            });
        }
      }
    }
    if (!profile && usingMock && userId) {
      const wantPremium = req.headers["x-test-premium"] === "true";
      const defaultSub = wantPremium
        ? { plan: "premium", interviewsRemaining: null }
        : { plan: "free", interviewsRemaining: 10 };
      profile = {
        clerkUserId: userId,
        email: `${userId}@dev.local`,
        firstName: "Test",
        lastName: "User",
        onboardingCompleted: false,
        analytics: { averageScore: 0 },
        subscription: defaultSub,
      };
    }
    const analyticsData = profile ? profile.analytics || {} : {};
    const subscription = profile ? profile.subscription || null : null;
    const payload = {
      auth: userId ? { userId } : null,
      profile,
      analytics: { ...analyticsData, subscription },
      subscription, // duplicated at root for simpler client consumption
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      dbConnected: require("./config/database").isDbConnected(),
    };
    return ok(res, payload);
  } catch (e) {
    const { fail } = require("./utils/responder");
    const meta = { detail: e.message };
    if (e.stack) {
      const STACK_LINES = 5; // eslint-disable-line no-magic-numbers
      meta.stack = e.stack.split("\n").slice(0, STACK_LINES).join("\n");
    }
    return fail(
      res,
      500,
      "BOOTSTRAP_FAILED",
      "Failed to load bootstrap data",
      process.env.NODE_ENV !== "production" ? meta : undefined
    );
  }
});
// Dev-only self-upgrade endpoint (premium) - not mounted in production
app.post("/api/dev/upgrade-self", async (req, res) => {
  const { ok, fail } = require("./utils/responder");
  try {
    if (process.env.NODE_ENV === "production") {
      return fail(res, 403, "FORBIDDEN", "Not available in production");
    }
    // Accept either real Clerk auth or mock fallback
    const authCtx = req.auth || {};
    const usingMock = process.env.MOCK_AUTH_FALLBACK === "true";
    const userId = authCtx.userId || (usingMock ? "test-user-123" : null);
    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const UserProfile = require("./models/UserProfile");
    let profile = await UserProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      // Create minimal profile if missing
      const email = req.headers["x-user-email"] || `${userId}@dev.local`;
      profile = await UserProfile.create({
        clerkUserId: userId,
        email,
        firstName: req.headers["x-user-firstname"] || "Dev",
        lastName: req.headers["x-user-lastname"] || "User",
        onboardingCompleted: true,
      });
    }
    const { getPlan, isUnlimited } = require("./config/plans");
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // eslint-disable-line no-magic-numbers
    const premium = getPlan("premium");
    profile.subscription = {
      plan: premium.key,
      interviewsRemaining: isUnlimited(premium.key) ? null : premium.interviews,
      nextResetDate: new Date(Date.now() + THIRTY_DAYS_MS),
    };
    await profile.save();
    return ok(res, {
      subscription: profile.subscription,
      clerkUserId: profile.clerkUserId,
    });
  } catch (e) {
    return fail(res, 500, "UPGRADE_FAILED", "Failed to upgrade", {
      detail: e.message,
    });
  }
});
app.use("/api/interviews", interviewRoutes);
app.use("/api/interviews", interviewMediaRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/uploads", uploadRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const DEFAULT_PORT = 5000;
const PORT = ENV.PORT || DEFAULT_PORT;
let server;

function startServer(port) {
  try {
    server = app
      .listen(port, () => {
        Logger.info(
          `🚀 MockMate server is running on port ${port} in ${process.env.NODE_ENV} mode`
        );
        Logger.info(
          `🔐 Clerk authentication is ${
            ENV.CLERK_SECRET_KEY ? "configured" : "NOT configured"
          }`
        );
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          const nextPort = port + 1;
          Logger.warn(
            `Port ${port} is in use. Attempting to use port ${nextPort}...`
          );
          startServer(nextPort);
        } else {
          Logger.error("Server failed to start:", err);
          process.exit(1);
        }
      });
  } catch (err) {
    Logger.error("Unexpected error while starting server:", err);
    process.exit(1);
  }
}

// Defer server start until DB connection attempt resolves (success or handled failure) to reduce 503 races
if (process.env.NODE_ENV !== "test") {
  Promise.resolve(dbReadyPromise)
    .catch(() => {
      /* connection errors already logged */
    })
    .finally(() => startServer(PORT));
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, _promise) => {
  Logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  Logger.error(`Uncaught Exception: ${err.message}`);
  Logger.error("Shutting down the server due to Uncaught Exception");
  process.exit(1);
});

module.exports = app;
