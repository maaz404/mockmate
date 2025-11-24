import { useState, useEffect, useRef, useCallback } from "react";
import facialAnalysisService from "../services/facialAnalysisService";

export const useFacialExpressionAnalysis = (enabled = true) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [metrics, setMetrics] = useState({
    eyeContact: 0,
    blinkRate: 0,
    headSteadiness: 0,
    smilePercentage: 0,
    offScreenPercentage: 0,
    confidenceScore: 0,
    environmentQuality: 0,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [baseline, setBaseline] = useState(null);

  const videoElementRef = useRef(null);
  const calibrationIntervalRef = useRef(null);

  // Initialize the facial analysis service
  const initialize = useCallback(async () => {
    if (!enabled) return false;

    try {
      setError(null);
      const success = await facialAnalysisService.initialize();
      setIsInitialized(success);
      return success;
    } catch (err) {
      setError("Failed to initialize facial analysis");
      setIsInitialized(false);
      return false;
    }
  }, [enabled]);

  // Start baseline calibration
  const startCalibration = useCallback(
    async (videoElement) => {
      if (!isInitialized || !videoElement) return false;

      try {
        setIsCalibrating(true);
        setCalibrationProgress(0);
        setError(null);

        videoElementRef.current = videoElement;

        // Update calibration progress
        const progressInterval = setInterval(() => {
          setCalibrationProgress((prev) => {
            const newProgress = prev + 10;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return newProgress;
          });
        }, 1000);

        calibrationIntervalRef.current = progressInterval;

        const baselineData = await facialAnalysisService.startBaseline(
          videoElement
        );
        setBaseline(baselineData);
        setIsCalibrating(false);
        setCalibrationProgress(100);

        return true;
      } catch (err) {
        setError("Calibration failed");
        setIsCalibrating(false);
        setCalibrationProgress(0);
        return false;
      }
    },
    [isInitialized]
  );

  // Start facial expression analysis
  const startAnalysis = useCallback(
    (videoElement) => {
      if (!isInitialized || !videoElement) return false;

      try {
        setError(null);
        videoElementRef.current = videoElement;

        facialAnalysisService.startAnalysis(videoElement, (newMetrics) => {
          setMetrics(newMetrics);

          // Update recommendations periodically (every 30 seconds)
          const summary = facialAnalysisService.getSessionSummary();
          setRecommendations(summary.recommendations);
        });

        setIsAnalyzing(true);
        return true;
      } catch (err) {
        setError("Failed to start analysis");
        return false;
      }
    },
    [isInitialized]
  );

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    facialAnalysisService.stopAnalysis();
    setIsAnalyzing(false);
  }, []);

  // Get session summary
  const getSessionSummary = useCallback(() => {
    return facialAnalysisService.getSessionSummary();
  }, []);

  // Reset analysis state
  const reset = useCallback(() => {
    stopAnalysis();
    setMetrics({
      eyeContact: 0,
      blinkRate: 0,
      headSteadiness: 0,
      smilePercentage: 0,
      offScreenPercentage: 0,
      confidenceScore: 0,
      environmentQuality: 0,
    });
    setRecommendations([]);
    setBaseline(null);
    setCalibrationProgress(0);
    setError(null);
  }, [stopAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (calibrationIntervalRef.current) {
        clearInterval(calibrationIntervalRef.current);
      }
      facialAnalysisService.cleanup();
    };
  }, []);

  // Auto-initialize when enabled
  useEffect(() => {
    if (enabled && !isInitialized) {
      initialize();
    }
  }, [enabled, isInitialized, initialize]);

  return {
    // State
    isInitialized,
    isCalibrating,
    isAnalyzing,
    calibrationProgress,
    metrics,
    recommendations,
    baseline,
    error,

    // Actions
    initialize,
    startCalibration,
    startAnalysis,
    stopAnalysis,
    getSessionSummary,
    reset,
  };
};
