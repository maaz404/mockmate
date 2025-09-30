import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoRecorder from "../components/VideoRecorder";
import toast from "react-hot-toast";
import { apiService } from "../services/api";

const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes total
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [settings, setSettings] = useState({
    videoRecording: true,
    audioRecording: true,
    questionAudio: false,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [permission, setPermission] = useState({ camera: true, error: null });
  const [followUps, setFollowUps] = useState({});
  const [followUpsAck, setFollowUpsAck] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsFlash, setTtsFlash] = useState(false);

  // Submit current answer helper
  const submitCurrentAnswer = useCallback(async () => {
    if (!interview || !interview.questions || !interview.questions.length)
      return 0;
    const answerText = responses[currentQuestionIndex] || "";
    try {
      const timeSpentSec = Math.max(
        0,
        Math.round((Date.now() - questionStartTime) / 1000)
      );
      const res = await apiService.post(
        `/interviews/${interviewId}/answer/${currentQuestionIndex}`,
        { answer: answerText, notes: answerText, timeSpent: timeSpentSec }
      );
      // Request follow-ups if available from response or fetch explicitly
      const generated = res?.data?.data?.followUpQuestions;
      if (generated && Array.isArray(generated) && generated.length) {
        setFollowUps((prev) => ({
          ...prev,
          [currentQuestionIndex]: generated,
        }));
        return generated.length;
      } else {
        // Try explicit follow-up generation if not in response
        try {
          const fu = await apiService.post(
            `/interviews/${interviewId}/followup/${currentQuestionIndex}`
          );
          const arr = fu?.data?.data?.followUpQuestions || [];
          if (arr.length) {
            setFollowUps((prev) => ({ ...prev, [currentQuestionIndex]: arr }));
            return arr.length;
          }
        } catch (_) {
          // ignore
        }
      }
      return 0;
    } catch (e) {
      // Non-blocking: log and continue
      // eslint-disable-next-line no-console
      console.warn(
        "Failed to submit answer for question",
        currentQuestionIndex,
        e
      );
      return 0;
    }
  }, [
    interview,
    interviewId,
    currentQuestionIndex,
    questionStartTime,
    responses,
  ]);

  // End interview: submit current answer, complete on server, then navigate
  const handleEndInterview = useCallback(async () => {
    try {
      await submitCurrentAnswer();
      await apiService.post(`/interviews/${interviewId}/complete`);
      toast.success("Interview completed!");
      navigate(`/interview/${interviewId}/results`);
    } catch (e) {
      toast.error("Failed to complete interview. Please try again.");
    }
  }, [navigate, interviewId, submitCurrentAnswer]);

  // Fetch interview data on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/interviews/${interviewId}`);

        if (response.success) {
          setInterview(response.data);
          // Set initial time remaining based on interview duration (convert minutes to seconds)
          const minutes =
            response.data?.duration || response.data?.config?.duration || 30;
          setTimeRemaining((minutes || 30) * 60);

          // Start interview if scheduled
          const status = response.data?.status || response.data?.config?.status;
          if (status === "scheduled") {
            try {
              await apiService.put(`/interviews/${interviewId}/start`);
            } catch (e) {
              // non-blocking
            }
          }
        } else {
          setError("Failed to load interview");
        }
      } catch (err) {
        setError("Failed to load interview");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleEndInterview]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle video uploaded
  const handleVideoUploaded = (questionIndex) => {
    setInterview((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === questionIndex ? { ...q, hasVideo: true } : q
      ),
    }));
    toast.success("Video uploaded successfully!");
  };

  // Handle response change
  const handleResponseChange = (value) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestionIndex]: value,
    }));
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  // Navigate to next question
  const handleNext = async () => {
    const fuCount = await submitCurrentAnswer();
    const hasFollowUps =
      fuCount > 0 || (followUps[currentQuestionIndex]?.length || 0) > 0;
    const acked = !!followUpsAck[currentQuestionIndex];
    if (hasFollowUps && !acked) {
      toast("Please review the follow-ups and mark them as reviewed.", {
        icon: "📝",
      });
      return;
    }
    const targetCount =
      interview?.config?.questionCount || interview.questions.length;
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex((idx) => idx + 1);
      setQuestionStartTime(Date.now());
    } else if (
      // At the end of current list
      interview?.config?.adaptiveDifficulty?.enabled &&
      interview.questions.length < targetCount
    ) {
      try {
        // Fetch next adaptive question from server and append
        const resp = await apiService.post(
          `/interviews/${interviewId}/adaptive-question`
        );
        const newQ = resp?.data?.data?.question;
        if (newQ) {
          // Normalize to client shape
          const normalized = {
            questionId: newQ.id || newQ.questionId,
            questionText: newQ.text || newQ.questionText,
            category: newQ.category,
            difficulty: newQ.difficulty,
            timeAllocated: newQ.timeAllocated || 300,
          };
          setInterview((prev) => ({
            ...prev,
            questions: [...(prev.questions || []), normalized],
          }));
          setCurrentQuestionIndex((idx) => idx + 1);
          setQuestionStartTime(Date.now());
          toast.success(`Next ${normalized.difficulty || ""} question ready`);
        } else {
          // If no question returned, end gracefully
          handleEndInterview();
        }
      } catch (_) {
        // On failure, end interview
        handleEndInterview();
      }
    } else {
      handleEndInterview();
    }
  };

  // Text-to-Speech helpers
  const stopSpeech = useCallback(() => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {
      // ignore
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const speakQuestion = useCallback(
    (text) => {
      if (!text) return;
      try {
        if (!window.speechSynthesis) {
          toast.error("Speech is not supported in this browser.");
          return;
        }
        stopSpeech();
        // Short beep before TTS and a quick visual flash
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(880, ctx.currentTime);
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.0001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
            o.start();
            o.stop(ctx.currentTime + 0.08);
          }
        } catch (_) {}
        setTtsFlash(true);
        setTimeout(() => setTtsFlash(false), 180);
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utter);
      } catch (e) {
        setIsSpeaking(false);
      }
    },
    [stopSpeech]
  );

  // Auto TTS when enabled and question changes
  useEffect(() => {
    const text =
      interview?.questions?.[currentQuestionIndex]?.questionText ||
      interview?.questions?.[currentQuestionIndex]?.text ||
      "";
    if (settings.questionAudio && text) {
      speakQuestion(text);
    } else {
      stopSpeech();
    }
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, settings.questionAudio]);

  // Toggle setting
  const toggleSetting = (setting) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-surface-700 dark:text-surface-200">
            Loading interview...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-2">Interview Not Found</h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            {error || "Unable to load interview"}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Now it's safe to access interview data
  const currentQuestion = interview.questions[currentQuestionIndex] || {};
  const targetCount =
    interview?.config?.questionCount || interview.questions.length;
  const progress = ((currentQuestionIndex + 1) / targetCount) * 100;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Interview Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">
                {interview?.config?.jobRole ||
                  interview?.jobRole ||
                  "Interview"}
              </span>{" "}
              Interview
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-surface-600 dark:text-surface-400">
                Question {currentQuestionIndex + 1} of {targetCount}
              </span>
              <span className="text-sm text-surface-600 dark:text-surface-400">
                {formatTime(timeRemaining)}
              </span>
              {/* Recording status chip */}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  isRecording
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                    : "bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-800/50 dark:text-surface-300 dark:border-surface-700"
                }`}
                title={isRecording ? "Recording in progress" : "Not recording"}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isRecording ? "bg-red-600 animate-pulse" : "bg-surface-400"
                  }`}
                ></span>
                {isRecording ? "Recording" : "Idle"}
              </span>
              {/* Video uploaded chip */}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  interview?.questions?.[currentQuestionIndex]?.hasVideo
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                    : "bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-800/50 dark:text-surface-300 dark:border-surface-700"
                }`}
                title={
                  interview?.questions?.[currentQuestionIndex]?.hasVideo
                    ? "Video uploaded"
                    : "Video not uploaded"
                }
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    interview?.questions?.[currentQuestionIndex]?.hasVideo
                      ? "bg-green-600"
                      : "bg-surface-400"
                  }`}
                ></span>
                {interview?.questions?.[currentQuestionIndex]?.hasVideo
                  ? "Video saved"
                  : "No upload"}
              </span>
              {/* TTS replay/stop */}
              <button
                className="btn-ghost !py-1 !px-2"
                title={isSpeaking ? "Stop reading" : "Play question"}
                onClick={() => {
                  const text = (
                    currentQuestion.questionText ||
                    currentQuestion.text ||
                    ""
                  ).trim();
                  if (!text) return;
                  if (isSpeaking) {
                    stopSpeech();
                  } else {
                    speakQuestion(text);
                  }
                }}
              >
                {isSpeaking ? "⏹️" : "🔊"}
              </button>
            </div>
          </div>
          <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Interview Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div className="space-y-4">
            {settings.videoRecording ? (
              <div className="card p-0 overflow-hidden">
                <VideoRecorder
                  interviewId={interview._id}
                  currentQuestionIndex={currentQuestionIndex}
                  onVideoUploaded={handleVideoUploaded}
                  onRecordingChange={setIsRecording}
                  onPermissionChange={setPermission}
                  audioEnabled={settings.audioRecording}
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
                    Video recording is disabled
                  </p>
                </div>
              </div>
            )}

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
            <div
              className={`card ${ttsFlash ? "ring-2 ring-primary-500" : ""}`}
            >
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
                        onClick={async () => {
                          setFollowUpsAck((prev) => ({
                            ...prev,
                            [currentQuestionIndex]: true,
                          }));
                          try {
                            await apiService.post(
                              `/interviews/${interviewId}/followups-reviewed/${currentQuestionIndex}`
                            );
                          } catch (_) {}
                          toast.success("Marked reviewed. You can proceed.");
                        }}
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
                onChange={(e) => handleResponseChange(e.target.value)}
                className="form-input-dark h-32"
                placeholder="Take notes or outline your response here..."
              />
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                These notes are saved with your answer for scoring and
                follow-ups.
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
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button onClick={handleNext} className="flex-1 btn-primary">
                {currentQuestionIndex >= targetCount - 1
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
                      Allow camera and microphone access in your browser to
                      record answers.
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Video Recording</span>
                  <button
                    onClick={() => toggleSetting("videoRecording")}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.videoRecording
                        ? "bg-primary-600"
                        : "bg-surface-600"
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
                    onClick={() => toggleSetting("audioRecording")}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.audioRecording
                        ? "bg-primary-600"
                        : "bg-surface-600"
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
                    onClick={() => toggleSetting("questionAudio")}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.questionAudio
                        ? "bg-primary-600"
                        : "bg-surface-600"
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

        {/* Exit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleEndInterview}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
