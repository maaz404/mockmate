const mongoose = require("mongoose");

let isDbConnected = false;
let connectTries = 0;

// Optional verbose mongoose debug
if (process.env.DB_DEBUG_LOGS === "true") {
  mongoose.set("debug", (collectionName, method, query) => {
    try {
      const q = JSON.stringify(query);
      console.log(`Mongoose: ${collectionName}.${method} ${q}`);
    } catch (_) {
      console.log(`Mongoose: ${collectionName}.${method}`);
    }
  });
}

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in environment.");
    if (process.env.NODE_ENV === "production") process.exit(1);
    return;
  }

  const doConnect = async () => {
    try {
      connectTries += 1;
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isDbConnected = true;
      console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      isDbConnected = false;
      console.error(
        `Database connection failed (attempt ${connectTries}):`,
        error?.message || error
      );
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      } else {
        console.warn(
          "Continuing in development without DB. Some features will use in-memory fallback if enabled."
        );
      }
    }
  };

  // Bind once
  mongoose.connection.on("connected", () => {
    isDbConnected = true;
    console.log("✅ Mongoose connected to DB");
  });
  mongoose.connection.on("error", (err) => {
    isDbConnected = false;
    console.error("❌ Mongoose connection error:", err?.message || err);
  });
  mongoose.connection.on("disconnected", () => {
    isDbConnected = false;
    console.warn("⚠️  Mongoose disconnected");
    if (process.env.NODE_ENV !== "production") {
      setTimeout(doConnect, 2000);
    }
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  });

  await doConnect();
};

module.exports = connectDB;
module.exports.isDbConnected = () => isDbConnected;
