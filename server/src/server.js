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
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
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

// Connect to database
connectDB();

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

// CORS configuration
app.use(
  cors({
    origin: ENV.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    optionsSuccessStatus: 200,
  })
);

// Compression
app.use(compression());

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

// Clerk middleware - adds auth context to all API requests only
// In development with MOCK_AUTH_FALLBACK=true, skip global Clerk auth
const useClerkGlobally =
  ENV.NODE_ENV === "production" || !ENV.MOCK_AUTH_FALLBACK;

if (useClerkGlobally) {
  app.use("/api", ClerkExpressWithAuth());
} else {
  Logger.warn(
    "Skipping global Clerk auth (MOCK_AUTH_FALLBACK=true). Route-level auth will use mock user."
  );
}

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// Lightweight bootstrap route (auth + profile + analytics) placed near user routes for discoverability
app.get("/api/bootstrap", async (req, res) => {
  // In dev mock mode allow unauth to still get a stub
  try {
    const authCtx = req.auth || {};
    const userId = authCtx.userId || authCtx.id;
    const usingMock =
      process.env.NODE_ENV !== "production" &&
      process.env.MOCK_AUTH_FALLBACK === "true";
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
    if (!profile && usingMock) {
      profile = {
        clerkUserId: "test-user-123",
        email: "test-user-123@dev.local",
        firstName: "Test",
        lastName: "User",
        onboardingCompleted: false,
        analytics: { averageScore: 0 },
      };
    }
    const payload = {
      auth: userId ? { userId } : null,
      profile,
      analytics: profile ? profile.analytics || {} : {},
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      dbConnected: require("./config/database").isDbConnected(),
    };
    return ok(res, payload);
  } catch (e) {
    const { fail } = require("./utils/responder");
    return fail(
      res,
      500,
      "BOOTSTRAP_FAILED",
      "Failed to load bootstrap data",
      process.env.NODE_ENV === "development" ? { detail: e.message } : undefined
    );
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

startServer(PORT);

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
