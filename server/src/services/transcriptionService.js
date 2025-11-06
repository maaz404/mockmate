/* eslint-disable no-console */
const OpenAI = require("openai");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const MC = require("../utils/mediaConstants");

const WHISPER_MAX_FILE_MB = 25;
const TO_FIXED_2 = 2;
const MP3_BITRATE_KBPS = 128;
const HTTP_429 = 429;

if (ffmpegPath) {
  try {
    ffmpeg.setFfmpegPath(ffmpegPath);
  } catch (_) {}
}

class TranscriptionService {
  constructor() {
    this.isConfigured = !!process.env.OPENAI_API_KEY;

    if (this.isConfigured) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn(
        "OpenAI API key not configured. Transcription features will be disabled."
      );
      this.openai = null;
    }
  }

  /**
   * Transcribe a video file using OpenAI Whisper API
   * @param {string} videoFilePath - Path to the video file
   * @param {string} filename - Original filename for context
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeVideo(videoFilePath, filename) {
    try {
      if (!this.isConfigured) {
        console.warn("OpenAI not configured, skipping transcription");
        return {
          success: false,
          error: "OpenAI API not configured",
          transcript: null,
        };
      }

      // Check if file exists
      if (!fs.existsSync(videoFilePath)) {
        throw new Error(`Video file not found: ${videoFilePath}`);
      }

      // Get file stats to check size (Whisper has a 25MB limit)
      const stats = fs.statSync(videoFilePath);
      const fileSizeInMB = stats.size / MC.BYTES_PER_MB;

      if (fileSizeInMB > WHISPER_MAX_FILE_MB) {
        console.warn(
          `File ${filename} is ${fileSizeInMB.toFixed(
            TO_FIXED_2
          )}MB, exceeding Whisper's ${WHISPER_MAX_FILE_MB}MB limit`
        );
        return {
          success: false,
          error: "File too large for transcription (max 25MB)",
          transcript: null,
        };
      }

      console.log(
        `Starting transcription for ${filename} (${fileSizeInMB.toFixed(
          TO_FIXED_2
        )}MB)`
      );

      // First attempt: try original file
      const attemptTranscription = async (filePathForApi) => {
        const audioFile = fs.createReadStream(filePathForApi);
        return await this.openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en",
          response_format: "verbose_json",
          temperature: 0.2,
        });
      };

      let transcription;
      try {
        transcription = await attemptTranscription(videoFilePath);
      } catch (primaryErr) {
        // If format not accepted, try to transcode to MP3 and retry
        const msg = (primaryErr?.message || "").toLowerCase();
        const status = primaryErr?.status || 0;
        const ext = path.extname(filename || videoFilePath).toLowerCase();
        const shouldTranscode =
          status === 400 ||
          msg.includes("invalid file format") ||
          [".webm", ".mkv", ".mov"].includes(ext);

        if (shouldTranscode && ffmpegPath) {
          const tmpDir = path.join(path.dirname(videoFilePath), "tmp");
          try {
            await fsp.mkdir(tmpDir, { recursive: true });
          } catch (_) {}
          const mp3Path = path.join(
            tmpDir,
            `${path.basename(videoFilePath, path.extname(videoFilePath))}.mp3`
          );

          await new Promise((resolve, reject) => {
            ffmpeg(videoFilePath)
              .audioCodec("libmp3lame")
              .audioBitrate(MP3_BITRATE_KBPS)
              .toFormat("mp3")
              .on("error", reject)
              .on("end", resolve)
              .save(mp3Path);
          });

          try {
            transcription = await attemptTranscription(mp3Path);
          } finally {
            // Cleanup converted file
            try {
              await fsp.unlink(mp3Path);
            } catch (_) {}
          }
        } else {
          throw primaryErr;
        }
      }

      console.log(`Transcription completed for ${filename}`);

      return {
        success: true,
        transcript: {
          text: transcription.text,
          duration: transcription.duration,
          language: transcription.language,
          segments: transcription.segments || [],
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error("Transcription error:", error);

      // Handle specific OpenAI errors
      if (error.status === 400) {
        return {
          success: false,
          error: "Invalid file format or file too large",
          transcript: null,
        };
      } else if (error.status === HTTP_429) {
        return {
          success: false,
          error: "Rate limit exceeded, please try again later",
          transcript: null,
        };
      } else if (error.status === 401) {
        return {
          success: false,
          error: "Invalid OpenAI API key",
          transcript: null,
        };
      }

      return {
        success: false,
        error: error.message || "Unknown transcription error",
        transcript: null,
      };
    }
  }

  /**
   * Process transcription asynchronously for a video upload
   * @param {Object} interview - Interview document
   * @param {number} questionIndex - Index of the question
   * @param {string} videoFilePath - Path to the video file
   * @param {string} filename - Original filename
   */
  async processVideoTranscription(
    interview,
    questionIndex,
    videoFilePath,
    filename
  ) {
    try {
      console.log(
        `Processing transcription for interview ${interview._id}, question ${questionIndex}`
      );

      // Update status to pending
      if (interview.questions[questionIndex].video) {
        interview.questions[questionIndex].video.transcript = {
          text: null,
          generatedAt: null,
          status: "pending",
        };
        await interview.save();
      }

      // Perform transcription
      const result = await this.transcribeVideo(videoFilePath, filename);

      // Update the interview with transcription results
      if (result.success && result.transcript) {
        interview.questions[questionIndex].video.transcript = {
          text: result.transcript.text,
          generatedAt: result.transcript.generatedAt,
          status: "completed",
          language: result.transcript.language,
          segments: result.transcript.segments || [],
        };

        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(
            `Transcription successful for interview ${interview._id}, question ${questionIndex}`
          );
        }
      } else {
        interview.questions[questionIndex].video.transcript = {
          text: null,
          generatedAt: new Date(),
          status: "failed",
          error: result.error || "Unknown transcription error",
        };

        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error(
            `Transcription failed for interview ${interview._id}, question ${questionIndex}:`,
            result.error
          );
        }
      }

      await interview.save();
      return result;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Error processing video transcription:", error);
      }

      // Update status to failed if possible
      try {
        if (interview.questions[questionIndex].video) {
          interview.questions[questionIndex].video.transcript = {
            text: null,
            generatedAt: new Date(),
            status: "failed",
            error: error.message || "Unknown transcription error",
          };
          await interview.save();
        }
      } catch (saveError) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error saving failed transcription status:", saveError);
        }
      }

      return {
        success: false,
        error: error.message,
        transcript: null,
      };
    }
  }

  /**
   * Get transcription status for a video
   * @param {Object} videoObject - Video object from interview question
   * @returns {Object} - Transcription status
   */
  getTranscriptionStatus(videoObject) {
    if (!videoObject || !videoObject.transcript) {
      return { status: "not_started", text: null };
    }

    return {
      status: videoObject.transcript.status,
      text: videoObject.transcript.text,
      generatedAt: videoObject.transcript.generatedAt,
      language: videoObject.transcript.language || null,
      segments: videoObject.transcript.segments || [],
      error: videoObject.transcript.error || null,
    };
  }
}

module.exports = new TranscriptionService();
