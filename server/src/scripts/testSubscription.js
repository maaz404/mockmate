/* eslint-disable no-console */
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/database");
const { getRemaining } = require("../utils/subscription");

async function testSubscription() {
  try {
    await connectDB();

    const clerkUserId = "user_32SjRWLQzT2Adf0C0MPuO0lezl3";

    console.log("Testing subscription for user:", clerkUserId);

    const remaining = await getRemaining(clerkUserId);
    console.log("Remaining interviews:", remaining);
    console.log("Is unlimited?", remaining === null);

    if (remaining === null) {
      console.log("✅ User has unlimited interviews (premium)");
    } else if (remaining > 0) {
      console.log("📊 User has", remaining, "interviews remaining (free plan)");
    } else {
      console.log("❌ User has no interviews remaining");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testSubscription();
