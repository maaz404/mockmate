const mongoose = require("mongoose");
const Logger = require("../utils/logger");

let isDbConnected = false;
let connectTries = 0;

// Optional verbose mongoose debug
if (process.env.DB_DEBUG_LOGS === "true") {
  // Verbose per-operation logging (indexes, queries) - enable only when diagnosing issues
  mongoose.set("debug", (collectionName, method, query) => {
    try {
      const q = JSON.stringify(query);
      Logger.debug(`Mongoose: ${collectionName}.${method} ${q}`);
    } catch (_) {
      Logger.debug(`Mongoose: ${collectionName}.${method}`);
    }
  });
} else if (process.env.DB_DEBUG_LOGS === "minimal") {
  // Minimal logging: only index creation events
  mongoose.set("debug", (collectionName, method) => {
    if (method === "createIndex") {
      Logger.debug(`Mongoose: ${collectionName}.${method}`);
    }
  });
}

/**
 * Connect to MongoDB database (Atlas or self-hosted via MONGODB_URI)
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === "test") {
      // Lazy load to avoid dev dependency cost otherwise
      try {
        // eslint-disable-next-line global-require
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mem = await MongoMemoryServer.create();
        uri = mem.getUri();
        process.env.MONGODB_URI = uri; // propagate for any downstream usage
        Logger.warn("Using in-memory MongoDB instance for tests.");
      } catch (e) {
        Logger.error("Failed to start in-memory MongoDB:", e?.message || e);
        return; // tests relying on DB will fail fast
      }
    } else {
      Logger.error("Missing MONGODB_URI in environment.");
      if (process.env.NODE_ENV === "production") process.exit(1);
      return;
    }
  }

  const doConnect = async () => {
    try {
      connectTries += 1;
      // Sensible defaults for Atlas and production
      mongoose.set("strictQuery", true);
      // Enable autoIndex in development for convenience, disable in prod for performance
      mongoose.set("autoIndex", process.env.NODE_ENV !== "production");

      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000, // Increased from 8000
        socketTimeoutMS: 45000, // Add socket timeout
        maxPoolSize: 10,
        minPoolSize: 2, // Increased from 1
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        // Write concern/retry are generally encoded in the connection string, especially for Atlas
      });
      isDbConnected = true;
      const isAtlas = /mongodb\+srv:/.test(uri) || /mongodb\.net/.test(uri);
      Logger.info(
        `📊 MongoDB Connected: ${conn.connection.host} ${
          isAtlas ? "(Atlas)" : ""
        }`
      );
    } catch (error) {
      isDbConnected = false;
      Logger.error(
        `Database connection failed (attempt ${connectTries}): ${
          error?.message || error
        }`
      );
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      } else {
        Logger.warn(
          "Continuing in development without DB. Set MONGODB_URI to your Atlas connection string to enable persistence."
        );
      }
    }
  };

  // Bind once
  mongoose.connection.on("connected", () => {
    isDbConnected = true;
    Logger.success("✅ Mongoose connected to DB");
  });
  mongoose.connection.on("error", (err) => {
    isDbConnected = false;
    Logger.error("❌ Mongoose connection error:", err?.message || err);
  });
  mongoose.connection.on("disconnected", () => {
    isDbConnected = false;
    Logger.warn("⚠️  Mongoose disconnected");
    // Avoid automatic reconnection loop in test environment to prevent stray async timers
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NODE_ENV !== "test"
    ) {
      const RETRY_DELAY_MS = 5000; // Increased retry delay
      Logger.info(`Attempting to reconnect in ${RETRY_DELAY_MS}ms...`);
      setTimeout(doConnect, RETRY_DELAY_MS);
    }
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    Logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  });

  await doConnect();
};

module.exports = connectDB;
module.exports.isDbConnected = () => isDbConnected;
