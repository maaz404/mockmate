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
const sessionAuthRoutes = require("./routes/sessionAuth"); // ADD THIS LINE

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const requireAuth = require("./middleware/auth");

// Create Express app
const app = express();

// Early middleware: request id before anything else that may log
const requestId = require("./middleware/requestId");
app.use(requestId);

// Disable ETag generation to avoid 304 Not Modified responses on dynamic JSON
app.set("etag", false);

// Response time + structured log middleware (lightweight)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    try {
      const end = process.hrtime.bigint();
      const NANOS_PER_MS = 1_000_000; // 1e6
      const durationMsNum = Number(end - start) / NANOS_PER_MS;
      const HUNDRED = 100;
      const durationMs = Number.isFinite(durationMsNum)
        ? Math.round(durationMsNum * HUNDRED) / HUNDRED // two decimals
        : null;
      const skip =
        /\/api\/(health|bootstrap)/.test(req.path) && res.statusCode < 400;
      if (!skip && process.env.REQUEST_LOGS !== "off") {
        const payload = {
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
          durationMs,
        };
        if (process.env.REQUEST_LOGS === "json") {
          Logger.info(JSON.stringify(payload));
        } else if (process.env.REQUEST_LOGS === "minimal") {
          Logger.info(
            `${payload.method} ${payload.path} ${payload.status} ${durationMs}ms`()
          );
        } else {
          Logger.info(
            `${payload.method} ${payload.path} status=${payload.status} duration=${durationMs}ms id=${payload.requestId}`
          );
        }
      }
    } catch (_) {
      /* ignore */
    }
  });
  next();
});

// Set trust proxy for proper IP detection
app.set("trust proxy", 1);

// Connect to database
const dbReadyPromise = connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_FIFTEEN = 15;
const MINUTE_MS = SECONDS_PER_MINUTE * SECOND_MS;
const FIFTEEN_MINUTES_MS = MINUTES_PER_FIFTEEN * MINUTE_MS;
const DEFAULT_MAX_REQUESTS = 100;

const limiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || FIFTEEN_MINUTES_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS || DEFAULT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
const LOCAL_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const LAN_REGEX =
  /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;
const allowLan = process.env.ALLOW_LAN_CORS === "true";
const allowedSet = new Set(ENV.CORS_ORIGINS.filter(Boolean));

const CORE_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
  "Origin",
  "x-request-id",
];

if (!global.__CORS_LOGGED && process.env.CORS_LOGS !== "off") {
  Logger.info(
    `CORS allowlist: ${Array.from(allowedSet).join(", ")} (${
      allowLan ? "LAN enabled" : "LAN disabled"
    })`
  );
  if (process.env.CORS_LOGS === "verbose") {
    Logger.info(
      `CORS dev patterns: localhost/loopback always allowed${
        allowLan ? ", plus private LAN ranges" : ""
      }`
    );
    Logger.info(`CORS allowed headers: ${CORE_ALLOWED_HEADERS.join(", ")}`);
  }
  global.__CORS_LOGGED = true;
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const isExplicit = allowedSet.has(origin);
      const isLocalDev =
        ENV.NODE_ENV !== "production" && LOCAL_REGEX.test(origin);
      const isLanDev =
        ENV.NODE_ENV !== "production" && allowLan && LAN_REGEX.test(origin);
      if (isExplicit || isLocalDev || isLanDev) return cb(null, true);
      Logger.warn(
        `CORS blocked origin: ${origin} (hint: add to CORS_ORIGINS or set ALLOW_LAN_CORS=true)`
      );
      return cb(new Error("CORS_NOT_ALLOWED"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: CORE_ALLOWED_HEADERS,
    maxAge: 86400,
    optionsSuccessStatus: 200,
  })
);

// CORS error handler
app.use((err, req, res, next) => {
  if (err && err.message === "CORS_NOT_ALLOWED") {
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

// Compression (disable for SSE endpoints)
app.use(
  compression({
    filter: (req, res) => {
      if (req.path && req.path.startsWith("/api/chatbot/stream")) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Logging
// Conditional HTTP request logging (morgan); allow disabling or minimal mode
const morganSetting = process.env.HTTP_LOGS; // 'off' | 'minimal' | undefined
if (morganSetting !== "off") {
  const morganFormat =
    morganSetting === "minimal"
      ? "tiny"
      : process.env.NODE_ENV === "development"
      ? "dev"
      : "combined";
  app.use(
    morgan(morganFormat, {
      stream: { write: (str) => process.stdout.write(str) },
    })
  );
}

// Body parser middleware
app.use(express.json({ limit: "50mb" })); // Increased for facial metrics and transcripts
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sessions & Passport (Google OAuth)
app.use(cookieParser());

const SESSION_SECRET = ENV.SESSION_SECRET;
const MS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS = 7;

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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

// Health check route
const { isDbConnected } = require("./config/database");
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "MockMate API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: typeof isDbConnected === "function" ? isDbConnected() : true,
  });
});

app.use("/api/health", healthRoutes);

// System readiness endpoint
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

// Public routes
app.get("/favicon.ico", (req, res) => {
  const NO_CONTENT = 204;
  return res.status(NO_CONTENT).end();
});

app.get("/*.js", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.get("/*.json", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

// ===================================================================
// CHANGED: Bootstrap endpoint - make it work for both authenticated and unauthenticated users
// ===================================================================
app.get("/api/bootstrap", async (req, res) => {
  try {
    const { ok } = require("./utils/responder");

    // Try to get user from token (optional - might not be present)
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const BEARER_PREFIX_LENGTH = 7;
        const token = authHeader.substring(BEARER_PREFIX_LENGTH);
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (tokenErr) {
        // Invalid token - treat as unauthenticated
        if (process.env.REQUEST_LOGS === "verbose") {
          Logger.debug("Bootstrap: Invalid token, treating as unauthenticated");
        }
      }
    }

    // If no valid user ID, return minimal bootstrap for unauthenticated state
    if (!userId) {
      return ok(res, {
        auth: { authenticated: false },
        user: null,
        profile: null,
        analytics: null,
        subscription: null,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        dbConnected: require("./config/database").isDbConnected(),
      });
    }

    const User = require("./models/User");
    const UserProfile = require("./models/UserProfile");

    let user = null;
    let profile = null;

    try {
      // Fetch user and profile
      user = await User.findById(userId).select("-password").lean();

      if (user) {
        profile = await UserProfile.findOne({ user: userId }).lean();
      }
    } catch (dbErr) {
      Logger.warn("Bootstrap DB fetch failed:", dbErr.message);
    }

    if (!user) {
      // User ID from token doesn't exist in DB - clear token
      return ok(res, {
        auth: { authenticated: false, tokenInvalid: true },
        user: null,
        profile: null,
        analytics: null,
        subscription: null,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        dbConnected: require("./config/database").isDbConnected(),
      });
    }

    const analyticsData = profile ? profile.analytics || {} : {};
    const subscription = profile ? profile.subscription || null : null;

    const payload = {
      auth: {
        authenticated: true,
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
      profile,
      analytics: { ...analyticsData, subscription },
      subscription,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      dbConnected: require("./config/database").isDbConnected(),
    };

    return ok(res, payload);
  } catch (e) {
    const { fail } = require("./utils/responder");
    const meta = { detail: e.message };
    if (e.stack) {
      const STACK_LINES = 5;
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

// ===================================================================
// CHANGED: Dev-only upgrade endpoint - uses custom JWT auth
// ===================================================================
app.post("/api/dev/upgrade-self", requireAuth, async (req, res) => {
  const { ok, fail } = require("./utils/responder");
  try {
    if (process.env.NODE_ENV === "production") {
      return fail(res, 403, "FORBIDDEN", "Not available in production");
    }

    // CHANGED: Get userId from JWT auth (not Clerk)
    const userId = req.user?.id;

    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    const UserProfile = require("./models/UserProfile");
    const User = require("./models/User");

    // CHANGED: Find profile by 'user' field instead of 'clerkUserId'
    let profile = await UserProfile.findOne({ user: userId });

    if (!profile) {
      // Get user info
      const user = await User.findById(userId);
      if (!user) {
        return fail(res, 404, "USER_NOT_FOUND", "User not found");
      }

      // Create minimal profile if missing
      profile = await UserProfile.create({
        user: userId,
        personalInfo: {
          fullName: user.name,
          email: user.email,
        },
        onboardingCompleted: true,
      });
    }

    const { getPlan, isUnlimited } = require("./config/plans");
    const DAYS_IN_MONTH_APPROX = 30;
    const HOURS_PER_DAY = 24;
    const MINUTES_PER_HOUR = 60;
    const SECONDS_PER_MINUTE_CONST = 60;
    const MS_PER_SECOND = 1000;
    const THIRTY_DAYS_MS =
      DAYS_IN_MONTH_APPROX *
      HOURS_PER_DAY *
      MINUTES_PER_HOUR *
      SECONDS_PER_MINUTE_CONST *
      MS_PER_SECOND;
    const premium = getPlan("premium");

    profile.subscription = {
      plan: premium.key,
      interviewsRemaining: isUnlimited(premium.key) ? null : premium.interviews,
      nextResetDate: new Date(Date.now() + THIRTY_DAYS_MS),
    };

    await profile.save();

    return ok(res, {
      subscription: profile.subscription,
      userId: profile.user,
    });
  } catch (e) {
    return fail(res, 500, "UPGRADE_FAILED", "Failed to upgrade", {
      detail: e.message,
    });
  }
});

// ===================================================================
// API ROUTES
// ===================================================================
app.use("/api/session", sessionAuthRoutes); // ADD THIS LINE
app.use("/api/auth", authRoutes); // Custom auth (login, register, etc.)
app.use("/api/users", userRoutes);
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
        Logger.success(
          `🚀 MockMate server running on port ${port} (${process.env.NODE_ENV})`
        );
        Logger.success(`🔐 JWT authentication configured`);
        Logger.success(`🌐 Server URL: ${ENV.SERVER_URL}`);
        Logger.success(`📱 Client URL: ${ENV.CLIENT_URL}`);

        // Log auth methods available
        const authMethods = ["JWT (Email/Password)"];
        if (ENV.GOOGLE_CLIENT_ID) {
          authMethods.push("Google OAuth");
        }
        Logger.success(`🔑 Auth methods: ${authMethods.join(", ")}`);
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

// Defer server start until DB connection attempt resolves
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
