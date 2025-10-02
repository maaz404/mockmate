const express = require("express");
const requireAuth = require("../middleware/auth");
const dbReady = require("../middleware/dbReady");
const {
  setRecording,
  addSnapshot,
  setTranscript,
} = require("../controllers/sessionMediaController");

const router = express.Router();

router.put("/sessions/:id/recording", requireAuth, dbReady, setRecording);
router.post("/sessions/:id/snapshots", requireAuth, dbReady, addSnapshot);
router.put("/sessions/:id/transcript", requireAuth, dbReady, setTranscript);

module.exports = router;
