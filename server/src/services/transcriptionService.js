const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

class TranscriptionService {
  constructor() {
    this.isConfigured = !!process.env.OPENAI_API_KEY;
    
    if (this.isConfigured) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn("OpenAI API key not configured. Transcription features will be disabled.");
      this.openai = null;
    }
  }

  /**
   * Transcribe a video file using OpenAI Whisper API
   * @param {string} videoFilePath - Path to the video file
   * @param {string} filename - Original filename for context
   * @param {Object} options - Transcription options
   * @param {string} options.language - Language code (optional, auto-detect if not provided)
   * @param {string} options.expectedLanguage - Expected interview language for validation
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeVideo(videoFilePath, filename, options = {}) {
    try {
      if (!this.isConfigured) {
        console.warn("OpenAI not configured, skipping transcription");
        return {
          success: false,
          error: "OpenAI API not configured",
          transcript: null
        };
      }

      // Check if file exists
      if (!fs.existsSync(videoFilePath)) {
        throw new Error(`Video file not found: ${videoFilePath}`);
      }

      // Get file stats to check size (Whisper has a 25MB limit)
      const stats = fs.statSync(videoFilePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      if (fileSizeInMB > 25) {
        console.warn(`File ${filename} is ${fileSizeInMB.toFixed(2)}MB, exceeding Whisper's 25MB limit`);
        return {
          success: false,
          error: "File too large for transcription (max 25MB)",
          transcript: null
        };
      }

      console.log(`Starting transcription for ${filename} (${fileSizeInMB.toFixed(2)}MB)`);

      // Create a readable stream for the video file
      const audioFile = fs.createReadStream(videoFilePath);
      
      // Prepare transcription options
      const transcriptionOptions = {
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json", // Get detailed response with timestamps
        temperature: 0.2 // Lower temperature for more consistent transcription
      };

      // Use auto-detection if no language specified, otherwise use provided language
      if (options.language && options.language !== 'auto') {
        transcriptionOptions.language = options.language;
      }
      // If no language specified, Whisper will auto-detect

      // Call OpenAI Whisper API
      const transcription = await this.openai.audio.transcriptions.create(transcriptionOptions);

      console.log(`Transcription completed for ${filename}. Detected language: ${transcription.language}`);

      return {
        success: true,
        transcript: {
          text: transcription.text,
          duration: transcription.duration,
          detectedLanguage: transcription.language, // Language detected by Whisper
          expectedLanguage: options.expectedLanguage, // Expected interview language
          segments: transcription.segments || [],
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error("Transcription error:", error);
      
      // Handle specific OpenAI errors
      if (error.status === 400) {
        return {
          success: false,
          error: "Invalid file format or file too large",
          transcript: null
        };
      } else if (error.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded, please try again later",
          transcript: null
        };
      } else if (error.status === 401) {
        return {
          success: false,
          error: "Invalid OpenAI API key",
          transcript: null
        };
      }

      return {
        success: false,
        error: error.message || "Unknown transcription error",
        transcript: null
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
  async processVideoTranscription(interview, questionIndex, videoFilePath, filename) {
    try {
      console.log(`Processing transcription for interview ${interview._id}, question ${questionIndex}`);

      // Update status to pending
      if (interview.questions[questionIndex].video) {
        interview.questions[questionIndex].video.transcript = {
          text: null,
          generatedAt: null,
          status: 'pending'
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
          status: 'completed'
        };
        
        console.log(`Transcription successful for interview ${interview._id}, question ${questionIndex}`);
      } else {
        interview.questions[questionIndex].video.transcript = {
          text: null,
          generatedAt: new Date(),
          status: 'failed'
        };
        
        console.error(`Transcription failed for interview ${interview._id}, question ${questionIndex}:`, result.error);
      }

      await interview.save();
      return result;

    } catch (error) {
      console.error("Error processing video transcription:", error);
      
      // Update status to failed if possible
      try {
        if (interview.questions[questionIndex].video) {
          interview.questions[questionIndex].video.transcript = {
            text: null,
            generatedAt: new Date(),
            status: 'failed'
          };
          await interview.save();
        }
      } catch (saveError) {
        console.error("Error saving failed transcription status:", saveError);
      }

      return {
        success: false,
        error: error.message,
        transcript: null
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
      return { status: 'not_started', text: null };
    }

    return {
      status: videoObject.transcript.status,
      text: videoObject.transcript.text,
      generatedAt: videoObject.transcript.generatedAt
    };
  }
}

module.exports = new TranscriptionService();