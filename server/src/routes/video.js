const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const requireAuth = require("../middleware/auth");
const Interview = require("../models/Interview");
const transcriptionService = require("../services/transcriptionService");
const Logger = require("../utils/logger");
const MC = require("../utils/mediaConstants");
const { consumeFreeInterview } = require("../utils/subscription");
let cloudinary = null;
try {
  cloudinary = require("../config/cloudinary");
} catch (e) {
  cloudinary = null;
}

const router = express.Router();

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
    // CHANGED: req.auth.userId -> req.user.id
    const uniqueName = `${req.user.id}_${Date.now()}_${Math.round(
      Math.random() * MC.RECORDING_RANDOM_MAX
    )}.webm`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MC.VIDEO_MAX_FILE_MB * MC.BYTES_PER_MB,
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
    // CHANGED: const { userId } = req.auth; -> const userId = req.user?.id;
    const userId = req.user?.id;
    const { interviewId } = req.params;

    Logger.info("[video/start] Request received:", { userId, interviewId });

    // Validate interviewId format early to avoid CastError noise
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      Logger.warn("[video/start] Invalid interview ID format:", interviewId);
      return res.status(400).json({
        success: false,
        message: "Invalid interview id format",
        code: "INVALID_INTERVIEW_ID",
      });
    }

    // CHANGED: query by user field instead of userId
    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) {
      Logger.warn("[video/start] Interview not found:", {
        interviewId,
        userId,
      });
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    Logger.info("[video/start] Interview found:", {
      interviewId,
      status: interview.status,
      hasVideoSession: !!interview.videoSession,
    });

    // Allow video recording for both scheduled and in-progress interviews
    if (
      interview.status !== "in-progress" &&
      interview.status !== "scheduled"
    ) {
      Logger.warn("[video/start] Invalid interview status:", interview.status);

      // Provide specific error messages based on status
      let errorMessage =
        "Interview must be scheduled or in progress to start video recording";
      if (interview.status === "completed") {
        errorMessage =
          "This interview has already been completed. Please start a new interview to record video.";
      } else if (interview.status === "cancelled") {
        errorMessage =
          "This interview has been cancelled. Please start a new interview to record video.";
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
        currentStatus: interview.status,
      });
    }

    // Update status to in-progress if starting video for the first time
    if (interview.status === "scheduled") {
      interview.status = "in-progress";
      if (!interview.timing) interview.timing = {};
      interview.timing.startedAt = new Date();

      // Consume free interview when starting
      await consumeFreeInterview(userId, interviewId);
    }

    // Initialize video session
    interview.videoSession = {
      isRecording: true,
      startedAt: new Date(),
      recordings: interview.videoSession?.recordings || [],
    };

    await interview.save();

    return res.json({
      success: true,
      message: "Video recording session started",
      data: {
        sessionId: interview._id,
        startTime: interview.videoSession.startedAt,
      },
    });
  } catch (error) {
    Logger.error("Start video recording error:", error);
    return res.status(500).json({
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
      // CHANGED: const { userId } = req.auth; -> const userId = req.user?.id;
      const userId = req.user?.id;
      const { interviewId, questionIndex } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No video file uploaded",
        });
      }

      // CHANGED: query by user field
      const interview = await Interview.findOne({
        _id: interviewId,
        user: userId,
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
          message: "Interview is not active for recording",
        });
      }

      const qIndex = parseInt(questionIndex);
      if (qIndex >= interview.questions.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid question index",
        });
      }

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

      let facialAnalysisData = null;
      if (req.body.facialAnalysis) {
        try {
          facialAnalysisData = JSON.parse(req.body.facialAnalysis);
        } catch (error) {
          Logger.warn("Invalid facial analysis data:", error);
        }
      }

      if (!interview.videoSession) {
        interview.videoSession = {
          isRecording: true,
          startedAt: new Date(),
          recordings: [],
        };
      }

      interview.videoSession.recordings.push(videoData);

      let cloudinaryAsset = null;
      if (
        cloudinary &&
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY
      ) {
        try {
          const folder = `interviews/${interviewId}`;
          const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "video",
            folder,
            filename_override: req.file.filename,
            overwrite: true,
            eager: [{ streaming_profile: "full_hd", format: "m3u8" }],
          });
          cloudinaryAsset = {
            publicId: uploadResult.public_id,
            url: uploadResult.secure_url || uploadResult.url,
            bytes: uploadResult.bytes,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            duration: uploadResult.duration,
            folder,
          };
          // NOTE: Do not delete the local file here; transcription and
          // local playback/retry may depend on it. Cleanup can be handled
          // later by a job or after successful transcription if desired.
        } catch (cloudErr) {
          Logger.warn(
            "Cloudinary upload failed, continuing with local file:",
            cloudErr?.message || cloudErr
          );
        }
      }

      const videoQuestion = {
        filename: req.file.filename,
        path: req.file.path,
        duration: req.body.duration || null,
        uploadedAt: new Date(),
        transcript: {
          text: null,
          generatedAt: null,
          status: "pending",
        },
        cloudinary: cloudinaryAsset || undefined,
      };

      if (facialAnalysisData) {
        videoQuestion.facialAnalysis = {
          enabled: true,
          metrics: facialAnalysisData.metrics || {},
          baseline: facialAnalysisData.baseline || { completed: false },
          sessionSummary: facialAnalysisData.sessionSummary || {},
          analysisTimestamp: new Date(),
        };
      }

      interview.questions[qIndex].video = videoQuestion;

      await interview.save();

      transcriptionService
        .processVideoTranscription(
          interview,
          qIndex,
          req.file.path,
          req.file.filename
        )
        .catch((error) => {
          Logger.error("Background transcription error:", error);
        });

      return res.json({
        success: true,
        message: "Video uploaded successfully",
        data: {
          questionIndex: qIndex,
          videoId: req.file.filename,
          size: req.file.size,
          duration: req.body.duration,
          transcriptionStatus: "pending",
          cloudinary: cloudinaryAsset
            ? { publicId: cloudinaryAsset.publicId, url: cloudinaryAsset.url }
            : null,
        },
      });
    } catch (error) {
      Logger.error("Video upload error:", error);

      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          Logger.warn("Failed to cleanup uploaded file:", cleanupError);
        }
      }

      return res.status(500).json({
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
    // CHANGED
    const userId = req.user?.id;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
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
      (interview.videoSession.endedAt - interview.videoSession.startedAt) /
        MC.MS_PER_SEC
    );

    await interview.save();

    return res.json({
      success: true,
      message: "Video recording session stopped",
      data: {
        sessionId: interview._id,
        totalRecordings: interview.videoSession.recordings.length,
        totalDuration: interview.videoSession.totalDuration,
      },
    });
  } catch (error) {
    Logger.error("Stop video recording error:", error);
    return res.status(500).json({
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
      // CHANGED
      const userId = req.user?.id;
      const { interviewId, questionIndex } = req.params;

      const interview = await Interview.findOne({
        _id: interviewId,
        user: userId,
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

      // Prefer Cloudinary asset when available
      if (question.video.cloudinary && question.video.cloudinary.url) {
        return res.json({
          success: true,
          message: "Video found",
          data: {
            videoUrl: question.video.cloudinary.url,
            cdn: true,
            duration:
              question.video.duration || question.video.cloudinary.duration,
            uploadedAt: question.video.uploadedAt,
            questionIndex: qIndex,
          },
        });
      }

      const videoPath = path.join(
        __dirname,
        "../../uploads/videos",
        question.video.filename
      );
      try {
        await fs.access(videoPath);
      } catch (error) {
        return res
          .status(404)
          .json({ success: false, message: "Video file not found" });
      }
      return res.json({
        success: true,
        message: "Video found",
        data: {
          videoUrl: `/api/video/stream/${question.video.filename}`,
          cdn: false,
          duration: question.video.duration,
          uploadedAt: question.video.uploadedAt,
          questionIndex: qIndex,
        },
      });
    } catch (error) {
      Logger.error("Get video playback error:", error);
      return res.status(500).json({
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
    // CHANGED
    const userId = req.user?.id;

    const interview = await Interview.findOne({
      user: userId,
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

        const PARTIAL_CONTENT = 206; // HTTP 206
        res.status(PARTIAL_CONTENT).set({
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunkSize,
        });

        const fs = require("fs");
        const stream = fs.createReadStream(videoPath, { start, end });
        stream.pipe(res);
        return null; // satisfy lint: explicit return after piping
      } else {
        const fs = require("fs");
        const stream = fs.createReadStream(videoPath);
        stream.pipe(res);
        return null; // satisfy lint: explicit return after piping
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Video file not found",
      });
    }
  } catch (error) {
    Logger.error("Video streaming error:", error);
    return res.status(500).json({
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
    // CHANGED
    const userId = req.user?.id;
    const { interviewId, questionIndex } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
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
      Logger.error("Failed to delete video file:", error);
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

    return res.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    Logger.error("Delete video error:", error);
    return res.status(500).json({
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
    // CHANGED
    const userId = req.user?.id;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
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
        const transcriptionStatus = transcriptionService.getTranscriptionStatus(
          question.video
        );
        videoSummary.recordings.push({
          questionIndex: index,
          questionText: `${question.questionText.substring(
            0,
            MC.SUMMARY_TRUNCATE_LEN
          )}...`,
          filename: question.video.filename,
          duration: question.video.duration,
          uploadedAt: question.video.uploadedAt,
          playbackUrl: `/api/video/stream/${question.video.filename}`,
          transcription: transcriptionStatus,
        });
      }
    });

    return res.json({
      success: true,
      message: "Video summary retrieved",
      data: videoSummary,
    });
  } catch (error) {
    Logger.error("Get video summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get video summary",
    });
  }
});

// @desc    Get transcription for a specific video
// @route   GET /api/video/transcript/:interviewId/:questionIndex
// @access  Private
router.get(
  "/transcript/:interviewId/:questionIndex",
  requireAuth,
  async (req, res) => {
    try {
      // CHANGED
      const userId = req.user?.id;
      const { interviewId, questionIndex } = req.params;

      const interview = await Interview.findOne({
        _id: interviewId,
        user: userId,
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

      const transcriptionStatus = transcriptionService.getTranscriptionStatus(
        question.video
      );

      return res.json({
        success: true,
        message: "Transcription status retrieved",
        data: {
          questionIndex: qIndex,
          transcription: transcriptionStatus,
          video: {
            filename: question.video.filename,
            duration: question.video.duration,
            uploadedAt: question.video.uploadedAt,
          },
        },
      });
    } catch (error) {
      Logger.error("Get transcription error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get transcription",
      });
    }
  }
);

// @desc    Retry transcription for a specific video if previously failed or not started
// @route   POST /api/video/transcript/:interviewId/:questionIndex/retry
// @access  Private
router.post(
  "/transcript/:interviewId/:questionIndex/retry",
  requireAuth,
  async (req, res) => {
    try {
      // CHANGED
      const userId = req.user?.id;
      const { interviewId, questionIndex } = req.params;
      const qIndex = parseInt(questionIndex);

      const interview = await Interview.findOne({
        _id: interviewId,
        user: userId,
      });
      if (!interview)
        return res
          .status(404)
          .json({ success: false, message: "Interview not found" });
      if (qIndex >= interview.questions.length)
        return res
          .status(400)
          .json({ success: false, message: "Invalid question index" });

      const question = interview.questions[qIndex];
      if (!question.video || !question.video.filename) {
        return res.status(404).json({
          success: false,
          message: "No video found for this question",
        });
      }

      const currentStatus = transcriptionService.getTranscriptionStatus(
        question.video
      );
      if (currentStatus.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "Transcription already in progress",
        });
      }

      // Kick off async transcription
      const uploadDir = path.join(__dirname, "../../uploads/videos");
      const videoPath = path.join(uploadDir, question.video.filename);
      transcriptionService
        .processVideoTranscription(
          interview,
          qIndex,
          videoPath,
          question.video.filename
        )
        .catch((err) =>
          Logger.error("Retry transcription background error:", err)
        );

      return res.json({
        success: true,
        message: "Transcription retry started",
        data: { status: "pending" },
      });
    } catch (error) {
      Logger.error("Retry transcription error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to retry transcription" });
    }
  }
);

module.exports = router;
