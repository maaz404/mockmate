import React from "react";
import VideoRecorder from "../VideoRecorder";
import { useFacialExpressionAnalysis } from "../../hooks/useFacialExpressionAnalysis";
import { FEATURES } from "../../config/features";

const SpokenQuestionUI = ({
  interview,
  currentQuestion,
  currentQuestionIndex,
  responses,
  onResponseChange,
  validationError,
  settings,
  permission: _permission,
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
  targetCount,
  interviewId: _interviewId,
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

  // Calculate total question count for display (target count or current length)
  const totalQuestions = targetCount || interview?.questions?.length || 1;
  const isAdaptive = !!interview?.config?.adaptiveDifficulty?.enabled;

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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Main Interview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Video & Analytics (3 columns on large screens) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Recording Card */}
          {settings.videoRecording &&
          FEATURES.videoRecording &&
          interview.status !== "completed" ? (
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
                hideControls={true}
              />
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

          {/* Analytics Row - Facial & Transcript Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facial Engagement */}
            {facial.isInitialized && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Facial Engagement
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((b) => (
                    <div
                      key={b.label}
                      className="rounded-md px-3 py-2 text-xs bg-surface-100 dark:bg-surface-800/60 flex justify-between items-center border border-surface-200 dark:border-surface-700"
                    >
                      <span className="text-surface-600 dark:text-surface-400">
                        {b.label}
                      </span>
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        {b.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Transcript */}
            {settings.videoRecording && FEATURES.videoRecording && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Live Transcript
                  </h3>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAppendTranscript}
                      onChange={(e) =>
                        setAutoAppendTranscript(e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-surface-600 dark:text-surface-400">
                      Auto-append
                    </span>
                  </label>
                </div>
                <div className="text-xs max-h-24 overflow-auto whitespace-pre-wrap bg-surface-50 dark:bg-surface-900/30 rounded p-2.5 border border-surface-200 dark:border-surface-700">
                  {liveTranscript && (
                    <span className="text-surface-900 dark:text-surface-100">
                      {liveTranscript}
                    </span>
                  )}
                  {interim && (
                    <span className="text-surface-500 dark:text-surface-400 italic">
                      {" "}
                      {interim}
                    </span>
                  )}
                  {!liveTranscript && !interim && (
                    <span className="text-surface-400 dark:text-surface-500 text-xs">
                      Recording will show live transcription here...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Question & Response (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Question Card */}
          <div className={`card ${ttsFlash ? "ring-2 ring-primary-500" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-primary-600 dark:text-primary-400">
                Current Question
              </h2>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  {currentQuestion.category || "General"}
                </span>
                <span className="px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {currentQuestion.difficulty || "Medium"}
                </span>
              </div>
            </div>
            <p className="text-base leading-relaxed text-surface-900 dark:text-surface-50">
              {currentQuestion.questionText || currentQuestion.text || ""}
            </p>
          </div>

          {/* Follow-up Questions */}
          {followUps[currentQuestionIndex] &&
            followUps[currentQuestionIndex].length > 0 && (
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">
                  AI Follow-up Questions
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  {followUps[currentQuestionIndex].map((fq, i) => (
                    <li key={i}>{fq.text || fq}</li>
                  ))}
                </ul>
                {!followUpsAck[currentQuestionIndex] && (
                  <button
                    className="mt-3 w-full btn-secondary text-sm py-2"
                    onClick={() => onFollowUpAck(currentQuestionIndex)}
                  >
                    ✓ Mark Reviewed
                  </button>
                )}
              </div>
            )}

          {/* Response Notes */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3 text-surface-900 dark:text-surface-100">
              Your Response Notes
            </h3>
            <textarea
              value={responses[currentQuestionIndex] || ""}
              onChange={(e) => onResponseChange(e.target.value)}
              className="form-input-dark h-28 text-sm"
              placeholder="Type your answer notes here..."
            />
            {validationError && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                {validationError}
              </div>
            )}
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
              Notes are saved automatically and used for evaluation.
            </p>
          </div>

          {/* Interview Settings */}
          <div className="card p-4">
            <h4 className="text-sm font-semibold mb-3">Interview Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  Video Recording
                </span>
                <button
                  onClick={() => onToggleSetting("videoRecording")}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.videoRecording
                      ? "bg-primary-600"
                      : "bg-surface-300 dark:bg-surface-600"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.videoRecording ? "transform translate-x-5" : ""
                    }`}
                  ></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  Audio Recording
                </span>
                <button
                  onClick={() => onToggleSetting("audioRecording")}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.audioRecording
                      ? "bg-primary-600"
                      : "bg-surface-300 dark:bg-surface-600"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.audioRecording ? "transform translate-x-5" : ""
                    }`}
                  ></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  Question Audio
                </span>
                <button
                  onClick={() => onToggleSetting("questionAudio")}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.questionAudio
                      ? "bg-primary-600"
                      : "bg-surface-300 dark:bg-surface-600"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.questionAudio ? "transform translate-x-5" : ""
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar - Fixed Navigation */}
      <div className="mt-6 sticky bottom-0 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 -mx-4 px-4 py-4 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Instructions Row */}
          <div className="mb-3 text-center">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              {settings.videoRecording ? (
                <>
                  📹 Record your answer using the camera above, then click{" "}
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    "Submit & Next"
                  </span>{" "}
                  to continue
                </>
              ) : (
                <>
                  ✍️ Type your answer in the notes section, then click{" "}
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    "Submit & Next"
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left - Previous Button */}
            <button
              onClick={onPrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 rounded-lg font-medium text-sm border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            {/* Center - Question Counter */}
            <div className="text-center">
              <div className="text-xs text-surface-500 dark:text-surface-400">
                Question
              </div>
              <div className="text-lg font-bold text-surface-900 dark:text-surface-100">
                {currentQuestionIndex + 1} / {totalQuestions}
                {isAdaptive && interview.questions.length < totalQuestions && (
                  <span className="text-xs ml-1 text-primary-600 dark:text-primary-400">
                    (adaptive)
                  </span>
                )}
              </div>
            </div>

            {/* Right - Skip & Submit Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSkip}
                disabled={
                  skipping ||
                  currentQuestionIndex ===
                    (interview?.questions?.length || 1) - 1
                }
                className={`px-5 py-3 rounded-lg font-medium text-sm border-2 transition-all ${
                  currentQuestionIndex ===
                  (interview?.questions?.length || 1) - 1
                    ? "border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 cursor-not-allowed"
                    : skipping
                    ? "border-amber-400 bg-amber-500 text-white cursor-wait"
                    : "border-amber-400 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-500"
                }`}
              >
                {skipping ? "Skipping..." : "Skip Question"}
              </button>

              <button
                onClick={onNext}
                disabled={submittingAnswer}
                className={`px-8 py-3 rounded-lg font-semibold text-base bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  submittingAnswer ? "cursor-wait" : ""
                }`}
              >
                {submittingAnswer ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : isLastQuestion ? (
                  <>✓ Finish Interview</>
                ) : (
                  <>
                    Submit & Next
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Warning Display */}
          {validationError && (
            <div className="mt-3 text-center">
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg inline-flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {validationError} - You can still proceed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpokenQuestionUI;
