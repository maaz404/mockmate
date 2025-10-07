#!/usr/bin/env node

/**
 * Database collection inspector
 * Shows all collections and their document counts
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function inspectCollections() {
  console.log("🔍 Inspecting database collections...");

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    });

    console.log("✅ Connected to database");

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    console.log(`\n📚 Found ${collections.length} collections:`);

    if (collections.length === 0) {
      console.log("ℹ️  No collections found - database is empty");
      console.log(
        "💡 This is normal for a new database. Collections will be created when data is first inserted."
      );
    }

    // Count documents in each collection
    for (const collection of collections) {
      try {
        const count = await collection.countDocuments();
        console.log(`  📄 ${collection.collectionName}: ${count} documents`);
      } catch (error) {
        console.log(
          `  ❌ ${collection.collectionName}: Error counting documents - ${error.message}`
        );
      }
    }

    // Test basic database operations
    console.log("\n🧪 Testing basic operations...");

    // Test ping
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log(`📡 Ping: ${pingResult.ok === 1 ? "✅ SUCCESS" : "❌ FAILED"}`);

    // Test database stats
    try {
      const stats = await mongoose.connection.db.stats();
      console.log(
        `💾 Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `📊 Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(`🗂️  Indexes: ${stats.indexes}`);
      console.log(`📄 Total documents: ${stats.objects}`);
    } catch (statsError) {
      console.log("⚠️  Could not retrieve database stats:", statsError.message);
    }

    console.log("\n🎉 Database inspection completed!");
  } catch (error) {
    console.error("❌ Database inspection failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connection closed");
  }
}

// Run inspection
inspectCollections().catch(console.error);
