import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { apiService } from "../services/api";
import TranscriptDisplay from "../components/TranscriptDisplay";
import Collapsible from "../components/ui/Collapsible";
import { scoreFgClass, scoreBgClass, scoreLabel } from "../utils/scoreUtils";

const InterviewResultsPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useAuthContext();

  // State
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codingResults, setCodingResults] = useState(null);
  const [compact, setCompact] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const defaultOpen = !isMobile; // collapse by default on mobile for density

  // Fetch interview + analysis results
  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(
        `/interviews/${interviewId}/results`
      );
      if (response?.success) setResults(response.data);
      else throw new Error("Failed");
    } catch (e) {
      alert("Failed to load results. Redirecting to dashboard.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [interviewId, navigate]);

  // Initial fetch
  useEffect(() => {
    if (isLoaded && user && interviewId) fetchResults();
  }, [isLoaded, user, interviewId, fetchResults]);

  // Fetch coding challenge results after main results load
  useEffect(() => {
    const run = async () => {
      if (!results) return;
      try {
        const r = await apiService.get(
          `/coding/interview/${interviewId}/results`
        );
        if (r?.success) setCodingResults(r.data);
      } catch (_) {}
    };
    run();
  }, [results, interviewId]);

  const getScoreColor = (s) => scoreFgClass(s);
  const getScoreBgColor = (s) => scoreBgClass(s);

  // Loading / empty states
  if (!isLoaded || loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );

  if (!results)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Results not available</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary px-6 py-3"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );

  const { interview, analysis } = results;
  const facialMetrics = interview.metrics || {};
  const hasFacial = Object.keys(facialMetrics).some(
    (k) =>
      [
        "eyeContactScore",
        "blinkRate",
        "smilePercentage",
        "headSteadiness",
        "offScreenPercentage",
        "environmentQuality",
        "confidenceScore",
      ].includes(k) && facialMetrics[k] != null
  );

  return (
    <div
      className={`min-h-screen bg-surface-50 dark:bg-surface-900 py-6 md:py-8 transition-colors duration-200 ${
        compact ? "density-compact" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-secondary !py-2 !px-4 text-sm w-full sm:w-auto"
          >
            ← Dashboard
          </button>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setCompact((c) => !c)}
              className="btn-outline !py-2 !px-4 text-sm"
            >
              {compact ? "Comfortable Mode" : "Compact Mode"}
            </button>
            <button
              onClick={() => window.print()}
              className="btn-ghost border border-surface-200 dark:border-surface-700 rounded-xl !py-2 !px-4 text-sm"
            >
              🖨 Print
            </button>
          </div>
        </div>

        {/* Header / Hero */}
        <div className="card p-6 md:p-8 relative overflow-hidden card-accent-gradient">
          <div
            className="absolute -top-16 -right-16 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-16 -left-16 w-64 h-64 bg-secondary-400/20 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div className="text-center relative">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
                  Interview Complete!
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-2">
                  {interview.jobRole} • {interview.interviewType} interview
                </p>
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-2xl font-bold shadow-inner border score-chip-glow ${getScoreBgColor(
                analysis.overallScore
              )} ${getScoreColor(analysis.overallScore)}`}
            >
              <span>{analysis.overallScore}%</span>
              <span className="hidden sm:inline text-base font-semibold px-3 py-1 rounded-full bg-white/60 dark:bg-surface-900/40 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200">
                {scoreLabel(analysis.overallScore)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 collapsible-stack">
            {codingResults?.results && (
              <Collapsible
                title={
                  <span className="flex items-center gap-2">
                    💻 <span>Coding Challenge Summary</span>
                  </span>
                }
                defaultOpen={defaultOpen}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <SummaryTile
                    label="Final Score"
                    value={`${
                      codingResults.results.finalScore ||
                      codingResults.results.overallScore ||
                      0
                    }%`}
                  />
                  <SummaryTile
                    label="Challenges"
                    value={`${codingResults.results.challengesCompleted}/${codingResults.results.totalChallenges}`}
                  />
                  <SummaryTile
                    label="Avg Score"
                    value={codingResults.results.averageScore || 0}
                  />
                  <SummaryTile
                    label="Time (s)"
                    value={Math.round(
                      (codingResults.results.totalTime || 0) / 1000
                    )}
                  />
                </div>
                {codingResults.results.submissions?.length ? (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                      Challenge Details
                    </h3>
                    {codingResults.results.submissions.map((s, idx) => (
                      <div
                        key={s.challengeId + idx}
                        className="p-4 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-surface-800 dark:text-surface-200">
                            #{idx + 1} {s.challengeId}
                          </span>
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {s.score || 0}%
                          </span>
                        </div>
                        {s.testResults && (
                          <div className="flex flex-wrap gap-1 text-xs">
                            {s.testResults.map((tr) => (
                              <span
                                key={tr.testIndex}
                                className={`px-2 py-0.5 rounded-full border ${
                                  tr.passed
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
                                    : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700"
                                }`}
                              >
                                T{tr.testIndex + 1}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Collapsible>
            )}

            <Collapsible
              title={"📊 Performance Breakdown"}
              defaultOpen={defaultOpen}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Technical Skills", value: analysis.technicalScore },
                  {
                    label: "Communication",
                    value: analysis.communicationScore,
                  },
                  {
                    label: "Problem Solving",
                    value: analysis.problemSolvingScore,
                  },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className={`text-4xl font-bold mb-2 ${getScoreColor(
                        item.value
                      )}`}
                    >
                      {item.value}%
                    </div>
                    <div className="text-surface-600 dark:text-surface-400 font-medium">
                      {item.label}
                    </div>
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          item.value >= 80
                            ? "bg-green-500"
                            : item.value >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>

            {hasFacial && (
              <Collapsible
                title={"🎥 Facial & Delivery Metrics"}
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    ["Eye Contact", facialMetrics.eyeContactScore, "%"],
                    ["Confidence", facialMetrics.confidenceScore, "%"],
                    ["Smile", facialMetrics.smilePercentage, "%"],
                    ["Blink Rate", facialMetrics.blinkRate, "/min"],
                    ["Steadiness", facialMetrics.headSteadiness, "%"],
                    ["Off Screen", facialMetrics.offScreenPercentage, "%"],
                  ]
                    .filter(([, v]) => v != null)
                    .map(([label, val, suffix]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-surface-600 dark:text-surface-400">
                            {label}
                          </span>
                          <span className="font-semibold tabular-nums text-surface-900 dark:text-surface-200">
                            {Math.round(val)}
                            {suffix}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                            style={{
                              width: `${Math.min(100, Math.max(0, val))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
                {facialMetrics.environmentQuality != null && (
                  <div className="mt-4 text-xs text-surface-500 dark:text-surface-400">
                    Environment Quality:{" "}
                    {Math.round(facialMetrics.environmentQuality)}%
                  </div>
                )}
              </Collapsible>
            )}

            <Collapsible title={"🧩 Question Analysis"} defaultOpen={false}>
              <div className="space-y-6">
                {analysis.questionAnalysis.map((qa, index) => {
                  const raw = (qa.difficulty || "").toLowerCase();
                  const norm =
                    raw === "easy" || raw === "beginner"
                      ? "beginner"
                      : raw === "medium" || raw === "intermediate"
                      ? "intermediate"
                      : raw === "hard" || raw === "advanced"
                      ? "advanced"
                      : raw || "unknown";
                  const diffCls =
                    norm === "beginner"
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                      : norm === "intermediate"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
                      : norm === "advanced"
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                      : "bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-800/50 dark:text-surface-300 dark:border-surface-700";
                  const scoreVal =
                    typeof qa.score === "object" ? qa.score.overall : qa.score;
                  return (
                    <div
                      key={index}
                      className="border-b border-surface-200 dark:border-surface-700 pb-6 last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
                            Question {index + 1}
                          </h4>
                          <p className="text-surface-700 dark:text-surface-300 text-sm mb-2">
                            {qa.question}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                qa.type === "technical"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {qa.type}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${diffCls}`}
                            >
                              🎯 {norm.charAt(0).toUpperCase() + norm.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div
                            className={`text-2xl font-bold ${getScoreColor(
                              scoreVal
                            )}`}
                          >
                            {scoreVal}%
                          </div>
                          <div className="text-xs text-surface-500 dark:text-surface-400">
                            {qa.timeSpent}s
                          </div>
                        </div>
                      </div>
                      <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 mb-3 border border-surface-200 dark:border-surface-700">
                        <h5 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                          Your Answer:
                        </h5>
                        <p className="text-surface-700 dark:text-surface-300 text-sm">
                          {qa.userAnswer}
                        </p>
                        {qa.userNotes && (
                          <div className="mt-3 p-3 rounded-lg bg-surface-100 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
                            <div className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">
                              Your Notes
                            </div>
                            <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-line">
                              {qa.userNotes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {qa.score &&
                          typeof qa.score === "object" &&
                          qa.score.rubricScores && (
                            <div className="bg-blue-50 dark:bg-surface-800/50 rounded-lg p-4 border border-blue-100/60 dark:border-surface-700">
                              <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                                📊 Rubric Scores (1-5 Scale):
                              </h5>
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(qa.score.rubricScores).map(
                                  ([criterion, val]) => (
                                    <div key={criterion} className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium capitalize text-surface-700 dark:text-surface-300">
                                          {criterion}
                                        </span>
                                        <span className="text-sm font-bold text-blue-700">
                                          {val}/5
                                        </span>
                                      </div>
                                      <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-500 ${
                                            val >= 4
                                              ? "bg-green-500"
                                              : val >= 3
                                              ? "bg-yellow-500"
                                              : "bg-red-500"
                                          }`}
                                          style={{
                                            width: `${(val / 5) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium text-green-800 mb-1">
                              ✅ Strengths:
                            </h5>
                            <ul className="list-disc list-inside text-sm text-surface-700 dark:text-surface-300 space-y-1">
                              {qa.feedback.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-red-800 mb-1">
                              ❌ Areas for Improvement:
                            </h5>
                            <ul className="list-disc list-inside text-sm text-surface-700 dark:text-surface-300 space-y-1">
                              {qa.feedback.improvements.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        {qa.feedback?.modelAnswer && (
                          <div className="bg-green-50 dark:bg-surface-800/50 rounded-lg p-4 border border-green-100/60 dark:border-surface-700">
                            <h5 className="font-medium text-green-900 mb-2 flex items-center">
                              💡 Model Answer:
                            </h5>
                            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                              {qa.feedback.modelAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <TranscriptDisplay
                          interviewId={interviewId}
                          questionIndex={index}
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Collapsible>
          </div>

          {/* Right Column */}
          <div className="space-y-6 collapsible-stack">
            {interview?.config?.adaptiveDifficulty?.enabled && (
              <Collapsible title={"🧪 Adaptive Summary"} defaultOpen={false}>
                {(() => {
                  const hist =
                    interview?.config?.adaptiveDifficulty?.difficultyHistory ||
                    [];
                  if (!hist.length)
                    return (
                      <div className="text-sm text-surface-600 dark:text-surface-400">
                        No adaptive changes recorded.
                      </div>
                    );
                  let increases = 0,
                    decreases = 0;
                  const rank = { beginner: 0, intermediate: 1, advanced: 2 };
                  for (let i = 1; i < hist.length; i++) {
                    const prev = hist[i - 1].difficulty;
                    const cur = hist[i].difficulty;
                    if (rank[cur] > rank[prev]) increases++;
                    else if (rank[cur] < rank[prev]) decreases++;
                  }
                  const finalDiff =
                    interview?.config?.adaptiveDifficulty?.currentDifficulty ||
                    hist[hist.length - 1].difficulty;
                  const chip = (d) => {
                    const cls =
                      d === "beginner"
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                        : d === "intermediate"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
                    return (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${cls}`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </span>
                    );
                  };
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-600 dark:text-surface-400">
                          Increases:
                        </span>
                        <span className="font-medium">{increases}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-600 dark:text-surface-400">
                          Decreases:
                        </span>
                        <span className="font-medium">{decreases}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-surface-600 dark:text-surface-400">
                          Final Difficulty:
                        </span>
                        <span className="font-medium">{chip(finalDiff)}</span>
                      </div>
                    </div>
                  );
                })()}
              </Collapsible>
            )}

            <Collapsible title={"🧾 Interview Stats"} defaultOpen={defaultOpen}>
              <div className="space-y-4">
                <StatRow
                  label="Duration"
                  value={`${Math.floor(interview.duration / 60)}m ${
                    interview.duration % 60
                  }s`}
                />
                <StatRow label="Questions" value={interview.questions.length} />
                <StatRow
                  label="Completed"
                  value={new Date(interview.completedAt).toLocaleDateString()}
                />
                <StatRow
                  label="Type"
                  value={
                    <span className="capitalize">
                      {interview.interviewType}
                    </span>
                  }
                />
              </div>
            </Collapsible>

            {interview?.config?.adaptiveDifficulty?.enabled && (
              <Collapsible title={"📈 Difficulty History"} defaultOpen={false}>
                {interview?.config?.adaptiveDifficulty?.difficultyHistory
                  ?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {interview.config.adaptiveDifficulty.difficultyHistory.map(
                      (h, idx) => (
                        <span
                          key={idx}
                          title={new Date(h.timestamp).toLocaleString()}
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            h.difficulty === "beginner"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                              : h.difficulty === "intermediate"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                          }`}
                        >
                          Q{h.questionIndex + 1}: {h.difficulty}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-surface-600 dark:text-surface-400">
                    No difficulty changes recorded.
                  </div>
                )}
              </Collapsible>
            )}

            <Collapsible
              title={"🔑 Key Recommendations"}
              defaultOpen={defaultOpen}
            >
              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </Collapsible>

            <Collapsible title={"🎯 Focus Areas"} defaultOpen={false}>
              <div className="space-y-3">
                {analysis.focusAreas.map((area, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700"
                  >
                    <div>
                      <div className="font-medium text-surface-900 dark:text-surface-50">
                        {area.skill}
                      </div>
                      <div className="text-xs text-surface-600 dark:text-surface-400">
                        {area.priority} priority
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        area.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : area.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {area.currentLevel}
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>

            <Collapsible title={"🚀 Next Steps"} defaultOpen={defaultOpen}>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/session-summary/${interviewId}`)}
                  className="btn-primary w-full"
                >
                  📋 View Session Summary
                </button>
                <button
                  onClick={() => navigate("/interview/new")}
                  className="btn-secondary w-full"
                >
                  🎯 Start New Interview
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn-outline w-full"
                >
                  📊 View Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-ghost w-full"
                >
                  📄 Print Results
                </button>
              </div>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small presentational helpers ----------------------------------
const SummaryTile = ({ label, value }) => (
  <div className="p-3 rounded bg-white/70 dark:bg-surface-800/50 border border-emerald-200 dark:border-emerald-700">
    <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
      {label}
    </div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

const StatRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-surface-600 dark:text-surface-400">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default InterviewResultsPage;
