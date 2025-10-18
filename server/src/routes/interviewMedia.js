const express = require("express");
const { ensureAuthenticated } = require("../middleware/auth");
const dbReady = require("../middleware/dbReady");
const {
  setRecording,
  addSnapshot,
  setTranscript,
} = require("../controllers/sessionMediaController");

const router = express.Router();

router.put("/sessions/:id/recording", ensureAuthenticated, dbReady, setRecording);
router.post("/sessions/:id/snapshots", ensureAuthenticated, dbReady, addSnapshot);
router.put("/sessions/:id/transcript", ensureAuthenticated, dbReady, setTranscript);

module.exports = router;
