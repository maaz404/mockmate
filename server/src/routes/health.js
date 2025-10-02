const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { isDbConnected } = require("../config/database");

router.get("/db-test", async (_req, res) => {
  try {
    const statusMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    const state = mongoose.connection.readyState;

    const payload = {
      success: state === 1,
      ok: typeof isDbConnected === "function" ? isDbConnected() : state === 1,
      state: statusMap[state] || String(state),
      uri: process.env.MONGODB_URI ? "present" : "missing",
    };

    if (state === 1) {
      try {
        // Ping admin to verify round-trip
        // eslint-disable-next-line no-underscore-dangle
        const pong = await mongoose.connection.db.admin().ping();
        payload.ping = pong?.ok === 1 ? "ok" : "unknown";
        const collections = await mongoose.connection.db.collections();
        payload.collections = collections.map((c) => c.collectionName);
      } catch (e) {
        payload.ping = "failed";
        payload.error = e?.message || String(e);
      }
    }

    return res.json(payload);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: err?.message || String(err) });
  }
});

module.exports = router;
