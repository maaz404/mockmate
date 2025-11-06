const mongoose = require("mongoose");
require("dotenv").config();

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("userprofiles");

    // Step 1: Drop the problematic email index
    try {
      await collection.dropIndex("email_1");
      console.log("✅ Dropped email_1 index successfully");
    } catch (error) {
      if (error.code === 27) {
        console.log("ℹ️  Index already dropped or does not exist");
      } else {
        throw error;
      }
    }

    // Step 2: Find and remove duplicate profiles
    const duplicates = await collection
      .aggregate([
        {
          $group: { _id: "$user", count: { $sum: 1 }, ids: { $push: "$_id" } },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    console.log(`ℹ️  Found ${duplicates.length} users with duplicate profiles`);

    for (const dup of duplicates) {
      // Keep the most recent one, delete the rest
      const profiles = await collection
        .find({ _id: { $in: dup.ids } })
        .sort({ createdAt: -1 })
        .toArray();

      const toDelete = profiles.slice(1).map((p) => p._id);
      if (toDelete.length > 0) {
        await collection.deleteMany({ _id: { $in: toDelete } });
        console.log(
          `✅ Cleaned up ${toDelete.length} duplicate(s) for user: ${dup._id}`
        );
      }
    }

    console.log("🎉 Database cleanup complete!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixIndex();
