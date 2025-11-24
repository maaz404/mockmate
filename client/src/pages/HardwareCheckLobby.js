import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Webcam from "react-webcam";
import { useLanguage } from "../context/LanguageContext";

const HardwareCheckLobby = () => {
  const navigate = useNavigate();
  const { id: interviewId } = useParams();
  const webcamRef = useRef(null);
  const { t, language, labels } = useLanguage();
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  // Update audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalized = Math.min(100, (average / 128) * 100);

    setAudioLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  // Request camera and microphone permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        setIsChecking(true);
        setPermissionError(null);

        // Request both video and audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Setup audio visualization
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        // Start audio level monitoring
        updateAudioLevel();

        // Permissions granted
        setPermissionsGranted(true);
        setIsChecking(false);

        // Stop the initial stream (Webcam component will request its own)
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Permission error:", err);
        setIsChecking(false);

        // Handle specific error types
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermissionError(
            "Please enable your camera and microphone to continue. Click the lock icon in your browser's address bar to allow access."
          );
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          setPermissionError(
            "No camera or microphone found. Please connect a device and refresh."
          );
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          setPermissionError(
            "Camera or microphone is already in use by another application."
          );
        } else {
          setPermissionError(
            "Unable to access camera/microphone. Please check your browser settings."
          );
        }
      }
    };

    requestPermissions();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [updateAudioLevel]);

  const handleBeginInterview = () => {
    // Navigate to the actual interview screen
    navigate(`/interview/${interviewId}/experience`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-surface-900 dark:to-surface-800 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t("hardware_check_title")}
              </h1>
              <p className="text-primary-100">{t("hardware_check_subtitle")}</p>
            </div>
            <span className="text-sm bg-primary-500/20 px-3 py-1 rounded-full border border-white/30 font-medium">
              🌐 {labels[language]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Webcam View */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
              📹 {t("camera_preview")}
            </h2>
            <div className="relative aspect-video bg-surface-900 rounded-xl overflow-hidden shadow-lg border-4 border-surface-200 dark:border-surface-700">
              {permissionsGranted ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user",
                  }}
                  className="w-full h-full object-cover"
                />
              ) : isChecking ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">
                      {t("requesting_permissions")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <svg
                      className="w-20 h-20 text-surface-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-surface-400 text-lg">
                      {t("no_camera_access")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Microphone Meter */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
              🎤 {t("microphone_level")}
              {permissionsGranted && audioLevel > 5 && (
                <span className="text-sm text-green-600 dark:text-green-400 animate-pulse">
                  {t("detecting_sound")}
                </span>
              )}
            </h2>
            <div className="bg-surface-100 dark:bg-surface-700 rounded-xl p-4">
              <div className="relative h-8 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100 ease-out rounded-full"
                  style={{ width: `${audioLevel}%` }}
                ></div>
                {!permissionsGranted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-surface-500">
                      {t("waiting_for_permission")}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                {permissionsGranted
                  ? t("speak_to_meter")
                  : t("grant_permissions_mic")}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {permissionError && (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                    {t("permission_required_title")}
                  </h3>
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    {permissionError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {permissionsGranted && (
            <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                    {t("all_set_title")}
                  </h3>
                  <p className="text-green-700 dark:text-green-400 text-sm">
                    {t("all_set_desc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Begin Interview Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleBeginInterview}
              disabled={!permissionsGranted}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all transform ${
                permissionsGranted
                  ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 hover:scale-105 shadow-lg hover:shadow-xl"
                  : "bg-surface-300 dark:bg-surface-600 text-surface-500 dark:text-surface-400 cursor-not-allowed opacity-60"
              }`}
            >
              {permissionsGranted
                ? t("begin_interview")
                : t("waiting_for_permissions")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareCheckLobby;
