import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useVideoRecording } from "../hooks/useVideoRecording";
import toast from "react-hot-toast";

const VideoRecorder = ({
  interviewId,
  currentQuestionIndex,
  onVideoUploaded,
  onRecordingChange,
  onPermissionChange,
  onWebcamReady,
  onTranscriptUpdate,
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
  const [audioLevel, setAudioLevel] = useState(0);
  const [countdown, setCountdown] = useState(null); // null | number
  const [preparing, setPreparing] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const waveXRef = useRef(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  // Check camera access on mount
  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Camera API not supported in this browser");
          return;
        }

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
          setSelectedDevice((s) => ({ ...s, audio: audioIn[0].deviceId }));
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
      // Setup audio meter after recording starts
      if (audioEnabled) {
        try {
          audioCtxRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
          const source = audioCtxRef.current.createMediaStreamSource(
            webcamRef.current.stream
          );
          const analyser = audioCtxRef.current.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            analyser.getByteTimeDomainData(dataArray);
            // Compute RMS
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const v = (dataArray[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            setAudioLevel(rms);
            if (canvasRef.current) {
              try {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                const rect = canvas.getBoundingClientRect();
                const w = rect.width;
                const h = rect.height;
                if (canvas.width !== w || canvas.height !== h) {
                  canvas.width = w;
                  canvas.height = h;
                  waveXRef.current = 0;
                  ctx.fillStyle = "#111827";
                  ctx.fillRect(0, 0, w, h);
                }
                const amp = rms;
                const mid = h / 2;
                const colWidth = 2;
                // fade old trail slightly where we draw next
                ctx.fillStyle = "rgba(17,24,39,0.15)";
                ctx.fillRect(waveXRef.current, 0, colWidth, h);
                const lineHeight = Math.max(2, amp * h * 0.9);
                ctx.strokeStyle = amp > 0.85 ? "#ef4444" : "#10b981";
                ctx.lineWidth = colWidth;
                ctx.beginPath();
                ctx.moveTo(
                  waveXRef.current + colWidth / 2,
                  mid - lineHeight / 2
                );
                ctx.lineTo(
                  waveXRef.current + colWidth / 2,
                  mid + lineHeight / 2
                );
                ctx.stroke();
                waveXRef.current += colWidth;
                if (waveXRef.current >= w) {
                  waveXRef.current = 0;
                  ctx.fillStyle = "#111827";
                  ctx.fillRect(0, 0, w, h);
                }
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
  }, [audioEnabled, startRecording]);

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
  }, [stopRecording]);

  // Setup waveform canvas scaling
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
      ctx.fillStyle = "rgba(16,185,129,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  // Live transcript via Web Speech API (best-effort)
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
        "Speech recognition not supported in this browser. Use Chrome or Edge."
      );
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;

      // Improved settings for better accuracy
      rec.lang = "en-US"; // You can make this configurable if needed
      rec.maxAlternatives = 3; // Get top 3 alternatives for better accuracy

      // These are browser-specific optimizations
      if ("grammars" in rec) {
        // Grammar hints can improve accuracy for specific vocabulary
        rec.grammars = null; // Use default grammar
      }

      rec.onresult = (event) => {
        let interim = "";
        const finalAdditions = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            // Use the most confident alternative (res[0] is highest confidence)
            // Check confidence score if available
            let bestTranscript = res[0].transcript.trim();
            let bestConfidence = res[0].confidence || 1;

            // Compare with alternatives if confidence is low
            if (bestConfidence < 0.8 && res.length > 1) {
              for (let j = 1; j < Math.min(res.length, 3); j++) {
                if (res[j].confidence > bestConfidence) {
                  bestTranscript = res[j].transcript.trim();
                  bestConfidence = res[j].confidence;
                }
              }
            }

            if (bestTranscript) {
              finalAdditions.push(bestTranscript);
              // Log confidence for debugging
              // eslint-disable-next-line no-console
              console.log(
                `[Transcript] Confidence: ${(bestConfidence * 100).toFixed(
                  1
                )}% - "${bestTranscript}"`
              );
            }
          } else {
            // For interim results, just use the top result
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
        console.warn("[VideoRecorder] Speech recognition error:", event.error);

        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          toast.error(
            "Microphone permission denied. Please allow microphone access."
          );
          setIsListening(false);
        } else if (event.error === "no-speech") {
          // This is normal, just means pause in speech - don't show error
        } else if (event.error === "audio-capture") {
          toast.error("No microphone detected. Please connect a microphone.");
          setIsListening(false);
        } else if (event.error === "network") {
          // eslint-disable-next-line no-console
          console.log(
            "[VideoRecorder] Network error in speech recognition, will auto-restart"
          );
        }
      };

      rec.onstart = () => {
        // eslint-disable-next-line no-console
        console.log("[VideoRecorder] Speech recognition started");
        setIsListening(true);
      };

      rec.onend = () => {
        // eslint-disable-next-line no-console
        console.log(
          "[VideoRecorder] Speech recognition ended, isRecording:",
          isRecording
        );
        setIsListening(false);

        // Auto-restart while recording
        if (isRecording && speechRecognitionRef.current === rec) {
          try {
            // eslint-disable-next-line no-console
            console.log("[VideoRecorder] Restarting speech recognition");
            setTimeout(() => {
              try {
                rec.start();
              } catch (restartErr) {
                // eslint-disable-next-line no-console
                console.error("[VideoRecorder] Restart failed:", restartErr);
              }
            }, 100); // Small delay before restart
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(
              "[VideoRecorder] Failed to restart speech recognition:",
              err
            );
          }
        }
      };

      speechRecognitionRef.current = rec;
      // eslint-disable-next-line no-console
      console.log("[VideoRecorder] Starting speech recognition");
      rec.start();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        "[VideoRecorder] Failed to initialize speech recognition:",
        err
      );
      toast.error("Failed to start speech recognition");
    }
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
      setAudioLevel(0);
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

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
      <div className="relative group rounded-lg overflow-hidden aspect-video bg-surface-900 border border-surface-700 shadow-inner">
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
            <div className="absolute inset-0 flex items-center justify-center bg-surface-900/70 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 text-white">
                <LargeSpinner />
                <div className="text-sm opacity-90">Uploading your video…</div>
              </div>
            </div>
          )}
          {/* Countdown */}
          {preparing && countdown != null && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-900/70 backdrop-blur-sm">
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
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 backdrop-blur px-3 py-1.5 rounded-full shadow">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <span className="text-white text-xs font-semibold tracking-wide">
                REC {formatDuration(recordingDuration)}
              </span>
            </div>
          )}
          {hasRecorded && !isRecording && (
            <div className="absolute top-3 left-3 bg-green-600/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-white text-xs font-medium">
              {`Recorded ${formatDuration(recordingDuration)}`}
            </div>
          )}
          {/* Audio meter */}
          {audioEnabled && (isRecording || preparing) && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-surface-800/80 backdrop-blur px-3 py-1.5 rounded-full border border-surface-600 text-surface-200">
              <span className="text-[11px] uppercase tracking-wide">Audio</span>
              <div className="flex items-end gap-0.5 h-5">
                {Array.from({ length: 12 }).map((_, i) => {
                  const threshold = (i + 1) / 12;
                  const active = audioLevel > threshold - 0.08; // smoothing
                  const danger = threshold > 0.85;
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-sm transition-all duration-150 ${
                        active
                          ? danger
                            ? "bg-red-500 h-full"
                            : "bg-green-400 h-full"
                          : "bg-surface-600 h-1"
                      }`}
                      style={{
                        height: active ? `${((i + 1) / 12) * 100}%` : undefined,
                      }}
                    />
                  );
                })}
              </div>
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
            <div className="pointer-events-auto flex items-center gap-4 bg-surface-900/70 backdrop-blur-md px-5 py-3 rounded-full border border-surface-700 shadow-lg">
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
            <div className="bg-surface-900/70 border border-surface-700 rounded-md p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wide text-surface-400">
                  Waveform
                </span>
                <span className="text-[10px] text-surface-500">
                  {isRecording
                    ? "Live"
                    : hasRecorded
                    ? "Recorded snapshot"
                    : "Idle"}
                </span>
              </div>
              <div className="h-16 w-full relative overflow-hidden rounded-sm bg-surface-800">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                />
                {!isRecording && !hasRecorded && (
                  <div className="absolute inset-0 flex items-center justify-center text-surface-600 text-xs">
                    Waveform will appear when recording starts
                  </div>
                )}
              </div>
            </div>
          )}
          {enableTranscript && showTranscript && (
            <div className="bg-surface-900/70 border border-surface-700 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-surface-400">
                    Live Transcript
                  </span>
                  {isListening && (
                    <span className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[9px] text-green-400 uppercase tracking-wide">
                        Listening
                      </span>
                    </span>
                  )}
                </div>
                {!(
                  "SpeechRecognition" in window ||
                  "webkitSpeechRecognition" in window
                ) && (
                  <span className="text-[10px] text-red-400">
                    Not Supported - Use Chrome/Edge
                  </span>
                )}
              </div>
              <div className="max-h-40 overflow-auto text-sm whitespace-pre-wrap leading-relaxed">
                {transcript || interimTranscript ? (
                  <>
                    <span className="text-surface-200">{transcript}</span>{" "}
                    {interimTranscript && (
                      <span className="text-surface-400 italic">
                        {interimTranscript}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-surface-500 text-xs">
                    {isListening
                      ? "Listening... Start speaking in English."
                      : "Transcript will appear as you speak (English)."}
                  </span>
                )}
              </div>
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
