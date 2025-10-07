#!/usr/bin/env node

/**
 * Database index cleaner
 * Drops problematic indexes to allow fresh creation
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function cleanIndexes() {
  console.log("🔧 Cleaning problematic database indexes...");

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    });

    console.log("✅ Connected to database");

    // Drop the problematic compound index on questions collection
    try {
      const questionsCollection =
        mongoose.connection.db.collection("questions");

      // List existing indexes
      const indexes = await questionsCollection.indexes();
      console.log("\n📊 Current indexes on questions collection:");
      indexes.forEach((index, i) => {
        console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
      });

      // Try to drop the problematic index if it exists
      try {
        await questionsCollection.dropIndex({ industries: 1, roles: 1 });
        console.log(
          "✅ Dropped problematic compound index: industries_1_roles_1"
        );
      } catch (dropError) {
        if (dropError.code === 27) {
          console.log(
            "ℹ️  Index industries_1_roles_1 doesn't exist (already clean)"
          );
        } else {
          console.log("⚠️  Could not drop index:", dropError.message);
        }
      }

      // Also drop all indexes to start fresh
      try {
        await questionsCollection.dropIndexes();
        console.log("🧹 Dropped all indexes on questions collection");
      } catch (dropAllError) {
        console.log("ℹ️  Could not drop all indexes:", dropAllError.message);
      }
    } catch (collectionError) {
      console.log("ℹ️  Questions collection doesn't exist yet (this is fine)");
    }

    console.log("✅ Index cleanup completed");
  } catch (error) {
    console.error("❌ Index cleanup failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connection closed");
  }
}

// Run cleanup
cleanIndexes().catch(console.error);
