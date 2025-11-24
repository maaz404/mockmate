import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import VideoRecorder from "../VideoRecorder";
import RealTimeEmotionDisplay from "../RealTimeEmotionDisplay";
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
  onFacialMetricsUpdate,
  onEmotionUpdate,
}) => {
  // Translation hook - must be at top before any other hooks that use it
  const { t } = useLanguage();

  // Facial analysis integration
  const facial = useFacialExpressionAnalysis(true);
  const [emotionTimeline, setEmotionTimeline] = React.useState([]);
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

  // Live transcript removed; no transcript handling required.

  // Derive quick facial summary badges
  // Facial engagement display removed during interview.

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
                onEmotionUpdate={(emotionData) => {
                  // Update local state for display
                  if (emotionData?.timeline) {
                    setEmotionTimeline((prev) => [
                      ...prev,
                      ...emotionData.timeline,
                    ]);
                  }
                  // Pass to parent as well
                  if (onEmotionUpdate) {
                    onEmotionUpdate(emotionData);
                  }
                }}
                audioEnabled={settings.audioRecording}
                enableTranscript={false}
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
                    ? t("interview_completed")
                    : t("video_disabled")}
                </p>
              </div>
            </div>
          )}

          {/* Analytics row removed (facial engagement and transcript). */}
        </div>

        {/* Right Column - Question & Response (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Question Card */}
          <div className={`card ${ttsFlash ? "ring-2 ring-primary-500" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-primary-600 dark:text-primary-400">
                {t("current_question")}
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
              {t("your_response_notes")}
            </h3>
            <textarea
              value={responses[currentQuestionIndex] || ""}
              onChange={(e) => onResponseChange(e.target.value)}
              className="form-input-dark h-28 text-sm"
              placeholder={t("notes_placeholder")}
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

          {/* Emotion Analysis Display */}
          {settings.videoRecording &&
            FEATURES.videoRecording &&
            emotionTimeline.length > 0 && (
              <RealTimeEmotionDisplay emotionTimeline={emotionTimeline} />
            )}

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
                  📹 {t("record_instruction")}{" "}
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    "{t("submit_next")}"
                  </span>{" "}
                  to continue
                </>
              ) : (
                <>
                  ✍️ Type your answer in the notes section, then click{" "}
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    "{t("submit_next")}"
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
              {t("previous")}
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
                {skipping ? "Skipping..." : t("skip_question")}
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
                    {t("submit_next")}
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
