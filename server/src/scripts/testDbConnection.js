#!/usr/bin/env node

/**
 * Database connection tester
 * Tests MongoDB Atlas connection with detailed diagnostics
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function testDatabaseConnection() {
  console.log("🔍 Testing MongoDB Atlas connection...");
  console.log(
    `📍 URI: ${
      process.env.MONGODB_URI
        ? process.env.MONGODB_URI.replace(/:[^@]*@/, ":***@")
        : "NOT SET"
    }`
  );

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in environment variables");
    process.exit(1);
  }

  try {
    // Set mongoose options for better error reporting
    mongoose.set("strictQuery", true);

    console.log("🔌 Attempting connection...");
    const startTime = Date.now();

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    });

    const connectionTime = Date.now() - startTime;
    console.log(`✅ Connected to MongoDB in ${connectionTime}ms`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log(
      `🔗 Ready state: ${conn.connection.readyState} (1 = connected)`
    );

    // Test basic operations
    console.log("\n🧪 Testing basic operations...");

    // Ping test
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log(
      "📡 Ping test:",
      pingResult.ok === 1 ? "✅ SUCCESS" : "❌ FAILED"
    );

    // List collections
    const collections = await mongoose.connection.db.collections();
    console.log(`📚 Collections found: ${collections.length}`);
    collections.forEach((coll) => console.log(`  - ${coll.collectionName}`));

    // Test a simple query
    try {
      const stats = await mongoose.connection.db.stats();
      console.log(
        `💾 Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(`📄 Documents: ${stats.objects}`);
    } catch (statsError) {
      console.log("⚠️  Could not retrieve database stats:", statsError.message);
    }

    console.log("\n🎉 Database connection test completed successfully!");
  } catch (error) {
    console.error("\n❌ Database connection failed:");
    console.error(`Error: ${error.message}`);

    if (error.name === "MongoServerSelectionError") {
      console.error("\n🔧 Troubleshooting tips:");
      console.error("1. Check your internet connection");
      console.error("2. Verify MongoDB Atlas cluster is running");
      console.error(
        "3. Check IP whitelist in Atlas (add 0.0.0.0/0 for testing)"
      );
      console.error("4. Verify username/password in connection string");
      console.error("5. Check if database name is specified in the URI");
    }

    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log("🔌 Connection closed gracefully");
    } catch (closeError) {
      console.error("⚠️  Error closing connection:", closeError.message);
    }
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n⏹️  Received SIGINT, closing connection...");
  await mongoose.connection.close();
  process.exit(0);
});

// Run the test
testDatabaseConnection().catch(console.error);
