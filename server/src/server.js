const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const buildSession = require("./config/session");
const connectDB = require("./config/database");
const Logger = require("./utils/logger");
const { ENV, validateEnv } = require("./config/env");

// Load environment variables BEFORE loading config/env so ENV gets real values
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

// Validate env after loading
if (process.env.NODE_ENV !== "test") {
  validateEnv();
}

// Import routes
const googleAuthRoutes = require("./auth/google");
const userRoutes = require("./routes/user");
const interviewRoutes = require("./routes/interview");
const questionRoutes = require("./routes/question");
const reportRoutes = require("./routes/report");
const videoRoutes = require("./routes/video");
const codingRoutes = require("./routes/coding");
const chatbotRoutes = require("./routes/chatbot");
const chatbotHealthRoute = require("./routes/chatbotHealth");
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
      const ms = Number(end - start) / 1e6;
      const skip =
        /\/api\/(health|bootstrap)/.test(req.path) && res.statusCode < 400;
      if (!skip) {
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
const dbReadyPromise = connectDB();

// Cookie parser and body parser
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize session and Passport middleware BEFORE routes
app.use(
  buildSession({
    mongoUrl: process.env.MONGODB_URI,
    isProd: process.env.NODE_ENV === "production",
  })
);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport");

// Mount local auth routes
require("./auth/local");
app.use("/api/auth", require("./auth/localRoutes"));
app.use("/api/auth", require("./auth/google"));

// Security middleware
app.use(helmet());

// Rate limiting
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const FIFTEEN_MINUTES_MS = 15 * MINUTE_MS;
const DEFAULT_MAX_REQUESTS = 1000;
const limiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || FIFTEEN_MINUTES_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS || DEFAULT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development",
});
app.use(limiter);

// Compression (disable for SSE endpoints like /api/chatbot/stream to avoid breaking event stream)
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

// Logging (attach request id token to morgan output)
const morganFormat =
  process.env.NODE_ENV === "development" ? "dev" : "combined";
app.use(
  morgan(morganFormat, {
    stream: { write: (str) => process.stdout.write(str) },
  })
);

// Health check route
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

// API routes
const { ensureAuthenticated } = require("./middleware/auth");
app.use("/api/users", ensureAuthenticated, userRoutes);
app.get("/api/bootstrap", async (req, res) => {
  try {
    const { ok, fail } = require("./utils/responder");
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const User = require("./models/User");
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return fail(res, 404, "USER_NOT_FOUND", "User not found");
    }
    const subscription = user.subscription || null;
    const payload = {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      subscription,
      analytics: user.analytics || {},
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
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
app.post("/api/dev/upgrade-self", async (req, res) => {
  const { ok, fail } = require("./utils/responder");
  try {
    if (process.env.NODE_ENV === "production") {
      return fail(res, 403, "FORBIDDEN", "Not available in production");
    }
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const User = require("./models/User");
    const user = await User.findById(req.user._id);
    if (!user) {
      return fail(res, 404, "USER_NOT_FOUND", "User not found");
    }
    const { getPlan } = require("./config/plans");
    const MS_IN_SECOND = 1000;
    const SECONDS_IN_MINUTE = 60;
    const MINUTES_IN_HOUR = 60;
    const HOURS_IN_DAY = 24;
    const DAYS_IN_MONTH = 30;
    const THIRTY_DAYS_MS =
      MS_IN_SECOND *
      SECONDS_IN_MINUTE *
      MINUTES_IN_HOUR *
      HOURS_IN_DAY *
      DAYS_IN_MONTH;
    const premium = getPlan("premium");
    user.subscription = {
      plan: premium.key,
      interviewsRemaining: premium.unlimited ? null : premium.interviews,
      nextResetDate: new Date(Date.now() + THIRTY_DAYS_MS),
    };
    await user.save();
    return ok(res, {
      subscription: user.subscription,
      userId: user._id,
    });
  } catch (e) {
    return fail(res, 500, "UPGRADE_FAILED", "Failed to upgrade", {
      detail: e.message,
    });
  }
});
app.use("/api/interviews", ensureAuthenticated, interviewRoutes);
app.use("/api/interviews", ensureAuthenticated, interviewMediaRoutes);
app.use("/api/questions", ensureAuthenticated, questionRoutes);
app.use("/api/reports", ensureAuthenticated, reportRoutes);
app.use("/api/video", ensureAuthenticated, videoRoutes);
app.use("/api/coding", ensureAuthenticated, codingRoutes);
app.use("/api/chatbot/health", chatbotHealthRoute);
app.use("/api/chatbot", ensureAuthenticated, chatbotRoutes);
app.use("/api/uploads", ensureAuthenticated, uploadRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const DEFAULT_PORT = 5002;
const PORT = ENV.PORT || DEFAULT_PORT;
let server;

function startServer(port) {
  try {
    server = app
      .listen(port, () => {
        Logger.info(
          `🚀 MockMate server is running on port ${port} in ${process.env.NODE_ENV} mode`
        );
        Logger.info("🔐 Google OAuth authentication enabled");
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
