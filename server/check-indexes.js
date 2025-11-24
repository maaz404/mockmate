const mongoose = require("mongoose");
require("dotenv").config();

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("userprofiles");

    // Get all indexes
    const indexes = await collection.listIndexes().toArray();

    console.log("\n📋 All indexes on userprofiles collection:");
    indexes.forEach((index) => {
      console.log(`  - Name: ${index.name}`);
      console.log(`    Keys: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log(`    Unique: true`);
      console.log("");
    });

    // Check for profiles without subscription
    const profilesWithoutSubscription = await collection.countDocuments({
      subscription: { $exists: false },
    });

    const profilesWithNullClerkUserId = await collection.countDocuments({
      clerkUserId: null,
    });

    const totalProfiles = await collection.countDocuments();

    console.log("📊 Database statistics:");
    console.log(`  Total profiles: ${totalProfiles}`);
    console.log(
      `  Profiles without subscription: ${profilesWithoutSubscription}`
    );
    console.log(
      `  Profiles with clerkUserId=null: ${profilesWithNullClerkUserId}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkIndexes();
