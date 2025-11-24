import { useState, useCallback, useRef, useEffect } from "react";
import { apiService } from "../services/api";

/**
 * Custom hook for capturing and analyzing emotions during video recording
 * Extracts frames periodically and sends them to the emotion analysis service
 */
/**
 * useEmotionCapture
 * @param {object} webcamRef - ref to webcam component
 * @param {string|null} interviewId - current interview id
 * @param {number|null} questionIndex - current question index
 * @param {function|null} onEmotionDataPoint - optional callback invoked with each new emotion data point
 */
const useEmotionCapture = (
  webcamRef,
  interviewId,
  questionIndex,
  onEmotionDataPoint = null
) => {
  const [emotionTimeline, setEmotionTimeline] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const captureIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const interviewIdRef = useRef(interviewId);
  const questionIndexRef = useRef(questionIndex);

  // Update refs when props change
  useEffect(() => {
    interviewIdRef.current = interviewId;
    questionIndexRef.current = questionIndex;
  }, [interviewId, questionIndex]);

  /**
   * Convert webcam frame to base64 image
   */
  const captureFrame = useCallback(() => {
    if (!webcamRef?.current) {
      return null;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        return null;
      }

      // Remove data URL prefix to get pure base64
      const base64 = imageSrc.replace(/^data:image\/\w+;base64,/, "");
      return base64;
    } catch (err) {
      return null;
    }
  }, [webcamRef]);

  /**
   * Send frame to backend for analysis
   */
  const analyzeFrame = useCallback(
    async (frame, timestamp) => {
      try {
        const response = await apiService.post(
          "/emotion/analyze",
          {
            frame,
            timestamp,
            interviewId: interviewIdRef.current,
            questionIndex: questionIndexRef.current,
          },
          {
            timeout: 12000, // 12 second timeout
          }
        );

        if (response.success) {
          return response;
        } else {
          throw new Error(response.message || "Analysis failed");
        }
      } catch (err) {
        throw err;
      }
    },
    [] // Use refs to avoid recreation
  );

  /**
   * Capture and analyze a single frame
   */
  const captureAndAnalyze = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) {
      return;
    }

    const timestamp = Date.now() - startTimeRef.current;

    try {
      const result = await analyzeFrame(frame, timestamp);

      if (result && result.data) {
        // Extract emotion data from the response
        const emotionData = result.data;
        const newDataPoint = {
          timestamp: emotionData.timestamp || timestamp,
          emotion: emotionData.emotion,
          emotions: emotionData.emotions, // smoothed emotions
          confidence: emotionData.confidence,
          rawEmotions:
            emotionData.rawEmotions || emotionData.raw_emotions || null,
          contributions: emotionData.contributions || null,
          smoothing: emotionData.smoothing || null,
        };

        setEmotionTimeline((prev) => [...prev, newDataPoint]);

        // Notify parent component of new data point
        if (onEmotionDataPoint) {
          onEmotionDataPoint(newDataPoint);
        }
      }
    } catch (err) {
      // Don't set error state for connection issues to avoid spamming UI
      if (!err.message?.includes("unavailable")) {
        setError(err.message);
      }
    }
  }, [captureFrame, analyzeFrame, onEmotionDataPoint]);

  /**
   * Start emotion capture (every 3 seconds)
   */
  const startCapture = useCallback(() => {
    if (isCapturing) {
      return;
    }

    setIsCapturing(true);
    setError(null);
    setEmotionTimeline([]);
    startTimeRef.current = Date.now();

    // Capture immediately
    captureAndAnalyze();

    // Then capture every 3 seconds
    captureIntervalRef.current = setInterval(() => {
      captureAndAnalyze();
    }, 3000);
  }, [isCapturing, captureAndAnalyze]);

  /**
   * Stop emotion capture
   */
  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  /**
   * Reset emotion timeline
   */
  const resetTimeline = useCallback(() => {
    setEmotionTimeline([]);
    setError(null);
  }, []);

  /**
   * Get emotion summary for the current timeline
   */
  const getEmotionSummary = useCallback(() => {
    if (emotionTimeline.length === 0) {
      return null;
    }

    // Count dominant emotions
    const emotionCounts = {};
    emotionTimeline.forEach((entry) => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });

    // Find dominant emotion
    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    // Calculate distribution
    const total = emotionTimeline.length;
    const distribution = {};
    Object.keys(emotionCounts).forEach((emotion) => {
      distribution[emotion] = ((emotionCounts[emotion] / total) * 100).toFixed(
        1
      );
    });

    // Average confidence
    const avgConfidence =
      emotionTimeline.reduce((sum, entry) => sum + entry.confidence, 0) /
      emotionTimeline.length;

    return {
      dominantEmotion,
      distribution,
      averageConfidence: avgConfidence.toFixed(2),
      totalFrames: emotionTimeline.length,
      timeline: emotionTimeline,
    };
  }, [emotionTimeline]);

  return {
    emotionTimeline,
    isCapturing,
    error,
    startCapture,
    stopCapture,
    resetTimeline,
    getEmotionSummary,
  };
};

export default useEmotionCapture;
