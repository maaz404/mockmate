import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useVideoRecording } from "../hooks/useVideoRecording";

const VideoRecorder = ({
  interviewId,
  currentQuestionIndex,
  onVideoUploaded,
  className = "",
}) => {
  const webcamRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const {
    isRecording,
    hasRecorded,
    isUploading,
    recordingDuration,
    error,
    sessionStarted,
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setHasCamera(true);
        // Stop the stream immediately as webcam component will handle it
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        setCameraError("Camera access denied or not available");
      }
    };

    checkCamera();
  }, []);

  // Start recording session when component mounts
  useEffect(() => {
    if (hasCamera && !sessionStarted) {
      startSession();
    }
  }, [hasCamera, sessionStarted, startSession]);

  // Handle start recording
  const handleStartRecording = async () => {
    if (!webcamRef.current || !webcamRef.current.stream) {
      setCameraError("Camera stream not available");
      return;
    }

    await startRecording(webcamRef.current.stream);
  };

  // Handle stop recording
  const handleStopRecording = () => {
    stopRecording();
  };

  // Handle upload video
  const handleUploadVideo = async () => {
    const success = await uploadVideo(currentQuestionIndex);
    if (success && onVideoUploaded) {
      onVideoUploaded(currentQuestionIndex);
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
        className={`bg-red-900/50 border border-red-700 rounded-lg p-6 text-center ${className}`}
      >
        <div className="text-red-400 mb-4">
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
        <p className="text-white font-medium">{cameraError}</p>
        <p className="text-surface-500 text-sm mt-2">
          Please allow camera access to record video responses
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Display */}
      <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
        {hasCamera ? (
          <Webcam
            ref={webcamRef}
            audio={true}
            className="w-full h-full object-cover"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user",
            }}
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

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">
              REC {formatDuration(recordingDuration)}
            </span>
          </div>
        )}

        {/* Duration display when not recording but has recorded */}
        {hasRecorded && !isRecording && (
          <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-full">
            <span className="text-white text-sm font-medium">
              Recorded: {formatDuration(recordingDuration)}
            </span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center space-x-4">
        {!isRecording && !hasRecorded && (
          <button
            onClick={handleStartRecording}
            disabled={!hasCamera || !sessionStarted}
            className="bg-red-600 hover:bg-red-700 disabled:bg-surface-600 disabled:cursor-not-allowed p-4 rounded-full transition-colors"
            title="Start recording"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
        )}

        {isRecording && (
          <button
            onClick={handleStopRecording}
            className="bg-surface-700 hover:bg-surface-800 p-4 rounded-full transition-colors"
            title="Stop recording"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        )}

        {hasRecorded && (
          <>
            <button
              onClick={handleUploadVideo}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-surface-600 px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isUploading ? (
                <svg
                  className="w-5 h-5 animate-spin"
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
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              )}
              <span>{isUploading ? "Uploading..." : "Upload Video"}</span>
            </button>

            <button
              onClick={clearRecording}
              disabled={isUploading}
              className="bg-surface-700 hover:bg-surface-800 disabled:bg-surface-800 px-4 py-3 rounded-lg transition-colors"
              title="Clear recording"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-400 text-sm text-center">
          {error}
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
      </div>
    </div>
  );
};

export default VideoRecorder;
