const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const requireAuth = require("../middleware/auth");
const Interview = require("../models/Interview");
const UserProfile = require("../models/UserProfile");

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/videos");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.auth.userId}_${Date.now()}_${Math.round(
      Math.random() * 1e9
    )}.webm`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/") || file.mimetype === "audio/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
});

// @desc    Start video recording session
// @route   POST /api/video/start/:interviewId
// @access  Private
router.post("/start/:interviewId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview must be in progress to start video recording",
      });
    }

    // Initialize video session
    interview.videoSession = {
      isRecording: true,
      startedAt: new Date(),
      recordings: interview.videoSession?.recordings || [],
    };

    await interview.save();

    res.json({
      success: true,
      message: "Video recording session started",
      data: {
        sessionId: interview._id,
        startTime: interview.videoSession.startedAt,
      },
    });
  } catch (error) {
    console.error("Start video recording error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start video recording",
    });
  }
});

// @desc    Upload video recording
// @route   POST /api/video/upload/:interviewId/:questionIndex
// @access  Private
router.post(
  "/upload/:interviewId/:questionIndex",
  requireAuth,
  upload.single("video"),
  async (req, res) => {
    try {
      const { userId } = req.auth;
      const { interviewId, questionIndex } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No video file uploaded",
        });
      }

      const interview = await Interview.findOne({
        _id: interviewId,
        userId,
      });

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: "Interview not found",
        });
      }

      const qIndex = parseInt(questionIndex);
      if (qIndex >= interview.questions.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid question index",
        });
      }

      // Store video information
      const videoData = {
        questionIndex: qIndex,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
        uploadedAt: new Date(),
        duration: req.body.duration || null,
        mimeType: req.file.mimetype,
      };

      // Initialize video session if not exists
      if (!interview.videoSession) {
        interview.videoSession = {
          isRecording: true,
          startedAt: new Date(),
          recordings: [],
        };
      }

      // Add recording to the session
      interview.videoSession.recordings.push(videoData);

      // Add video reference to the specific question
      interview.questions[qIndex].video = {
        filename: req.file.filename,
        path: req.file.path,
        duration: req.body.duration || null,
        uploadedAt: new Date(),
      };

      await interview.save();

      res.json({
        success: true,
        message: "Video uploaded successfully",
        data: {
          questionIndex: qIndex,
          videoId: req.file.filename,
          size: req.file.size,
          duration: req.body.duration,
        },
      });
    } catch (error) {
      console.error("Video upload error:", error);

      // Clean up uploaded file if there was an error
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded file:", cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to upload video",
      });
    }
  }
);

// @desc    Stop video recording session
// @route   POST /api/video/stop/:interviewId
// @access  Private
router.post("/stop/:interviewId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (!interview.videoSession || !interview.videoSession.isRecording) {
      return res.status(400).json({
        success: false,
        message: "No active recording session found",
      });
    }

    // Stop recording
    interview.videoSession.isRecording = false;
    interview.videoSession.endedAt = new Date();
    interview.videoSession.totalDuration = Math.round(
      (interview.videoSession.endedAt - interview.videoSession.startedAt) / 1000
    );

    await interview.save();

    res.json({
      success: true,
      message: "Video recording session stopped",
      data: {
        sessionId: interview._id,
        totalRecordings: interview.videoSession.recordings.length,
        totalDuration: interview.videoSession.totalDuration,
      },
    });
  } catch (error) {
    console.error("Stop video recording error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to stop video recording",
    });
  }
});

// @desc    Get video playback URL
// @route   GET /api/video/playback/:interviewId/:questionIndex
// @access  Private
router.get(
  "/playback/:interviewId/:questionIndex",
  requireAuth,
  async (req, res) => {
    try {
      const { userId } = req.auth;
      const { interviewId, questionIndex } = req.params;

      const interview = await Interview.findOne({
        _id: interviewId,
        userId,
      });

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: "Interview not found",
        });
      }

      const qIndex = parseInt(questionIndex);
      if (qIndex >= interview.questions.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid question index",
        });
      }

      const question = interview.questions[qIndex];
      if (!question.video || !question.video.filename) {
        return res.status(404).json({
          success: false,
          message: "No video found for this question",
        });
      }

      const videoPath = path.join(
        __dirname,
        "../../uploads/videos",
        question.video.filename
      );

      // Check if file exists
      try {
        await fs.access(videoPath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: "Video file not found",
        });
      }

      res.json({
        success: true,
        message: "Video found",
        data: {
          videoUrl: `/api/video/stream/${question.video.filename}`,
          duration: question.video.duration,
          uploadedAt: question.video.uploadedAt,
          questionIndex: qIndex,
        },
      });
    } catch (error) {
      console.error("Get video playback error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get video playback information",
      });
    }
  }
);

// @desc    Stream video file
// @route   GET /api/video/stream/:filename
// @access  Private
router.get("/stream/:filename", requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { userId } = req.auth;

    // Security: Check if the user owns this video
    const interview = await Interview.findOne({
      userId,
      "videoSession.recordings.filename": filename,
    });

    if (!interview) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const videoPath = path.join(__dirname, "../../uploads/videos", filename);

    // Check if file exists
    try {
      const stats = await fs.stat(videoPath);
      const fileSize = stats.size;

      // Set appropriate headers for video streaming
      res.set({
        "Content-Type": "video/webm",
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      });

      // Support for range requests (seeking)
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.status(206).set({
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunkSize,
        });

        const fs = require("fs");
        const stream = fs.createReadStream(videoPath, { start, end });
        stream.pipe(res);
      } else {
        const fs = require("fs");
        const stream = fs.createReadStream(videoPath);
        stream.pipe(res);
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Video file not found",
      });
    }
  } catch (error) {
    console.error("Video streaming error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to stream video",
    });
  }
});

// @desc    Delete video recording
// @route   DELETE /api/video/:interviewId/:questionIndex
// @access  Private
router.delete("/:interviewId/:questionIndex", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId, questionIndex } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    const qIndex = parseInt(questionIndex);
    if (qIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid question index",
      });
    }

    const question = interview.questions[qIndex];
    if (!question.video || !question.video.filename) {
      return res.status(404).json({
        success: false,
        message: "No video found for this question",
      });
    }

    // Delete physical file
    const videoPath = path.join(
      __dirname,
      "../../uploads/videos",
      question.video.filename
    );
    try {
      await fs.unlink(videoPath);
    } catch (error) {
      console.error("Failed to delete video file:", error);
    }

    // Remove video reference from question
    interview.questions[qIndex].video = undefined;

    // Remove from video session recordings
    if (interview.videoSession && interview.videoSession.recordings) {
      interview.videoSession.recordings =
        interview.videoSession.recordings.filter(
          (recording) => recording.filename !== question.video.filename
        );
    }

    await interview.save();

    res.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete video error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete video",
    });
  }
});

// @desc    Get interview video summary
// @route   GET /api/video/summary/:interviewId
// @access  Private
router.get("/summary/:interviewId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    const videoSummary = {
      hasVideoSession: !!interview.videoSession,
      totalRecordings: interview.videoSession?.recordings?.length || 0,
      sessionDuration: interview.videoSession?.totalDuration || 0,
      questionsWithVideo: interview.questions.filter(
        (q) => q.video && q.video.filename
      ).length,
      recordings: [],
    };

    // Get details for each question with video
    interview.questions.forEach((question, index) => {
      if (question.video && question.video.filename) {
        videoSummary.recordings.push({
          questionIndex: index,
          questionText: question.questionText.substring(0, 100) + "...",
          filename: question.video.filename,
          duration: question.video.duration,
          uploadedAt: question.video.uploadedAt,
          playbackUrl: `/api/video/stream/${question.video.filename}`,
        });
      }
    });

    res.json({
      success: true,
      message: "Video summary retrieved",
      data: videoSummary,
    });
  } catch (error) {
    console.error("Get video summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get video summary",
    });
  }
});

module.exports = router;
