/* eslint-disable no-console */
// Lightweight logger wrapper to standardize logging and allow swapping impl later
const isTest = process.env.NODE_ENV === "test";

const log = (...args) => {
  if (!isTest) console.log(...args);
};
const info = (...args) => {
  if (!isTest) console.info(...args);
};
const warn = (...args) => {
  if (!isTest) console.warn(...args);
};
const error = (...args) => {
  if (!isTest) console.error(...args);
};

module.exports = { log, info, warn, error };
class Logger {
  static log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, ...args);
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, ...args);
    }
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
