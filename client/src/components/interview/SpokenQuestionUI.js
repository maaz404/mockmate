import React from "react";
import VideoRecorder from "../VideoRecorder";
import { useFacialExpressionAnalysis } from "../../hooks/useFacialExpressionAnalysis";
import VideoPlayback from "../VideoPlayback";
import RecordingUploader from "./RecordingUploader";
import { FEATURES } from "../../config/features";

const SpokenQuestionUI = ({
  interview,
  currentQuestion,
  currentQuestionIndex,
  responses,
  onResponseChange,
  validationError,
  settings,
  permission,
  isRecording: _isRecording,
  followUps,
  followUpsAck,
  ttsFlash,
  isSpeaking: _isSpeaking,
  onVideoUploaded,
  onRecordingChange,
  onPermissionChange,
  onPrevious,
  onSkip,
  onNext,
  onEndInterview: _onEndInterview,
  onToggleSetting,
  onFollowUpAck,
  onSpeakQuestion: _onSpeakQuestion,
  onStopSpeech: _onStopSpeech,
  submittingAnswer,
  skipping,
  targetCount: _targetCount,
  interviewId,
  isLastQuestion,
  onTranscriptUpdate,
  onFacialMetricsUpdate,
}) => {
  // Facial analysis integration
  const facial = useFacialExpressionAnalysis(true);
  const [autoAppendTranscript, setAutoAppendTranscript] = React.useState(true);
  const [liveTranscript, setLiveTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const videoElRef = React.useRef(null);

  const handleWebcamReady = React.useCallback(
    (videoEl) => {
      if (!videoEl) return;
      videoElRef.current = videoEl;
      if (!facial.isInitialized) return;
      // Always restart analysis with the video element to ensure it's tracking correctly
      // This handles cases where the video element might have been re-created or lost during recording
      if (facial.isAnalyzing) {
        facial.stopAnalysis();
      }
      facial.startAnalysis(videoEl);
    },
    [facial]
  );

  // When metrics change, we could add simple threshold-based recommendations display (done below)
  const handleTranscriptUpdate = ({ transcript, interim: interimText }) => {
    setLiveTranscript(transcript);
    setInterim(interimText);

    // Notify parent of transcript updates for persistence
    if (onTranscriptUpdate && transcript && transcript.trim()) {
      onTranscriptUpdate(transcript);
    }

    if (autoAppendTranscript && transcript && transcript.length) {
      // Append only newly added chunk
      // naive approach: ensure we don't duplicate by checking current value
      onResponseChange(
        ((prev) => {
          const existing = prev || responses[currentQuestionIndex] || "";
          if (existing.endsWith(transcript)) return existing; // already appended whole
          if (transcript.length < 20) return existing; // wait until a bit longer for clarity
          return existing + (existing ? "\n" : "") + transcript;
        })(responses[currentQuestionIndex])
      );
    }
  };

  // Derive quick facial summary badges
  const badges = React.useMemo(() => {
    const m = facial.metrics || {};
    const pct = (val) => `${Math.round(val || 0)}%`;
    return [
      { label: "Eye Contact", value: pct(m.eyeContact) },
      { label: "Smile", value: pct(m.smilePercentage) },
      { label: "Steadiness", value: pct(m.headSteadiness) },
      { label: "Confidence", value: pct(m.confidenceScore) },
    ];
  }, [facial.metrics]);

  // Notify parent of facial metrics updates for persistence
  React.useEffect(() => {
    if (onFacialMetricsUpdate && facial.metrics && facial.isAnalyzing) {
      onFacialMetricsUpdate(facial.metrics);
    }
  }, [facial.metrics, facial.isAnalyzing, onFacialMetricsUpdate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Video Section */}
      <div className="space-y-4">
        {settings.videoRecording &&
        FEATURES.videoRecording &&
        interview.status !== "completed" ? (
          <div className="space-y-4">
            <div className="card p-0 overflow-hidden">
              <VideoRecorder
                interviewId={interview._id}
                currentQuestionIndex={currentQuestionIndex}
                onVideoUploaded={onVideoUploaded}
                onRecordingChange={onRecordingChange}
                onPermissionChange={onPermissionChange}
                onWebcamReady={handleWebcamReady}
                onTranscriptUpdate={handleTranscriptUpdate}
                audioEnabled={settings.audioRecording}
              />
            </div>
            {/* Playback of saved answer for this question (if exists) */}
            {interview?.questions?.[currentQuestionIndex]?.hasVideo && (
              <div className="card p-0 overflow-hidden">
                <VideoPlayback
                  interviewId={interview._id}
                  questionIndex={currentQuestionIndex}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="card aspect-video flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-surface-400 mx-auto mb-4"
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
              <p className="text-surface-600 dark:text-surface-400">
                {interview.status === "completed"
                  ? "Interview completed - video recording disabled"
                  : "Video recording is disabled"}
              </p>
            </div>
          </div>
        )}

        {/* Facial metrics summary */}
        {facial.isInitialized && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              Facial Engagement{" "}
              <span className="text-xs opacity-60">(live)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className="rounded-md px-2 py-1 text-xs bg-surface-800/40 flex justify-between items-center"
                >
                  <span className="opacity-70">{b.label}</span>
                  <span className="font-medium">{b.value}</span>
                </div>
              ))}
            </div>
            {facial.error && (
              <div className="mt-2 text-xs text-red-500">{facial.error}</div>
            )}
          </div>
        )}

        {/* Live Transcript - Always show when video recording is enabled */}
        {settings.videoRecording && FEATURES.videoRecording && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Live Transcript
                <span className="text-xs opacity-60">(real-time)</span>
              </h3>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAppendTranscript}
                  onChange={(e) => setAutoAppendTranscript(e.target.checked)}
                />
                Auto-append to answer
              </label>
            </div>
            <div className="text-xs max-h-32 overflow-auto whitespace-pre-wrap bg-surface-900/30 rounded p-3 border border-surface-700">
              {liveTranscript && (
                <span className="text-surface-100">{liveTranscript}</span>
              )}
              {interim && (
                <span className="text-surface-400 italic"> {interim}</span>
              )}
              {!liveTranscript && !interim && (
                <span className="text-surface-500 text-xs">
                  Start recording to see live speech-to-text transcription...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Session Recording Uploader */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-2">
            Upload session recording
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
            If you recorded externally, attach your full session video here.
          </p>
          <RecordingUploader sessionId={interview?._id || interviewId} />
        </div>

        {/* Video Status */}
        {currentQuestion.hasVideo && (
          <div className="rounded-lg p-3 text-center bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-300 mx-auto mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm">Video recorded for this question</p>
          </div>
        )}
      </div>

      {/* Question Section */}
      <div className="space-y-6">
        <div className={`card ${ttsFlash ? "ring-2 ring-primary-500" : ""}`}>
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400">
              Current Question
            </h2>
            <div className="text-right text-sm">
              <span className="text-surface-600 dark:text-surface-400">
                Category:{" "}
              </span>
              <span className="text-primary-700 dark:text-primary-300">
                {currentQuestion.category || "-"}
              </span>
              <br />
              <span className="text-surface-600 dark:text-surface-400">
                Difficulty:{" "}
              </span>
              <span className="text-yellow-700 dark:text-yellow-300">
                {currentQuestion.difficulty || "-"}
              </span>
            </div>
          </div>
          <p className="text-lg leading-relaxed text-surface-900 dark:text-surface-50">
            {currentQuestion.questionText || currentQuestion.text || ""}
          </p>
        </div>

        {/* Follow-ups banner */}
        {followUps[currentQuestionIndex] &&
          followUps[currentQuestionIndex].length > 0 && (
            <div className="rounded-lg p-3 bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700">
              Follow-up questions have been generated for this answer. Review
              them below and mark as reviewed to continue.
            </div>
          )}

        {/* Inline Follow-up Questions */}
        {followUps[currentQuestionIndex] &&
          followUps[currentQuestionIndex].length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">
                AI Follow-up Questions
              </h3>
              <ul className="list-disc list-inside space-y-1 text-surface-700 dark:text-surface-300">
                {followUps[currentQuestionIndex].map((fq, i) => (
                  <li key={i}>{fq.text || fq}</li>
                ))}
              </ul>
              {!followUpsAck[currentQuestionIndex] && (
                <div className="mt-4">
                  <button
                    className="btn-secondary"
                    onClick={() => onFollowUpAck(currentQuestionIndex)}
                  >
                    ✓ Mark follow-ups reviewed
                  </button>
                </div>
              )}
            </div>
          )}

        {/* Response Area */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-300">
            Your Response Notes
          </h3>
          <textarea
            value={responses[currentQuestionIndex] || ""}
            onChange={(e) => onResponseChange(e.target.value)}
            className="form-input-dark h-32"
            placeholder="Take notes or outline your response here..."
          />
          {validationError && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {validationError}
            </div>
          )}
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
            These notes are saved with your answer for scoring and follow-ups.
          </p>
          {followUps[currentQuestionIndex] &&
            followUpsAck[currentQuestionIndex] && (
              <div className="mt-3 text-xs text-surface-500 dark:text-surface-400">
                You can continue after reviewing the generated follow-up
                questions below.
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={
              skipping ||
              currentQuestionIndex === (interview?.questions?.length || 1) - 1
            }
            className={`flex-1 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-400 transition-colors ${
              currentQuestionIndex === (interview?.questions?.length || 1) - 1
                ? "bg-surface-300 text-surface-500 cursor-not-allowed dark:bg-surface-600 dark:text-surface-400"
                : skipping
                ? "bg-amber-400 text-white cursor-wait"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {currentQuestionIndex === (interview?.questions?.length || 1) - 1
              ? "Skip (N/A)"
              : skipping
              ? "Skipping..."
              : "Skip"}
          </button>
          <button
            onClick={onNext}
            disabled={submittingAnswer || !!validationError}
            className={`flex-1 btn-primary ${
              submittingAnswer ? "opacity-70 cursor-wait" : ""
            }`}
          >
            {submittingAnswer
              ? "Submitting..."
              : isLastQuestion
              ? "Finish Interview"
              : "Next Question"}
          </button>
        </div>

        {/* Interview Settings */}
        <div className="card p-4">
          <h4 className="font-medium mb-3">Interview Settings</h4>
          <div className="space-y-2">
            {/* Permission hints */}
            {!permission.camera || permission.error ? (
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700 text-sm">
                <div className="font-medium mb-1">
                  Camera/Mic permissions needed
                </div>
                <div>
                  Allow camera and microphone access in your browser to record
                  answers.
                </div>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-sm">Video Recording</span>
              <button
                onClick={() => onToggleSetting("videoRecording")}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.videoRecording ? "bg-primary-600" : "bg-surface-600"
                }`}
              >
                <div
                  className={`bg-white dark:bg-surface-100 w-4 h-4 rounded-full transition-transform ${
                    settings.videoRecording ? "transform translate-x-6" : ""
                  }`}
                ></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Audio Recording</span>
              <button
                onClick={() => onToggleSetting("audioRecording")}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.audioRecording ? "bg-primary-600" : "bg-surface-600"
                }`}
              >
                <div
                  className={`bg-white dark:bg-surface-100 w-4 h-4 rounded-full transition-transform ${
                    settings.audioRecording ? "transform translate-x-6" : ""
                  }`}
                ></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Question Audio</span>
              <button
                onClick={() => onToggleSetting("questionAudio")}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.questionAudio ? "bg-primary-600" : "bg-surface-600"
                }`}
              >
                <div
                  className={`bg-white dark:bg-surface-100 w-4 h-4 rounded-full transition-transform ${
                    settings.questionAudio ? "transform translate-x-6" : ""
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpokenQuestionUI;
