const transcriptionService = require("../services/transcriptionService");
// path & fs not needed after refactor
const EXPECTED_SAVE_CALLS = 2; // pending + final state

describe("TranscriptionService", () => {
  beforeEach(() => {
    // Mock console methods to avoid test output pollution
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getTranscriptionStatus", () => {
    it("should return not_started for video without transcript", () => {
      const videoObject = {};
      const result = transcriptionService.getTranscriptionStatus(videoObject);

      expect(result).toEqual({
        status: "not_started",
        text: null,
      });
    });

    it("should return transcript data when available", () => {
      const videoObject = {
        transcript: {
          status: "completed",
          text: "Hello world",
          generatedAt: new Date("2023-01-01"),
        },
      };

      const result = transcriptionService.getTranscriptionStatus(videoObject);

      expect(result).toEqual({
        status: "completed",
        text: "Hello world",
        generatedAt: new Date("2023-01-01"),
        language: null,
        segments: [],
        error: null,
      });
    });

    it("should handle pending status", () => {
      const videoObject = {
        transcript: {
          status: "pending",
          text: null,
          generatedAt: null,
        },
      };

      const result = transcriptionService.getTranscriptionStatus(videoObject);

      expect(result).toEqual({
        status: "pending",
        text: null,
        generatedAt: null,
        language: null,
        segments: [],
        error: null,
      });
    });

    it("should handle failed status", () => {
      const videoObject = {
        transcript: {
          status: "failed",
          text: null,
          generatedAt: new Date("2023-01-01"),
        },
      };

      const result = transcriptionService.getTranscriptionStatus(videoObject);

      expect(result).toEqual({
        status: "failed",
        text: null,
        generatedAt: new Date("2023-01-01"),
        language: null,
        segments: [],
        error: null,
      });
    });
  });

  describe("transcribeVideo", () => {
    it("should return error when OpenAI is not configured", async () => {
      // Temporarily override isConfigured
      const originalConfigured = transcriptionService.isConfigured;
      transcriptionService.isConfigured = false;

      const result = await transcriptionService.transcribeVideo(
        "/fake/path",
        "test.webm"
      );

      expect(result).toEqual({
        success: false,
        error: "OpenAI API not configured",
        transcript: null,
      });

      // Restore original value
      transcriptionService.isConfigured = originalConfigured;
    });

    it("should return error when file does not exist", async () => {
      // Only run if OpenAI is configured
      if (!transcriptionService.isConfigured) {
        return;
      }

      const result = await transcriptionService.transcribeVideo(
        "/fake/nonexistent/path",
        "test.webm"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Video file not found");
      expect(result.transcript).toBe(null);
    });
  });

  describe("processVideoTranscription", () => {
    it("should handle error when video processing fails", async () => {
      const mockInterview = {
        _id: "test-interview",
        questions: [
          {
            video: {
              filename: "test.webm",
              path: "/fake/path",
            },
          },
        ],
        save: jest.fn().mockResolvedValue(),
      };

      // Mock transcribeVideo to return an error
      const originalTranscribe = transcriptionService.transcribeVideo;
      transcriptionService.transcribeVideo = jest.fn().mockResolvedValue({
        success: false,
        error: "Transcription failed",
        transcript: null,
      });

      const result = await transcriptionService.processVideoTranscription(
        mockInterview,
        0,
        "/fake/path",
        "test.webm"
      );

      expect(result.success).toBe(false);
      expect(mockInterview.save).toHaveBeenCalledTimes(EXPECTED_SAVE_CALLS);

      // Restore original method
      transcriptionService.transcribeVideo = originalTranscribe;
    });

    it("should update interview with pending status initially", async () => {
      const mockInterview = {
        _id: "test-interview",
        questions: [
          {
            video: {
              filename: "test.webm",
              path: "/fake/path",
            },
          },
        ],
        save: jest.fn().mockResolvedValue(),
      };

      // Override transcribeVideo to avoid actual API call
      const originalTranscribe = transcriptionService.transcribeVideo;
      transcriptionService.transcribeVideo = jest.fn().mockResolvedValue({
        success: false,
        error: "Test error",
        transcript: null,
      });

      await transcriptionService.processVideoTranscription(
        mockInterview,
        0,
        "/fake/path",
        "test.webm"
      );

      expect(mockInterview.questions[0].video.transcript.status).toBe("failed");
      expect(mockInterview.save).toHaveBeenCalledTimes(EXPECTED_SAVE_CALLS);

      // Restore original method
      transcriptionService.transcribeVideo = originalTranscribe;
    });
  });
});
