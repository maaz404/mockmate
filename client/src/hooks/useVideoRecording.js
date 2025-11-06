import { useState, useRef, useCallback, useEffect } from "react";
import videoService from "../services/videoService";

export const useVideoRecording = (interviewId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const startTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const recordingMimeTypeRef = useRef("video/webm");

  // Start video recording session with the backend
  const startSession = useCallback(async () => {
    try {
      setError(null);
      // eslint-disable-next-line no-console
      console.log(
        "[useVideoRecording] Starting session for interviewId:",
        interviewId
      );

      // Validate a likely ObjectId format (24 hex chars) before calling backend
      const isLikelyObjectId =
        typeof interviewId === "string" &&
        /^[a-fA-F0-9]{24}$/.test(interviewId);
      if (!isLikelyObjectId) {
        // eslint-disable-next-line no-console
        console.warn(
          "[useVideoRecording] Invalid interview ID format, entering demo mode:",
          interviewId
        );
        // Skip API call entirely and enter demo mode
        setDemoMode(true);
        setSessionStarted(true);
        return;
      }
      await videoService.startRecordingSession(interviewId);
      // eslint-disable-next-line no-console
      console.log("[useVideoRecording] Recording session started successfully");
      setSessionStarted(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[useVideoRecording] Failed to start session:", err);
      // eslint-disable-next-line no-console
      console.error("[useVideoRecording] Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      // If backend rejects due to invalid ID format or not found, drop into demo mode instead of failing hard
      const msg = err?.message?.toLowerCase?.() || "";
      if (
        msg.includes("invalid interview id") ||
        msg.includes("not found") ||
        err?.code === "INVALID_INTERVIEW_ID"
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          "[useVideoRecording] Backend rejected ID, entering demo mode"
        );
        setDemoMode(true);
        setSessionStarted(true);
        setError(null);
      } else {
        setError("Failed to start recording session");
      }
    }
  }, [interviewId]);

  // Start recording for a question
  const startRecording = useCallback(async (stream) => {
    try {
      setError(null);
      recordedChunksRef.current = [];

      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder not supported in this browser");
      }

      // Try different codecs based on browser support
      let mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/mp4";
        }
      }

      // eslint-disable-next-line no-console
      console.log(
        "[useVideoRecording] Starting recording with mimeType:",
        mimeType
      );

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      recordingMimeTypeRef.current = mediaRecorder.mimeType || mimeType;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        // eslint-disable-next-line no-console
        console.log("[useVideoRecording] Recording started");
        setIsRecording(true);
        setHasRecorded(false);
        setRecordingDuration(0);
        startTimeRef.current = Date.now();

        // Update duration every second
        durationIntervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            setRecordingDuration(
              Math.floor((Date.now() - startTimeRef.current) / 1000)
            );
          }
        }, 1000);
      };

      mediaRecorder.onstop = () => {
        // eslint-disable-next-line no-console
        console.log(
          "[useVideoRecording] Recording stopped, chunks:",
          recordedChunksRef.current.length
        );
        setIsRecording(false);
        setHasRecorded(true);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        // Ensure we finalize duration even if interval hasn't ticked yet
        if (startTimeRef.current) {
          const finalSec = Math.max(
            0,
            Math.floor((Date.now() - startTimeRef.current) / 1000)
          );
          setRecordingDuration(finalSec);
        }
      };

      mediaRecorder.onerror = (err) => {
        // eslint-disable-next-line no-console
        console.error("[useVideoRecording] MediaRecorder error:", err);
        setError("Recording error occurred");
      };

      mediaRecorderRef.current = mediaRecorder;
      // Provide timeslice so that dataavailable fires periodically and buffers flush
      try {
        mediaRecorder.start(1000); // emit data every 1s
      } catch (_) {
        mediaRecorder.start();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[useVideoRecording] Failed to start recording:", err);
      setError(err.message || "Failed to start recording");
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Upload recorded video for a specific question
  const uploadVideo = useCallback(
    async (questionIndex, facialAnalysisData = null) => {
      if (!hasRecorded || recordedChunksRef.current.length === 0) {
        setError("No recording to upload");
        return false;
      }

      try {
        setIsUploading(true);
        setError(null);
        const effectiveType =
          (recordedChunksRef.current[0] && recordedChunksRef.current[0].type) ||
          recordingMimeTypeRef.current ||
          "video/webm";
        const blob = new Blob(recordedChunksRef.current, {
          type: effectiveType,
        });
        // eslint-disable-next-line no-console
        console.log("[useVideoRecording] Uploading video blob:", {
          size: blob.size,
          type: blob.type,
          chunks: recordedChunksRef.current.length,
          duration: recordingDuration,
        });
        if (demoMode) {
          // Simulate upload latency
          await new Promise((r) => setTimeout(r, 600));
        } else {
          await videoService.uploadVideo(
            interviewId,
            questionIndex,
            blob,
            recordingDuration,
            facialAnalysisData
          );
        }
        // Clear recorded data after (simulated) upload
        recordedChunksRef.current = [];
        setHasRecorded(false);
        setRecordingDuration(0);
        return true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[useVideoRecording] Upload failed:", err);
        setError(
          err?.message ||
            err?.response?.data?.message ||
            "Failed to upload video"
        );
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [interviewId, hasRecorded, recordingDuration, demoMode]
  );

  // Clear current recording
  const clearRecording = useCallback(() => {
    recordedChunksRef.current = [];
    setHasRecorded(false);
    setRecordingDuration(0);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return {
    isRecording,
    hasRecorded,
    isUploading,
    recordingDuration,
    // Upload is allowed only when we have a finished recording,
    // at least one chunk, and the duration is >= 1 second
    canUpload:
      hasRecorded &&
      recordedChunksRef.current.length > 0 &&
      recordingDuration >= 1,
    error,
    sessionStarted,
    demoMode,
    startSession,
    startRecording,
    stopRecording,
    uploadVideo,
    clearRecording,
  };
};
