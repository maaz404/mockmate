const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.log("Running in development mode without database connection...");
    
    // In development, don't exit if database connection fails
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
