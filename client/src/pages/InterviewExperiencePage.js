import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { apiService } from "../services/api";
import { interviewService } from "../services/mockmate";
import CodeEditor from "../components/ui/CodeEditor";
import CodeExecutionResults from "../components/ui/CodeExecutionResults";
import { useSubscription } from "../hooks/useSubscription";
import { useTranscriptPoll } from "../hooks/useTranscriptPoll";
import TranscriptViewer from "../components/interview/TranscriptViewer";
import { useFacialExpressionAnalysis } from "../hooks/useFacialExpressionAnalysis";
import FacialMetricsPanel from "../components/interview/FacialMetricsPanel";

// CLEAN RECONSTRUCTION (Baseline) --------------------------------------------------
// This version purposefully omits the previously broken tab system & toast abstractions.
// Provides: interview Q&A + follow-ups, coding session rehydration/creation, draft persistence,
// coding submission & progression, code execution testing, basic progress bars & timers.

const InterviewExperiencePage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  // Interview state
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Follow-up questions
  const [followUpQuestions, setFollowUpQuestions] = useState({});
  const [loadingFollowUps, setLoadingFollowUps] = useState({});
  const [showFollowUps, setShowFollowUps] = useState({});

  // Coding
  const [codingLanguage, setCodingLanguage] = useState("javascript");
  const [codeExecutionResult, setCodeExecutionResult] = useState(null);
  const [isExecutingCode, setIsExecutingCode] = useState(false);
  const [codingSessionId, setCodingSessionId] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [codingSubmitting, setCodingSubmitting] = useState(false);
  const [codingCompleted, setCodingCompleted] = useState(false);
  const [codingSummary, setCodingSummary] = useState(null);

  // Facial analysis
  const facialEnabled = interview?.config?.facialAnalysis?.enabled || false;
  const {
    isInitialized: facialInitialized,
    isAnalyzing: facialAnalyzing,
    initialize: initFacial,
    startAnalysis: startFacial,
    stopAnalysis: stopFacial,
    metrics: facialMetrics,
    error: facialError,
  } = useFacialExpressionAnalysis(facialEnabled);

  const { subscription } = useSubscription();
  const { transcriptStatuses } = useTranscriptPoll(interviewId, {
    intervalMs: 7000,
  });

  // Fetch interview (baseline)
  const fetchInterview = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await apiService.get(`/interviews/${interviewId}`);
      if (!resp.success) throw new Error("Fetch failed");
      setInterview(resp.data);
      setTimeRemaining(resp.data.duration * 60);
      const init = {};
      resp.data.questions.forEach((q) => {
        init[q._id] = "";
      });
      setAnswers(init);
    } catch (e) {
      alert("Failed to load interview. Redirecting.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [interviewId, navigate]);

  // Save current answer to map
  const handleSaveAnswer = useCallback(() => {
    if (!interview) return;
    const q = interview.questions[currentQuestionIndex];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q._id]: currentAnswer }));
  }, [interview, currentQuestionIndex, currentAnswer]);

  // Generate follow-up questions
  const handleSubmitAnswerWithFollowUp = useCallback(async () => {
    if (!interview || !currentAnswer.trim()) return;
    try {
      setLoadingFollowUps((p) => ({ ...p, [currentQuestionIndex]: true }));
      const resp = await interviewService.submitAnswer(
        interviewId,
        currentQuestionIndex,
        { answer: currentAnswer, timeSpent: 0 }
      );
      if (resp.success && resp.data.followUpQuestions?.length) {
        setFollowUpQuestions((p) => ({
          ...p,
          [currentQuestionIndex]: resp.data.followUpQuestions,
        }));
        setShowFollowUps((p) => ({ ...p, [currentQuestionIndex]: true }));
      }
    } finally {
      setLoadingFollowUps((p) => ({ ...p, [currentQuestionIndex]: false }));
    }
  }, [interview, currentAnswer, interviewId, currentQuestionIndex]);

  // Complete interview
  const handleInterviewComplete = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      handleSaveAnswer();
      const payload = {
        answers,
        timeTaken: interview?.duration * 60 - timeRemaining,
      };
      if (facialEnabled && facialMetrics) {
        payload.facialMetrics = facialMetrics;
      }
      const resp = await apiService.post(
        `/interviews/${interviewId}/complete`,
        payload
      );
      if (resp.success) navigate(`/interview/${interviewId}/results`);
      else throw new Error("Submit failed");
    } catch (e) {
      alert("Failed to submit interview.");
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    handleSaveAnswer,
    interviewId,
    answers,
    interview,
    timeRemaining,
    navigate,
    facialEnabled,
    facialMetrics,
  ]);

  // Timer tick
  useEffect(() => {
    if (timeRemaining > 0) {
      const t = setTimeout(() => setTimeRemaining((s) => s - 1), 1000);
      return () => clearTimeout(t);
    } else if (timeRemaining === 0) {
      handleInterviewComplete();
    }
  }, [timeRemaining, handleInterviewComplete]);

  // Initial load
  useEffect(() => {
    if (isLoaded && user && interviewId) fetchInterview();
  }, [isLoaded, user, interviewId, fetchInterview]);

  // Rehydrate coding session if interview already has one
  useEffect(() => {
    const run = async () => {
      if (!interview || codingSessionId) return;
      const existing = interview.codingSession?.sessionId;
      if (!existing) return;
      try {
        setCodingSessionId(existing);
        const status = await apiService.get(
          `/coding/session/${existing}/status`
        );
        const challenge = await apiService.get(
          `/coding/session/${existing}/current`
        );
        if (challenge.success) {
          setCurrentChallenge(challenge.data);
          // Inject coding challenge into question list if not already present (prepend)
          if (
            !interview.questions.find(
              (q) => q.challengeId === challenge.data.id
            )
          ) {
            setInterview((prev) => ({
              ...prev,
              questions: [
                {
                  _id: `coding-${challenge.data.id}`,
                  questionText: challenge.data.title,
                  text: challenge.data.title,
                  category: "coding",
                  type: "technical",
                  difficulty: challenge.data.difficulty || "medium",
                  challengeId: challenge.data.id,
                  timeAllocated: (challenge.data.timeLimit || 30) * 60,
                },
                ...prev.questions,
              ],
            }));
          }
          try {
            const draft = localStorage.getItem(
              `codingDraft:${existing}:${challenge.data.id}`
            );
            if (draft) setCurrentAnswer(draft);
          } catch (_) {}
        }
        if (status?.data?.status === "completed") {
          setCodingCompleted(true);
          try {
            const res = await apiService.get(
              `/coding/interview/${interview._id}/results`
            );
            if (res.success) setCodingSummary(res.data.results || res.data);
          } catch (_) {}
        }
      } catch (e) {
        /* silent rehydrate issue */
      }
    };
    run();
  }, [interview, codingSessionId]);

  // Create coding session if config present & none exists yet
  useEffect(() => {
    const run = async () => {
      if (!interview || codingSessionId) return;
      const cfg = interview?.config?.coding;
      if (!cfg) return;
      try {
        const resp = await apiService.post("/coding/session", {
          interviewId: interview._id,
          config: {
            challengeCount: cfg.challengeCount || cfg.codingChallengeCount || 1,
            difficulty: cfg.difficulty || "mixed",
            language: cfg.language || "javascript",
          },
        });
        if (resp.success) {
          setCodingSessionId(resp.data.sessionId);
          setCurrentChallenge(resp.data.currentChallenge);
          if (
            resp.data.currentChallenge &&
            !interview.questions.find(
              (q) => q.challengeId === resp.data.currentChallenge.id
            )
          ) {
            setInterview((prev) => ({
              ...prev,
              questions: [
                {
                  _id: `coding-${resp.data.currentChallenge.id}`,
                  questionText: resp.data.currentChallenge.title,
                  text: resp.data.currentChallenge.title,
                  category: "coding",
                  type: "technical",
                  difficulty: resp.data.currentChallenge.difficulty || "medium",
                  challengeId: resp.data.currentChallenge.id,
                  timeAllocated:
                    (resp.data.currentChallenge.timeLimit || 30) * 60,
                },
                ...prev.questions,
              ],
            }));
            setCurrentQuestionIndex(0);
            try {
              const draft = localStorage.getItem(
                `codingDraft:${resp.data.sessionId}:${resp.data.currentChallenge.id}`
              );
              if (draft) setCurrentAnswer(draft);
            } catch (_) {}
          }
        }
      } catch (e) {
        /* creation failure silent */
      }
    };
    run();
  }, [interview, codingSessionId]);

  // Submit coding challenge then move to next
  const submitCodingAndNext = async () => {
    if (!codingSessionId || !currentChallenge) return;
    if (!currentAnswer.trim()) {
      alert("Write code before submitting.");
      return;
    }
    setCodingSubmitting(true);
    try {
      const submitResp = await apiService.post(
        `/coding/session/${codingSessionId}/submit`,
        {
          challengeId: currentChallenge.id,
          code: currentAnswer,
          language: codingLanguage,
        }
      );
      if (submitResp.success) {
        setCodeExecutionResult(submitResp.data);
        const nextResp = await apiService.post(
          `/coding/session/${codingSessionId}/next`
        );
        if (nextResp.success) {
          if (nextResp.data.completed) {
            setCodingCompleted(true);
            try {
              const res = await apiService.get(
                `/coding/interview/${interview._id}/results`
              );
              if (res.success) setCodingSummary(res.data.results || res.data);
            } catch (_) {}
          } else if (nextResp.data.challenge) {
            setCurrentChallenge(nextResp.data.challenge);
            // Append new coding question at end (distinct from initial prepend)
            setInterview((prev) => ({
              ...prev,
              questions: [
                ...prev.questions,
                {
                  _id: `coding-${nextResp.data.challenge.id}`,
                  questionText: nextResp.data.challenge.title,
                  text: nextResp.data.challenge.title,
                  category: "coding",
                  type: "technical",
                  difficulty: nextResp.data.challenge.difficulty || "medium",
                  challengeId: nextResp.data.challenge.id,
                  timeAllocated: (nextResp.data.challenge.timeLimit || 30) * 60,
                },
              ],
            }));
            try {
              const draft = localStorage.getItem(
                `codingDraft:${codingSessionId}:${nextResp.data.challenge.id}`
              );
              setCurrentAnswer(draft || "");
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      /* submission failure silent */
    } finally {
      setCodingSubmitting(false);
    }
  };

  // Editor / textarea change
  const handleAnswerChange = (value) => {
    const newVal = typeof value === "string" ? value : value.target.value;
    setCurrentAnswer(newVal);
    if (codingSessionId && currentChallenge) {
      try {
        localStorage.setItem(
          `codingDraft:${codingSessionId}:${currentChallenge.id}`,
          newVal
        );
      } catch (_) {}
    }
  };

  // Execute code (test run)
  const handleCodeExecution = async () => {
    if (!currentAnswer.trim()) {
      alert("Please write some code before running it.");
      return;
    }
    setIsExecutingCode(true);
    setCodeExecutionResult(null);
    try {
      if (codingLanguage !== "javascript") {
        try {
          const health = await apiService.get("/coding/health");
          if (!health?.judge0?.available) {
            setCodeExecutionResult({
              success: false,
              error: "Multi-language execution requires Judge0 configuration.",
            });
            setIsExecutingCode(false);
            return;
          }
        } catch (_) {}
      }
      const cq = interview.questions[currentQuestionIndex];
      const resp = await apiService.post("/coding/test", {
        code: currentAnswer,
        language: codingLanguage,
        challengeId: cq.challengeId || "default-challenge",
      });
      if (resp.success) setCodeExecutionResult(resp.data);
      else
        setCodeExecutionResult({
          success: false,
          error: resp.message || "Code execution failed",
        });
    } catch (e) {
      setCodeExecutionResult({
        success: false,
        error: "Failed to execute code.",
      });
    } finally {
      setIsExecutingCode(false);
    }
  };

  // Navigation
  const handleNextQuestion = () => {
    handleSaveAnswer();
    if (currentQuestionIndex < interview.questions.length - 1) {
      const next = currentQuestionIndex + 1;
      setCurrentQuestionIndex(next);
      const id = interview.questions[next]._id;
      setCurrentAnswer(answers[id] || "");
    }
  };
  const handlePreviousQuestion = () => {
    handleSaveAnswer();
    if (currentQuestionIndex > 0) {
      const prev = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prev);
      const id = interview.questions[prev]._id;
      setCurrentAnswer(answers[id] || "");
    }
  };

  // Helpers
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };
  const getProgressPercentage = () =>
    !interview?.questions.length
      ? 0
      : Math.round(
          ((currentQuestionIndex + 1) / interview.questions.length) * 100
        );

  const [compact, setCompact] = useState(false);

  // Adaptive difficulty helpers
  const adaptiveEnabled = interview?.config?.adaptiveDifficulty?.enabled;
  const totalPlanned = interview?.config?.questionCount || 0;
  const answeredCount =
    interview?.questions?.filter((q) => q.response?.text).length || 0;

  const fetchNextAdaptiveQuestion = useCallback(async () => {
    if (!adaptiveEnabled) return;
    try {
      const resp = await apiService.post(
        `/interviews/${interviewId}/adaptive-question`
      );
      if (resp.success && resp.data?.question) {
        setInterview((prev) => ({
          ...prev,
          questions: [
            ...prev.questions,
            {
              _id: resp.data.question.id || `adaptive-${Date.now()}`,
              questionText: resp.data.question.text,
              text: resp.data.question.text,
              category: resp.data.question.category,
              difficulty: resp.data.question.difficulty,
              timeAllocated: resp.data.question.timeAllocated,
              adaptiveGenerated: true,
            },
          ],
        }));
        // Refresh interview details to pull updated difficulty history from server
        try {
          const detail = await apiService.get(`/interviews/${interviewId}`);
          if (detail.success) setInterview(detail.data);
        } catch (_) {
          /* silent */
        }
        // Toast notification
        setToasts((t) => [
          ...t,
          {
            id: Date.now(),
            message: `Adaptive question added (${resp.data.question.difficulty})`,
          },
        ]);
      }
    } catch (_) {
      /* non-fatal */
    }
  }, [adaptiveEnabled, interviewId]);

  // Request next adaptive question automatically after submitting answer if needed
  useEffect(() => {
    if (!adaptiveEnabled) return;
    // If we have answered last non-adaptive question and still below planned total
    if (
      interview &&
      answeredCount === interview.questions.length &&
      answeredCount < totalPlanned
    ) {
      fetchNextAdaptiveQuestion();
    }
  }, [
    answeredCount,
    adaptiveEnabled,
    interview,
    fetchNextAdaptiveQuestion,
    totalPlanned,
  ]);

  // Facial metrics controls
  const facialToggle = () => {
    if (!facialInitialized) {
      initFacial();
    } else if (!facialAnalyzing) {
      const videoEl = document.querySelector("video");
      if (videoEl) startFacial(videoEl);
    } else {
      stopFacial();
    }
  };

  // Toast system (ephemeral)
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((curr) => curr.filter((c) => c.id !== t.id));
      }, 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  // Loading / missing
  if (!isLoaded || loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  if (!interview)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Interview not found</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary px-6 py-3"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );

  const currentQuestion = interview.questions[currentQuestionIndex];
  const codingQuestions = interview.questions.filter(
    (q) => q.category === "coding"
  );
  const codingProgress = codingQuestions.length
    ? Math.min(
        codingQuestions.filter(
          (_, i) =>
            i <=
            codingQuestions.findIndex(
              (q) => q.challengeId === currentChallenge?.id
            )
        ).length,
        codingQuestions.length
      )
    : 0;

  const adaptiveInfo = interview?.config?.adaptiveDifficulty;
  // answeredCount already declared earlier (line ~430) - do not redeclare

  const SPARKLINE_MIN_POINTS = 3;
  const sparklineEnabled =
    (process.env.REACT_APP_ENABLE_SPARKLINE || "true") !== "false";

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-surface-50 via-surface-50 to-surface-100 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800 transition-colors ${
        compact ? "density-compact" : ""
      }`}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-surface-800/70 bg-white/90 dark:bg-surface-800/90 border-b border-surface-200 dark:border-surface-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-surface-900 dark:text-surface-50">
              {interview.jobRole} Interview
            </h1>
            {adaptiveInfo?.enabled && (
              <span
                className="hidden md:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                title="Adaptive difficulty active"
              >
                🎯 Adaptive
              </span>
            )}
            <span className="hidden md:inline-block text-xs font-medium px-2 py-1 rounded bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              Question {currentQuestionIndex + 1}/{interview.questions.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              onClick={() => setCompact((c) => !c)}
              className="text-xs font-medium px-2 py-1 rounded border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition"
              title="Toggle compact mode"
              aria-pressed={compact}
            >
              {compact ? "Comfort" : "Compact"}
            </button>
            {/* Question Progress */}
            <div
              className="flex items-center gap-2"
              aria-label="Question progress"
              role="progressbar"
              aria-valuenow={getProgressPercentage()}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className="text-xs uppercase tracking-wide font-medium text-surface-500 dark:text-surface-400">
                Questions
              </span>
              <div className="h-2 w-32 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-surface-700 dark:text-surface-200 tabular-nums">
                {getProgressPercentage()}%
              </span>
            </div>
            {codingSessionId && (
              <div
                className="flex items-center gap-2"
                aria-label="Coding progress"
              >
                <span className="text-xs uppercase tracking-wide font-medium text-surface-500 dark:text-surface-400">
                  Coding
                </span>
                <div className="h-2 w-24 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                    style={{
                      width: `${
                        codingQuestions.length
                          ? (codingProgress / codingQuestions.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-200 tabular-nums">
                  {codingProgress}/{codingQuestions.length || 0}
                </span>
              </div>
            )}
            {adaptiveInfo?.enabled && (
              <div
                className="flex items-center gap-2"
                title="Adaptive difficulty progression"
              >
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
                  Difficulty
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold tabular-nums">
                  <span>
                    {adaptiveInfo.currentDifficulty ||
                      interview.config?.difficulty}
                  </span>
                  {/* sparkline */}
                  {sparklineEnabled &&
                    (adaptiveInfo.difficultyHistory?.length || 0) >=
                      SPARKLINE_MIN_POINTS && (
                      <svg
                        width="60"
                        height="16"
                        viewBox="0 0 60 16"
                        className="text-primary-500 dark:text-primary-400"
                      >
                        {(() => {
                          const levels = {
                            beginner: 12,
                            intermediate: 8,
                            advanced: 4,
                          };
                          const hist =
                            adaptiveInfo.difficultyHistory.slice(-10);
                          const denom = Math.max(
                            1,
                            Math.min(9, hist.length - 1)
                          );
                          const pts = hist
                            .map((d, i) => {
                              const y = levels[d.difficulty] ?? 8;
                              const x = (i / denom) * 60;
                              return `${x},${y}`;
                            })
                            .join(" ");
                          return (
                            <polyline
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              points={pts}
                            />
                          );
                        })()}
                      </svg>
                    )}
                </div>
              </div>
            )}
            <div
              className={`flex items-center gap-2 text-sm font-mono font-semibold px-3 py-1.5 rounded border shadow-sm leading-none select-none ${
                timeRemaining < 300
                  ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200"
                  : "border-primary-300 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-200"
              }`}
            >
              <span className="tracking-tight">
                ⏱ {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card p-6 md:p-8 shadow-lg border border-surface-200 dark:border-surface-700/60 bg-white/95 dark:bg-surface-800/80 backdrop-blur-sm">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ring-1 ring-inset shadow-sm ${
                    currentQuestion.type === "technical"
                      ? "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-800"
                      : currentQuestion.type === "behavioral"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800"
                      : "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:ring-purple-800"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                  {currentQuestion.type}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset shadow-sm ${
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-800"
                      : currentQuestion.difficulty === "medium"
                      ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800"
                      : "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800"
                  }`}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-surface-900 via-surface-800 to-surface-600 dark:from-surface-50 dark:via-surface-100 dark:to-surface-300">
              {currentQuestion.text}
            </h2>
            {currentQuestion.context && (
              <div className="relative group bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-700 rounded-lg p-4 md:p-5 mb-6 border border-surface-200 dark:border-surface-600 overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_70%)]" />
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-surface-800 dark:text-surface-100">
                  Context{" "}
                  <span className="text-xs font-normal px-2 py-0.5 rounded bg-surface-200/60 dark:bg-surface-900/40">
                    Info
                  </span>
                </h4>
                <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                  {currentQuestion.context}
                </p>
              </div>
            )}
          </div>

          <div className="mb-10">
            <label htmlFor="answer" className="block text-lg font-medium mb-4">
              Your Answer:
            </label>
            {currentQuestion.type === "technical" &&
            currentQuestion.category === "coding" ? (
              <div className="space-y-4">
                <CodeEditor
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  language={codingLanguage}
                  onLanguageChange={setCodingLanguage}
                  onRun={handleCodeExecution}
                  loading={isExecutingCode}
                  height="400px"
                />
                <CodeExecutionResults
                  result={codeExecutionResult}
                  loading={isExecutingCode}
                />
                <p className="text-xs md:text-sm text-surface-500 flex items-start gap-2 bg-surface-100 dark:bg-surface-700/40 rounded-md px-3 py-2 border border-surface-200 dark:border-surface-600">
                  <span className="text-primary-600 dark:text-primary-400">
                    💡
                  </span>
                  <span>
                    Consider edge cases & performance (e.g. O(n) vs O(n²)). Use
                    Ctrl+Enter to run tests.
                  </span>
                </p>
                {codingSessionId && (
                  <div className="flex gap-4 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={submitCodingAndNext}
                      disabled={codingSubmitting}
                      className="btn-secondary disabled:opacity-50 shadow-sm hover:shadow transition-shadow"
                    >
                      {codingSubmitting
                        ? "Submitting..."
                        : "Submit & Next Challenge"}
                    </button>
                    {codingCompleted && codingSummary && (
                      <span className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded px-3 py-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                        Session Complete • Score{" "}
                        {codingSummary.finalScore ||
                          codingSummary.overallScore ||
                          0}
                        %
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  id="answer"
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  placeholder="Provide your detailed answer here..."
                  className="form-input h-48 resize-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500 transition"
                />
                <p className="text-xs md:text-sm text-surface-500 flex items-start gap-2 bg-surface-100 dark:bg-surface-700/40 rounded-md px-3 py-2 border border-surface-200 dark:border-surface-600">
                  <span className="text-primary-600 dark:text-primary-400">
                    💡
                  </span>
                  <span>
                    Use the <strong>STAR</strong> method: Situation • Task •
                    Action • Result. Keep answers concise but specific.
                  </span>
                </p>
              </div>
            )}
            <div className="mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Voice Response (Optional)</h4>
                  <p className="text-sm text-surface-600">
                    Practice speaking your answer
                  </p>
                </div>
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={
                    isRecording
                      ? "btn-outline text-red-600 border-red-300"
                      : "btn-primary"
                  }
                >
                  {isRecording ? "🎙️ Stop Recording" : "🎤 Start Recording"}
                </button>
              </div>
            </div>
          </div>

          {currentAnswer.trim() && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Follow-up Questions</h3>
                {!showFollowUps[currentQuestionIndex] && (
                  <button
                    onClick={handleSubmitAnswerWithFollowUp}
                    disabled={loadingFollowUps[currentQuestionIndex]}
                    className="btn-primary text-sm disabled:opacity-50 shadow-sm hover:shadow transition-shadow"
                  >
                    {loadingFollowUps[currentQuestionIndex] ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generating...
                      </>
                    ) : (
                      "Generate Follow-ups"
                    )}
                  </button>
                )}
              </div>
              {showFollowUps[currentQuestionIndex] &&
                followUpQuestions[currentQuestionIndex] && (
                  <div className="relative overflow-hidden group bg-gradient-to-br from-primary-50 via-primary-50 to-white dark:from-primary-900/20 dark:via-primary-900/10 dark:to-surface-800 border border-primary-200 dark:border-primary-700 rounded-lg p-6">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-200/40 dark:bg-primary-600/20 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity" />
                    <div className="space-y-4">
                      {followUpQuestions[currentQuestionIndex].map((f, i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-medium">
                              {i + 1}
                            </span>
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">{f.text}</p>
                            {f.type && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                                {f.type}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-primary-100/70 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-700 rounded-lg text-primary-800 dark:text-primary-200 text-sm flex gap-2 items-start">
                      <span>💡</span>
                      <p>
                        Reflect on how you'd answer these and how they relate to
                        your primary response.
                      </p>
                    </div>
                  </div>
                )}
              {!showFollowUps[currentQuestionIndex] &&
                !loadingFollowUps[currentQuestionIndex] && (
                  <div className="bg-surface-100 dark:bg-surface-800/60 border rounded-lg p-4 text-sm text-surface-600 dark:text-surface-400 flex gap-2">
                    <span>💡</span>
                    <span>Complete your answer then generate follow-ups.</span>
                  </div>
                )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="btn-ghost disabled:opacity-50 h-11"
            >
              ← Previous
            </button>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handleSaveAnswer}
                className="btn-outline shadow-sm hover:shadow transition-shadow"
              >
                💾 Save Answer
              </button>
              {currentAnswer.trim() && !showFollowUps[currentQuestionIndex] && (
                <button
                  onClick={handleSubmitAnswerWithFollowUp}
                  disabled={loadingFollowUps[currentQuestionIndex]}
                  className="btn-primary shadow-sm hover:shadow transition-shadow disabled:opacity-50"
                >
                  {loadingFollowUps[currentQuestionIndex]
                    ? "Generating..."
                    : "Generate Follow-ups"}
                </button>
              )}
              <button
                onClick={handleNextQuestion}
                disabled={
                  currentQuestionIndex >= interview.questions.length - 1
                }
                className="btn-secondary disabled:opacity-50 h-11"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {/* Subscription badge */}
        <div className="text-xs mb-4 opacity-70">
          Plan:{" "}
          {subscription.unlimited
            ? "Premium (unlimited)"
            : `Free (${subscription.remaining} left)`}
        </div>
        {/* Existing interview UI retained */}
        {interview && (
          <div className="mt-6 space-y-4">
            {adaptiveEnabled && (
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600 text-xs flex items-center justify-between">
                <div>
                  Adaptive Difficulty Active • Answered {answeredCount}/
                  {totalPlanned}
                  {interview.config?.adaptiveDifficulty?.currentDifficulty && (
                    <span className="ml-2 font-medium">
                      Current:{" "}
                      {interview.config.adaptiveDifficulty.currentDifficulty}
                    </span>
                  )}
                </div>
                <button
                  onClick={fetchNextAdaptiveQuestion}
                  disabled={answeredCount >= totalPlanned}
                  className="btn-outline !px-2 !py-1 text-[11px] disabled:opacity-40"
                >
                  Next Adaptive
                </button>
              </div>
            )}
            {/* Facial metrics panel */}
            {facialEnabled && subscription.isPremium && (
              <FacialMetricsPanel
                metrics={facialMetrics}
                analyzing={facialAnalyzing}
                initialized={facialInitialized}
                error={facialError}
                onStart={facialToggle}
                onStop={facialToggle}
              />
            )}
            <TranscriptViewer
              transcriptsMap={transcriptStatuses}
              questions={interview.questions}
            />
          </div>
        )}
      </div>

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="px-4 py-2 rounded-lg shadow bg-surface-900/90 text-white text-sm animate-fade-in"
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewExperiencePage;
