const mongoose = require("mongoose");
require("dotenv").config();

async function dropClerkIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("userprofiles");

    // List existing indexes
    const indexes = await collection.indexes();
    console.log("\n📋 Current indexes on userprofiles collection:");
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the clerkUserId index if it exists
    const clerkIndexExists = indexes.some(
      (index) => index.name === "clerkUserId_1"
    );

    if (clerkIndexExists) {
      console.log("\n🗑️  Dropping clerkUserId_1 index...");
      await collection.dropIndex("clerkUserId_1");
      console.log("✅ Successfully dropped clerkUserId_1 index");
    } else {
      console.log(
        "\n⚠️  clerkUserId_1 index not found (may have been already removed)"
      );
    }

    // Verify final state
    const finalIndexes = await collection.indexes();
    console.log("\n📋 Final indexes on userprofiles collection:");
    finalIndexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

dropClerkIndex();
