const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
const connectDB = require("./config/database");
const Logger = require("./utils/logger");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const interviewRoutes = require("./routes/interview");
const questionRoutes = require("./routes/question");
const reportRoutes = require("./routes/report");
const videoRoutes = require("./routes/video");
const codingRoutes = require("./routes/coding");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

// Create Express app
const app = express();

// Set trust proxy for proper IP detection
app.set("trust proxy", 1);

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
// Default rate-limit window (ms)
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || FIFTEEN_MINUTES_MS,
  max:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || DEFAULT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", // Added for your current setup
      process.env.CLIENT_URL || "http://localhost:3000",
    ],
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

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check route (before Clerk middleware)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "MockMate API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
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

// Clerk middleware - adds auth context to all API requests only
// In development with MOCK_AUTH_FALLBACK=true, skip global Clerk auth
const useClerkGlobally =
  process.env.NODE_ENV === "production" ||
  process.env.MOCK_AUTH_FALLBACK !== "true";

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
app.use("/api/interviews", interviewRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/coding", codingRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const DEFAULT_PORT = 5000;
const PORT = parseInt(process.env.PORT, 10) || DEFAULT_PORT;
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
            process.env.CLERK_SECRET_KEY ? "configured" : "NOT configured"
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
