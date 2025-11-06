/* eslint-disable no-console */
// Standardized logger; single export for consistent usage across codebase
class Logger {
  static shouldEmit(level) {
    const env = process.env.NODE_ENV || "development";
    const verbosity =
      process.env.LOG_VERBOSITY || (env === "production" ? "info" : "debug");
    const order = ["debug", "info", "success", "warn", "error"]; // ascending severity
    const thresholdIndex = order.indexOf(
      verbosity === "verbose" ? "debug" : verbosity
    );
    const levelIndex = order.indexOf(level);
    if (thresholdIndex === -1 || levelIndex === -1) return true; // fallback allow
    return levelIndex >= thresholdIndex;
  }

  static log(level, message, ...args) {
    if (!this.shouldEmit(level)) return; // drop low-level logs
    const timestamp = new Date().toISOString();
    // Use compact format for debug/minimal to reduce noise
    if (level === "debug" && process.env.LOG_COMPACT === "true") {
      console.log(`${timestamp} ${level.toUpperCase()} ${message}`, ...args);
      return;
    }
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, ...args);
  }

  static debug(message, ...args) {
    this.log("debug", message, ...args);
  }

  static info(message, ...args) {
    this.log("info", message, ...args);
  }

  static success(message, ...args) {
    this.log("success", message, ...args);
  }

  static warn(message, ...args) {
    this.log("warn", message, ...args);
  }

  static error(message, ...args) {
    this.log("error", message, ...args);
  }
}

module.exports = Logger;
