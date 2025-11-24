import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useVideoRecording } from "../hooks/useVideoRecording";
import useEmotionCapture from "../hooks/useEmotionCapture";
import toast from "react-hot-toast";

const VideoRecorder = ({
  interviewId,
  currentQuestionIndex,
  onVideoUploaded,
  onRecordingChange,
  onPermissionChange,
  onWebcamReady,
  onTranscriptUpdate,
  onEmotionUpdate,
  audioEnabled = true,
  className = "",
  maxDuration = 180, // seconds (auto-stop)
  enableCountdown = true,
  enableWaveform = true,
  enableTranscript = true,
  hideControls = false,
}) => {
  const webcamRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState({ audioIn: [], videoIn: [] });
  const [selectedDevice, setSelectedDevice] = useState({
    audio: "default",
    video: "default",
  });
  const [videoConstraints, setVideoConstraints] = useState({
    width: 1280,
    height: 720,
    facingMode: "user",
  });
  const [countdown, setCountdown] = useState(null); // null | number
  const [preparing, setPreparing] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const transcriptRestartCountRef = useRef(0);
  const lastRestartTimeRef = useRef(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptConfidence, setTranscriptConfidence] = useState(100);
  const autoStartedRef = useRef(false);

  const {
    isRecording,
    hasRecorded,
    isUploading,
    recordingDuration,
    canUpload,
    error,
    sessionStarted,
    demoMode,
    startSession,
    startRecording,
    stopRecording,
    uploadVideo,
    clearRecording,
  } = useVideoRecording(interviewId);

  // Emotion capture hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const {
    error: emotionError,
    startCapture,
    stopCapture,
    getEmotionSummary,
  } = useEmotionCapture(
    webcamRef,
    interviewId,
    currentQuestionIndex,
    onEmotionUpdate
      ? (dataPoint) => {
          // Send individual data point to parent immediately
          if (onEmotionUpdate) {
            onEmotionUpdate({ timeline: [dataPoint] });
          }
        }
      : null
  );

  // Check camera access on mount
  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Camera API not supported in this browser");
          return;
        }

        // Request camera/mic access to check permissions
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setHasCamera(true);
        // eslint-disable-next-line no-console
        console.log("[VideoRecorder] Camera access granted");
        // Stop the stream immediately as webcam component will handle it
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[VideoRecorder] Camera access error:", err);
        const errorMsg =
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera/microphone permission denied. Click the lock icon in your browser's address bar to allow access."
            : err.name === "NotFoundError" ||
              err.name === "DevicesNotFoundError"
            ? "No camera or microphone found. Please connect a device and refresh."
            : err.name === "NotReadableError"
            ? "Camera is already in use by another application."
            : "Camera access denied or not available";
        setCameraError(errorMsg);
      }
    };

    checkCamera();
  }, []);

  // Expose underlying webcam video element to parent when ready
  useEffect(() => {
    if (typeof onWebcamReady !== "function") return;
    const vid = webcamRef.current?.video || null;
    if (vid) {
      try {
        onWebcamReady(vid);
      } catch (_) {}
    }
  }, [onWebcamReady, webcamRef.current?.video]);

  // Enumerate devices and preselect defaults
  useEffect(() => {
    const enumerate = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const list = await navigator.mediaDevices.enumerateDevices();
        const audioIn = list.filter((d) => d.kind === "audioinput");
        const videoIn = list.filter((d) => d.kind === "videoinput");
        setDevices({ audioIn, videoIn });

        if (videoIn.length && selectedDevice.video === "default") {
          setSelectedDevice((s) => ({ ...s, video: videoIn[0].deviceId }));
          setVideoConstraints((vc) => ({
            ...vc,
            deviceId: { exact: videoIn[0].deviceId },
          }));
        }

        if (audioIn.length && selectedDevice.audio === "default") {
          // Try to find a device with "default" in its label (case-insensitive)
          const defaultDevice = audioIn.find((d) =>
            d.label.toLowerCase().includes("default")
          );
          const selectedAudioDevice = defaultDevice || audioIn[0];
          setSelectedDevice((s) => ({
            ...s,
            audio: selectedAudioDevice.deviceId,
          }));
        }
      } catch (_) {}
    };
    enumerate();
  }, [selectedDevice.video, selectedDevice.audio]);

  // Report permission status to parent
  useEffect(() => {
    if (typeof onPermissionChange === "function") {
      onPermissionChange({ camera: hasCamera, error: cameraError });
    }
  }, [hasCamera, cameraError, onPermissionChange]);

  // Start recording session when component mounts
  // Prevent infinite loop: only depend on hasCamera and sessionStarted
  useEffect(() => {
    if (hasCamera && !sessionStarted) {
      // eslint-disable-next-line no-console
      console.log(
        "[VideoRecorder] Starting recording session for interview:",
        interviewId
      );
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCamera, sessionStarted]);

  // Handle start recording
  const beginRecording = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.stream) {
      setCameraError("Camera stream not available");
      return;
    }
    try {
      await startRecording(webcamRef.current.stream);

      // Start emotion capture
      startCapture();

      // Setup audio meter after recording starts
      if (audioEnabled) {
        try {
          audioCtxRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
          const source = audioCtxRef.current.createMediaStreamSource(
            webcamRef.current.stream
          );
          const analyser = audioCtxRef.current.createAnalyser();
          analyser.fftSize = 512; // Increased for better frequency resolution
          analyser.smoothingTimeConstant = 0.8; // Smoother transitions
          source.connect(analyser);
          analyserRef.current = analyser;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const freqDataArray = new Uint8Array(analyser.frequencyBinCount);

          // Store previous bar heights for smooth interpolation
          const prevBarHeights = new Array(32).fill(0);

          const update = () => {
            analyser.getByteTimeDomainData(dataArray);
            analyser.getByteFrequencyData(freqDataArray);

            if (canvasRef.current) {
              try {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                const rect = canvas.getBoundingClientRect();
                const w = rect.width;
                const h = rect.height;

                // Clear canvas with gradient background
                const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
                bgGradient.addColorStop(0, "rgba(17, 24, 39, 0.95)");
                bgGradient.addColorStop(0.5, "rgba(31, 41, 55, 0.95)");
                bgGradient.addColorStop(1, "rgba(17, 24, 39, 0.95)");
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, w, h);

                // Draw frequency spectrum bars (modern visualization)
                const numBars = 32;
                const barWidth = w / numBars;
                const barGap = barWidth * 0.2;
                const actualBarWidth = barWidth - barGap;

                for (let i = 0; i < numBars; i++) {
                  // Sample frequency data (focus on lower-mid frequencies for voice)
                  const freqIndex = Math.floor(
                    (i / numBars) * (freqDataArray.length * 0.4)
                  );
                  const value = freqDataArray[freqIndex] / 255;

                  // Smooth interpolation
                  const targetHeight = value * h * 0.85;
                  prevBarHeights[i] =
                    prevBarHeights[i] * 0.7 + targetHeight * 0.3;
                  const barHeight = Math.max(2, prevBarHeights[i]);

                  const x = i * barWidth + barGap / 2;
                  const y = h - barHeight;

                  // Create gradient for each bar based on intensity
                  const barGradient = ctx.createLinearGradient(x, y, x, h);

                  if (value > 0.7) {
                    // High intensity - cyan to blue
                    barGradient.addColorStop(0, "rgba(6, 182, 212, 1)");
                    barGradient.addColorStop(0.5, "rgba(14, 165, 233, 0.9)");
                    barGradient.addColorStop(1, "rgba(59, 130, 246, 0.6)");
                  } else if (value > 0.4) {
                    // Medium intensity - emerald to cyan
                    barGradient.addColorStop(0, "rgba(16, 185, 129, 1)");
                    barGradient.addColorStop(0.5, "rgba(6, 182, 212, 0.8)");
                    barGradient.addColorStop(1, "rgba(6, 182, 212, 0.4)");
                  } else {
                    // Low intensity - emerald
                    barGradient.addColorStop(0, "rgba(16, 185, 129, 0.8)");
                    barGradient.addColorStop(0.5, "rgba(16, 185, 129, 0.5)");
                    barGradient.addColorStop(1, "rgba(16, 185, 129, 0.2)");
                  }

                  ctx.fillStyle = barGradient;

                  // Draw rounded rectangle bars
                  const radius = actualBarWidth / 3;
                  ctx.beginPath();
                  ctx.moveTo(x + radius, y);
                  ctx.lineTo(x + actualBarWidth - radius, y);
                  ctx.quadraticCurveTo(
                    x + actualBarWidth,
                    y,
                    x + actualBarWidth,
                    y + radius
                  );
                  ctx.lineTo(x + actualBarWidth, h - radius);
                  ctx.quadraticCurveTo(
                    x + actualBarWidth,
                    h,
                    x + actualBarWidth - radius,
                    h
                  );
                  ctx.lineTo(x + radius, h);
                  ctx.quadraticCurveTo(x, h, x, h - radius);
                  ctx.lineTo(x, y + radius);
                  ctx.quadraticCurveTo(x, y, x + radius, y);
                  ctx.closePath();
                  ctx.fill();

                  // Add glow effect for high values
                  if (value > 0.6) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor =
                      value > 0.8
                        ? "rgba(6, 182, 212, 0.6)"
                        : "rgba(16, 185, 129, 0.4)";
                    ctx.fill();
                    ctx.shadowBlur = 0;
                  }

                  // Add reflection effect at bottom
                  const reflectionGradient = ctx.createLinearGradient(
                    x,
                    h,
                    x,
                    h - 3
                  );
                  reflectionGradient.addColorStop(
                    0,
                    "rgba(255, 255, 255, 0.05)"
                  );
                  reflectionGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                  ctx.fillStyle = reflectionGradient;
                  ctx.fillRect(x, h - 3, actualBarWidth, 3);
                }

                // Draw center line
                ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(0, h / 2);
                ctx.lineTo(w, h / 2);
                ctx.stroke();
                ctx.setLineDash([]);
              } catch (_) {
                /* ignore */
              }
            }
            rafRef.current = requestAnimationFrame(update);
          };
          update();
        } catch (_) {
          // ignore audio meter errors
        }
      }
    } catch (e) {
      setCameraError("Failed to start recording");
    }
  }, [audioEnabled, startRecording, startCapture]);

  const handleStartRecording = async () => {
    if (preparing || isRecording) return;
    if (!webcamRef.current || !webcamRef.current.stream) {
      setCameraError("Camera stream not available");
      return;
    }
    if (enableCountdown) {
      setPreparing(true);
      setCountdown(3);
      let tick = 3;
      const interval = setInterval(() => {
        tick -= 1;
        if (tick <= 0) {
          clearInterval(interval);
          setCountdown(null);
          setPreparing(false);
          beginRecording();
        } else {
          setCountdown(tick);
        }
      }, 1000);
    } else {
      beginRecording();
    }
  };

  // Handle stop recording
  const handleStopRecording = useCallback(() => {
    stopRecording();

    // Stop emotion capture
    stopCapture();

    // Get emotion summary and send to parent
    const summary = getEmotionSummary();
    if (summary && onEmotionUpdate) {
      onEmotionUpdate(summary);
    }
  }, [stopRecording, stopCapture, getEmotionSummary, onEmotionUpdate]);

  // Setup waveform canvas scaling with gradient background
  useEffect(() => {
    if (!enableWaveform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, "rgba(6, 182, 212, 0.03)");
      gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.08)");
      gradient.addColorStop(1, "rgba(6, 182, 212, 0.03)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [enableWaveform]);

  // Auto-start recording when controls are hidden (navigation-only UI)
  useEffect(() => {
    if (
      hideControls &&
      hasCamera &&
      sessionStarted &&
      !isRecording &&
      !preparing &&
      !autoStartedRef.current
    ) {
      autoStartedRef.current = true;
      try {
        // Begin recording with existing countdown logic
        handleStartRecording();
      } catch (_) {}
    }
  }, [hideControls, hasCamera, sessionStarted, isRecording, preparing]);

  // Ensure we stop recording on unmount if controls are hidden
  useEffect(() => {
    return () => {
      if (hideControls && isRecording) {
        try {
          stopRecording();
        } catch (_) {}
      }
    };
  }, [hideControls, isRecording, stopRecording]);

  // Enhanced Live transcript via Web Speech API with improved accuracy and reliability
  useEffect(() => {
    if (!enableTranscript) return;
    if (!isRecording) {
      // Stop recognition if running
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (_) {}
        speechRecognitionRef.current = null;
      }
      setInterimTranscript("");
      setIsListening(false);
      transcriptRestartCountRef.current = 0;
      return;
    }

    // Auto-show transcript when recording starts
    setShowTranscript(true);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // eslint-disable-next-line no-console
      console.warn("[VideoRecorder] Speech Recognition API not supported");
      toast.error(
        "Speech recognition not supported in this browser. Use Chrome or Edge.",
        { duration: 5000 }
      );
      return;
    }

    const startRecognition = () => {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;

        // Enhanced settings for maximum accuracy
        rec.lang = "en-US"; // Primary language
        rec.maxAlternatives = 5; // Get top 5 alternatives for better accuracy

        // Grammar hints for better accuracy (if supported)
        if ("grammars" in rec) {
          rec.grammars = null; // Use default grammar
        }

        rec.onresult = (event) => {
          let interim = "";
          const finalAdditions = [];

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];

            if (res.isFinal) {
              // Smart selection from alternatives based on confidence
              let bestTranscript = res[0].transcript.trim();
              let bestConfidence = res[0].confidence || 1;

              // Check all alternatives and pick the best one
              for (let j = 1; j < Math.min(res.length, 5); j++) {
                const altConfidence = res[j].confidence || 0;
                const altTranscript = res[j].transcript.trim();

                // Prefer longer, more complete phrases if confidence is similar
                if (
                  altConfidence > bestConfidence * 0.9 &&
                  altTranscript.length > bestTranscript.length
                ) {
                  bestTranscript = altTranscript;
                  bestConfidence = altConfidence;
                } else if (altConfidence > bestConfidence) {
                  bestTranscript = altTranscript;
                  bestConfidence = altConfidence;
                }
              }

              if (bestTranscript) {
                // Add punctuation if missing at end
                if (!/[.!?]$/.test(bestTranscript)) {
                  bestTranscript += ".";
                }

                finalAdditions.push(bestTranscript);

                // Update confidence display
                setTranscriptConfidence(Math.round(bestConfidence * 100));

                // Log for debugging
                // eslint-disable-next-line no-console
                console.log(
                  `[Transcript] ${(bestConfidence * 100).toFixed(
                    1
                  )}% - "${bestTranscript}"`
                );
              }
            } else {
              // For interim results, show the top result
              interim += res[0].transcript;
            }
          }

          if (finalAdditions.length) {
            setTranscript((t) => {
              const newText = finalAdditions.join(" ");
              return t ? `${t} ${newText}` : newText;
            });
          }
          setInterimTranscript(interim);
        };

        rec.onerror = (event) => {
          // eslint-disable-next-line no-console
          console.warn(
            "[VideoRecorder] Speech recognition error:",
            event.error
          );

          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            toast.error(
              "Microphone permission denied. Please allow microphone access.",
              { duration: 5000 }
            );
            setIsListening(false);
          } else if (event.error === "no-speech") {
            // Normal pause - don't show error, auto-restart will handle
            // eslint-disable-next-line no-console
            console.log("[VideoRecorder] No speech detected, will restart");
          } else if (event.error === "audio-capture") {
            toast.error(
              "No microphone detected. Please connect a microphone.",
              { duration: 5000 }
            );
            setIsListening(false);
          } else if (event.error === "network") {
            // eslint-disable-next-line no-console
            console.log(
              "[VideoRecorder] Network error, will auto-restart in 1s"
            );
          } else if (event.error === "aborted") {
            // Normal when stopping/restarting
            // eslint-disable-next-line no-console
            console.log("[VideoRecorder] Recognition aborted, will restart");
          }
        };

        rec.onstart = () => {
          // eslint-disable-next-line no-console
          console.log("[VideoRecorder] Speech recognition started");
          setIsListening(true);
          lastRestartTimeRef.current = Date.now();
        };

        rec.onend = () => {
          // eslint-disable-next-line no-console
          console.log(
            "[VideoRecorder] Speech recognition ended, isRecording:",
            isRecording
          );
          setIsListening(false);

          // Auto-restart while recording with smart backoff
          if (isRecording && speechRecognitionRef.current === rec) {
            const timeSinceLastRestart =
              Date.now() - lastRestartTimeRef.current;
            const restartDelay = timeSinceLastRestart < 1000 ? 500 : 100;

            // Prevent infinite restart loops
            if (transcriptRestartCountRef.current < 50) {
              transcriptRestartCountRef.current++;

              // eslint-disable-next-line no-console
              console.log(
                `[VideoRecorder] Auto-restarting (${transcriptRestartCountRef.current}) in ${restartDelay}ms`
              );

              setTimeout(() => {
                if (isRecording && speechRecognitionRef.current === rec) {
                  try {
                    rec.start();
                  } catch (restartErr) {
                    // eslint-disable-next-line no-console
                    console.error(
                      "[VideoRecorder] Restart failed:",
                      restartErr.message
                    );
                    // Try again after longer delay
                    if (transcriptRestartCountRef.current < 50) {
                      setTimeout(() => {
                        try {
                          if (
                            isRecording &&
                            speechRecognitionRef.current === rec
                          ) {
                            rec.start();
                          }
                        } catch (_) {}
                      }, 1000);
                    }
                  }
                }
              }, restartDelay);
            } else {
              // eslint-disable-next-line no-console
              console.warn(
                "[VideoRecorder] Too many restarts, stopping auto-restart"
              );
              toast.error(
                "Speech recognition stopped. Please refresh if needed.",
                { duration: 3000 }
              );
            }
          }
        };

        speechRecognitionRef.current = rec;
        transcriptRestartCountRef.current = 0;

        // eslint-disable-next-line no-console
        console.log("[VideoRecorder] Starting speech recognition");
        rec.start();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          "[VideoRecorder] Failed to initialize speech recognition:",
          err
        );
        toast.error(`Failed to start speech recognition: ${err.message}`, {
          duration: 5000,
        });
      }
    };

    // Start recognition
    startRecognition();

    // Cleanup
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (_) {}
        speechRecognitionRef.current = null;
      }
    };
  }, [isRecording, enableTranscript]);

  // Notify parent of transcript updates (both interim and final)
  useEffect(() => {
    if (typeof onTranscriptUpdate === "function") {
      try {
        onTranscriptUpdate({ transcript, interim: interimTranscript });
      } catch (_) {}
    }
  }, [transcript, interimTranscript, onTranscriptUpdate]);

  // Auto stop by maxDuration
  useEffect(() => {
    if (isRecording && maxDuration && recordingDuration >= maxDuration) {
      handleStopRecording();
    }
  }, [isRecording, recordingDuration, maxDuration, handleStopRecording]);

  // Cleanup audio meter on stop / unmount
  useEffect(() => {
    if (!isRecording) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (_) {}
      }
      analyserRef.current = null;
      audioCtxRef.current = null;
      rafRef.current = null;
      // audio level state removed
    }
  }, [isRecording]);

  // Notify parent when recording state changes
  useEffect(() => {
    if (typeof onRecordingChange === "function") {
      onRecordingChange(isRecording);
    }
  }, [isRecording, onRecordingChange]);

  // Handle upload video
  const handleUploadVideo = async () => {
    // eslint-disable-next-line no-console
    console.log(
      "[VideoRecorder] Upload clicked for question:",
      currentQuestionIndex
    );
    const success = await uploadVideo(currentQuestionIndex);
    if (success) {
      toast.success("Video uploaded successfully");
      if (onVideoUploaded) {
        onVideoUploaded(currentQuestionIndex);
      }
    } else {
      toast.error("Failed to upload video. Please try again.");
    }
  };

  // Show error states
  if (cameraError) {
    return (
      <div
        className={`card border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-6 text-center ${className}`}
      >
        <div className="mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <p className="font-medium">{cameraError}</p>
        <div className="text-surface-700 dark:text-surface-300 text-sm mt-3 space-y-1">
          <p>Tips to fix:</p>
          <ul className="list-disc list-inside text-left mx-auto inline-block">
            <li>
              Click the lock icon in your browser’s address bar and allow Camera
              and Microphone.
            </li>
            <li>
              Check OS privacy settings (Camera & Microphone) and ensure browser
              access is allowed.
            </li>
            <li>
              If you have multiple devices, pick the correct camera/mic in
              browser settings.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Display */}
      <div className="relative group rounded-lg overflow-hidden aspect-video bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 shadow-inner">
        {/* Live video */}
        {hasCamera ? (
          <Webcam
            key={`${selectedDevice.video}|${selectedDevice.audio}`}
            ref={webcamRef}
            audio={audioEnabled}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            videoConstraints={videoConstraints}
            audioConstraints={
              selectedDevice.audio && selectedDevice.audio !== "default"
                ? {
                    deviceId: { exact: selectedDevice.audio },
                    // Enhanced audio settings for better speech recognition
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000, // Higher sample rate for better quality
                  }
                : {
                    // Default device with enhanced settings
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                  }
            }
            onUserMediaError={() => {
              setCameraError("Failed to access camera");
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-surface-500">
              <svg
                className="w-16 h-16 mx-auto mb-4"
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
              <p>Loading camera...</p>
            </div>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-surface-900/70 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 text-white">
                <LargeSpinner />
                <div className="text-sm opacity-90">Uploading your video…</div>
              </div>
            </div>
          )}
          {/* Countdown */}
          {preparing && countdown != null && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-surface-900/70 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-7xl font-bold text-white tracking-tight animate-scale-in">
                  {countdown}
                </div>
                <div className="mt-4 text-surface-200 text-sm">
                  Get ready...
                </div>
              </div>
            </div>
          )}

          {/* Live tag (replaces Audio meter) */}
          {isRecording && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 dark:bg-surface-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-surface-300 dark:border-surface-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                Live
              </span>
            </div>
          )}
          {/* Max duration progress ring (corner) */}
          {isRecording && maxDuration && (
            <div className="absolute bottom-3 left-3">
              <DurationRing value={recordingDuration} max={maxDuration} />
            </div>
          )}
        </div>
        {/* Control Bar */}
        {!hideControls && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-4 bg-white/90 dark:bg-surface-900/70 backdrop-blur-md px-5 py-3 rounded-full border border-surface-300 dark:border-surface-700 shadow-lg">
              {demoMode && (
                <span className="hidden md:inline text-[10px] tracking-wide px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  DEMO
                </span>
              )}
              {!isRecording && !hasRecorded && !preparing && (
                <ControlButton
                  color="red"
                  label="Start"
                  onClick={handleStartRecording}
                  icon={<RecordIcon />}
                  disabled={!hasCamera || !sessionStarted}
                />
              )}
              {preparing && (
                <ControlButton
                  color="amber"
                  label="Cancel"
                  onClick={() => {
                    setPreparing(false);
                    setCountdown(null);
                  }}
                  icon={<CancelIcon />}
                />
              )}
              {isRecording && (
                <ControlButton
                  color="slate"
                  label="Stop"
                  onClick={handleStopRecording}
                  icon={<StopIcon />}
                />
              )}
              {hasRecorded && !isRecording && (
                <>
                  <ControlButton
                    color="green"
                    label={isUploading ? "Uploading" : "Upload"}
                    onClick={handleUploadVideo}
                    disabled={isUploading || !canUpload}
                    icon={isUploading ? <Spinner /> : <UploadIcon />}
                  />
                  <ControlButton
                    color="indigo"
                    label="Retake"
                    onClick={clearRecording}
                    icon={<RetakeIcon />}
                    disabled={isUploading}
                  />
                </>
              )}
              {enableTranscript && (
                <ControlButton
                  color={
                    isListening ? "green" : showTranscript ? "amber" : "slate"
                  }
                  label={showTranscript ? "Hide Text" : "Transcript"}
                  onClick={() => setShowTranscript((v) => !v)}
                  icon={<TranscriptIcon />}
                />
              )}
            </div>
          </div>
        )}
        {/* Glow border when recording */}
        {isRecording && (
          <div className="absolute inset-0 ring-4 ring-red-500/40 rounded-lg pointer-events-none animate-pulse" />
        )}
      </div>
      {/* (Legacy control section removed in favor of overlay bar) */}

      {/* Waveform Timeline & Transcript */}
      {(enableWaveform || enableTranscript) && (
        <div className="space-y-3">
          {enableWaveform && (
            <div className="bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 dark:from-surface-900/90 dark:via-surface-900/80 dark:to-surface-800/90 border border-surface-300 dark:border-surface-700/50 rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse"></div>
                    <div
                      className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Audio Spectrum
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-red-400 font-semibold uppercase tracking-wide">
                        Live
                      </span>
                    </span>
                  )}
                  {!isRecording && hasRecorded && (
                    <span className="text-[9px] sm:text-[10px] text-cyan-500 font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      Captured
                    </span>
                  )}
                  {!isRecording && !hasRecorded && (
                    <span className="text-[9px] sm:text-[10px] text-surface-500 font-medium uppercase tracking-wide">
                      Idle
                    </span>
                  )}
                </div>
              </div>
              <div className="h-20 sm:h-24 w-full relative overflow-hidden rounded-lg bg-gradient-to-b from-surface-50 via-surface-100 to-surface-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900 border border-surface-300 dark:border-surface-700/30 shadow-inner">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                />
                {!isRecording && !hasRecorded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-surface-600 rounded-full animate-pulse"
                          style={{
                            height: `${20 + Math.random() * 20}px`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        ></div>
                      ))}
                    </div>
                    <span className="text-surface-500 text-xs sm:text-sm font-medium">
                      Audio spectrum will appear when recording starts
                    </span>
                  </div>
                )}
              </div>
              {isRecording && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-surface-500">
                  <span className="flex items-center gap-1">
                    <span className="text-cyan-400">●</span>
                    Voice detected
                  </span>
                  <span className="text-surface-600">32 bands • 512 FFT</span>
                </div>
              )}
            </div>
          )}
          {enableTranscript && showTranscript && (
            <div className="bg-gradient-to-br from-surface-900/90 via-surface-900/80 to-surface-800/90 border border-surface-700/50 rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5">
                    {isListening ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-green-400 font-semibold uppercase tracking-wide">
                          Listening
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-surface-500 font-medium uppercase tracking-wide">
                        Paused
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Live Transcript
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Emotion error indicator */}
                  {emotionError && (
                    <span className="text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      Emotion Error
                    </span>
                  )}
                  {transcriptConfidence > 0 && transcript && (
                    <span
                      className={`text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        transcriptConfidence >= 80
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : transcriptConfidence >= 60
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      }`}
                    >
                      {transcriptConfidence}% confident
                    </span>
                  )}
                  {transcript && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${transcript}${
                            interimTranscript ? ` ${interimTranscript}` : ""
                          }`
                        );
                        toast.success("Transcript copied!", { duration: 2000 });
                      }}
                      className="text-[10px] sm:text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                      title="Copy transcript"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>

              {!(
                "SpeechRecognition" in window ||
                "webkitSpeechRecognition" in window
              ) && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                  <span className="text-xs sm:text-sm text-red-400 font-medium">
                    ⚠️ Speech recognition not supported. Use Chrome, Edge, or
                    Safari.
                  </span>
                </div>
              )}

              <div
                className="max-h-48 sm:max-h-56 overflow-auto text-sm sm:text-base whitespace-pre-wrap leading-relaxed bg-surface-900/50 rounded-lg p-3 border border-surface-700/30 scroll-smooth"
                id="transcript-container"
              >
                {transcript || interimTranscript ? (
                  <>
                    <span className="text-surface-100 font-medium">
                      {transcript}
                    </span>
                    {interimTranscript && (
                      <>
                        {transcript && " "}
                        <span className="text-surface-400 italic opacity-80">
                          {interimTranscript}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="flex gap-1 mb-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-4 bg-cyan-500/30 rounded-full animate-pulse"
                          style={{
                            animationDelay: `${i * 0.15}s`,
                          }}
                        ></div>
                      ))}
                    </div>
                    <span className="text-surface-500 text-xs sm:text-sm font-medium">
                      {isListening
                        ? "Listening for your voice..."
                        : "Transcript will appear as you speak (English)"}
                    </span>
                    <span className="text-surface-600 text-[10px] sm:text-xs mt-1">
                      Speak clearly for best results
                    </span>
                  </div>
                )}
              </div>

              {isRecording && (
                <div className="flex items-center justify-between text-[10px] text-surface-500">
                  <span className="flex items-center gap-1">
                    <span className="text-cyan-400">●</span>
                    {transcript
                      ? `${transcript.split(" ").length} words captured`
                      : "Ready to capture"}
                  </span>
                  <span className="text-surface-600">Auto-restart enabled</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Device selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="text-sm">
          <label className="block mb-1 text-surface-500">Camera</label>
          <select
            className="form-input-dark w-full"
            value={selectedDevice.video}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedDevice((s) => ({ ...s, video: id }));
              setVideoConstraints((vc) => ({ ...vc, deviceId: { exact: id } }));
            }}
          >
            {devices.videoIn.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
          {selectedDevice.video && (
            <div className="mt-1 text-xs text-surface-500 truncate">
              Using:{" "}
              {devices.videoIn.find((d) => d.deviceId === selectedDevice.video)
                ?.label || selectedDevice.video}
            </div>
          )}
        </div>
        <div className="text-sm">
          <label className="block mb-1 text-surface-500">Microphone</label>
          <select
            className="form-input-dark w-full"
            value={selectedDevice.audio}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedDevice((s) => ({ ...s, audio: id }));
            }}
          >
            {devices.audioIn.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Mic ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
          {selectedDevice.audio && (
            <div className="mt-1 text-xs text-surface-500 truncate">
              Using:{" "}
              {devices.audioIn.find((d) => d.deviceId === selectedDevice.audio)
                ?.label || selectedDevice.audio}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Too-short recording warning */}
      {hasRecorded && !isRecording && recordingDuration < 1 && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-md p-2 text-amber-300 text-xs text-center">
          Recording was shorter than 1 second. Some browsers may show 00:00 or
          create empty files. Please record for at least a full second before
          stopping.
        </div>
      )}

      {/* Status Display */}
      <div className="text-center text-sm text-surface-500">
        {isRecording && "Recording your response..."}
        {hasRecorded &&
          !isUploading &&
          "Recording complete. Click upload to save."}
        {isUploading && "Uploading your video response..."}
        {!sessionStarted && hasCamera && "Initializing recording session..."}
        {demoMode && (
          <div className="mt-1 text-[11px] text-amber-400">
            Running in local demo mode (no backend persistence)
          </div>
        )}
        {maxDuration && isRecording && (
          <div className="mt-1 text-[11px] text-surface-400">
            {recordingDuration}/{maxDuration}s
          </div>
        )}
      </div>
    </div>
  );
};

// Small components & icons
const ControlButton = ({ color, label, onClick, icon, disabled }) => {
  const colors = {
    red: "bg-red-600 hover:bg-red-500",
    slate: "bg-surface-700 hover:bg-surface-600",
    green: "bg-green-600 hover:bg-green-500",
    indigo: "bg-indigo-600 hover:bg-indigo-500",
    amber: "bg-amber-600 hover:bg-amber-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full px-5 h-11 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        colors[color] || colors.slate
      }`}
      title={label}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const RecordIcon = () => (
  <span className="block w-3.5 h-3.5 bg-white rounded-full" />
);
const StopIcon = () => (
  <span className="block w-3.5 h-3.5 bg-white rounded-sm" />
);
const UploadIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4m0 0l4 4m-4-4v12"
    />
  </svg>
);
const RetakeIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0019 5"
    />
  </svg>
);
const CancelIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const TranscriptIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 4h13M8 9h13M8 14h9M3 4h.01M3 9h.01M3 14h.01M3 19h.01M8 19h9"
    />
  </svg>
);
const Spinner = () => (
  <svg
    className="w-4 h-4 animate-spin"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const LargeSpinner = () => (
  <svg
    className="w-10 h-10 animate-spin"
    viewBox="0 0 50 50"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="5"
      fill="none"
    />
    <circle
      cx="25"
      cy="25"
      r="20"
      stroke="#ffffff"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
      strokeDasharray="31.4 62.8"
    />
  </svg>
);

const DurationRing = ({ value, max }) => {
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={50} height={50} className="rotate-[-90deg]">
      <circle
        cx={25}
        cy={25}
        r={radius}
        strokeWidth={6}
        stroke="rgba(255,255,255,0.15)"
        fill="none"
      />
      <circle
        cx={25}
        cy={25}
        r={radius}
        strokeWidth={6}
        strokeLinecap="round"
        stroke={pct >= 0.95 ? "#ef4444" : "#10b981"}
        strokeDasharray={circ}
        strokeDashoffset={circ - pct * circ}
        fill="none"
        className="transition-[stroke-dashoffset] duration-300 ease-linear"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-white text-[9px] font-medium rotate-90"
      >
        {Math.max(0, max - value)}s
      </text>
    </svg>
  );
};

export default VideoRecorder;
