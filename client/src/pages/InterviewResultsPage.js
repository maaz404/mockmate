import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { apiService } from "../services/api";
import TranscriptDisplay from "../components/TranscriptDisplay";

const InterviewResultsPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codingResults, setCodingResults] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(
        `/interviews/${interviewId}/results`
      );
      if (response.success) {
        setResults(response.data);
      } else {
        throw new Error("Failed to fetch results");
      }
    } catch (error) {
      // Error fetching results
      alert("Failed to load results. Redirecting to dashboard.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [interviewId, navigate]);

  useEffect(() => {
    if (isLoaded && user && interviewId) {
      fetchResults();
    }
  }, [isLoaded, user, interviewId, fetchResults]);

  // Fetch coding results (best-effort) once interview core results loaded
  useEffect(() => {
    const fetchCoding = async () => {
      if (!results) return;
      try {
        const resp = await apiService.get(`/coding/interview/${interviewId}/results`);
        if (resp.success) {
          setCodingResults(resp.data);
        }
      } catch (_) {
        // ignore if not present
      }
    };
    fetchCoding();
  }, [results, interviewId]);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-4">
            Results not available
          </h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { interview, analysis } = results;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card p-8 mb-8">
          <div className="text-center">
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

            {/* Overall Score */}
            <div
              className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getScoreBgColor(
                analysis.overallScore
              )} ${getScoreColor(analysis.overallScore)}`}
            >
              Overall Score: {analysis.overallScore}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {codingResults && codingResults.results && (
              <div className="card p-6 border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">
                <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                  <span>💻 Coding Challenge Summary</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 rounded bg-white/70 dark:bg-surface-800/50 border border-emerald-200 dark:border-emerald-700">
                    <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Final Score</div>
                    <div className="text-lg font-semibold">{codingResults.results.finalScore || codingResults.results.overallScore || 0}%</div>
                  </div>
                  <div className="p-3 rounded bg-white/70 dark:bg-surface-800/50 border border-emerald-200 dark:border-emerald-700">
                    <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Challenges</div>
                    <div className="text-lg font-semibold">{codingResults.results.challengesCompleted}/{codingResults.results.totalChallenges}</div>
                  </div>
                  <div className="p-3 rounded bg-white/70 dark:bg-surface-800/50 border border-emerald-200 dark:border-emerald-700">
                    <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Avg Score</div>
                    <div className="text-lg font-semibold">{codingResults.results.averageScore || 0}</div>
                  </div>
                  <div className="p-3 rounded bg-white/70 dark:bg-surface-800/50 border border-emerald-200 dark:border-emerald-700">
                    <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Time (s)</div>
                    <div className="text-lg font-semibold">{Math.round((codingResults.results.totalTime || 0) / 1000)}</div>
                  </div>
                </div>
                {codingResults.results.submissions?.length ? (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Challenge Details</h3>
                    {codingResults.results.submissions.map((s, idx) => (
                      <div key={s.challengeId + idx} className="p-4 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-surface-800 dark:text-surface-200">#{idx + 1} {s.challengeId}</span>
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{s.score || 0}%</span>
                        </div>
                        {s.testResults && (
                          <div className="flex flex-wrap gap-1 text-xs">
                            {s.testResults.map(tr => (
                              <span key={tr.testIndex} className={`px-2 py-0.5 rounded-full border ${tr.passed ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700' : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'}`}>T{tr.testIndex+1}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
            {/* Performance Breakdown */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-6">
                Performance Breakdown
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(
                      analysis.technicalScore
                    )}`}
                  >
                    {analysis.technicalScore}%
                  </div>
                  <div className="text-surface-600 dark:text-surface-400 font-medium">
                    Technical Skills
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.technicalScore >= 80
                          ? "bg-green-500"
                          : analysis.technicalScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.technicalScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(
                      analysis.communicationScore
                    )}`}
                  >
                    {analysis.communicationScore}%
                  </div>
                  <div className="text-surface-600 dark:text-surface-400 font-medium">
                    Communication
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.communicationScore >= 80
                          ? "bg-green-500"
                          : analysis.communicationScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.communicationScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(
                      analysis.problemSolvingScore
                    )}`}
                  >
                    {analysis.problemSolvingScore}%
                  </div>
                  <div className="text-surface-600 dark:text-surface-400 font-medium">
                    Problem Solving
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.problemSolvingScore >= 80
                          ? "bg-green-500"
                          : analysis.problemSolvingScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.problemSolvingScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question by Question Analysis */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">
                Question Analysis
              </h3>

              <div className="space-y-6">
                {analysis.questionAnalysis.map((qa, index) => (
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
                        <div className="flex space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              qa.type === "technical"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {qa.type}
                          </span>
                          {(() => {
                            const raw = (qa.difficulty || "").toLowerCase();
                            const norm =
                              raw === "easy" || raw === "beginner"
                                ? "beginner"
                                : raw === "medium" || raw === "intermediate"
                                ? "intermediate"
                                : raw === "hard" || raw === "advanced"
                                ? "advanced"
                                : raw || "unknown";
                            const cls =
                              norm === "beginner"
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                                : norm === "intermediate"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
                                : norm === "advanced"
                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                                : "bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-800/50 dark:text-surface-300 dark:border-surface-700";
                            const label =
                              typeof norm === "string"
                                ? norm.charAt(0).toUpperCase() + norm.slice(1)
                                : norm;
                            return (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${cls}`}
                                title="Question difficulty"
                              >
                                🎯 {label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            typeof qa.score === "object"
                              ? qa.score.overall
                              : qa.score
                          )}`}
                        >
                          {typeof qa.score === "object"
                            ? qa.score.overall
                            : qa.score}
                          %
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
                      {/* Rubric Scores Section */}
                      {qa.score &&
                        typeof qa.score === "object" &&
                        qa.score.rubricScores && (
                          <div className="bg-blue-50 dark:bg-surface-800/50 rounded-lg p-4 border border-blue-100/60 dark:border-surface-700">
                            <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                              📊 Rubric Scores (1-5 Scale):
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(qa.score.rubricScores).map(
                                ([criterion, score]) => (
                                  <div key={criterion} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium capitalize text-surface-700 dark:text-surface-300">
                                        {criterion}
                                      </span>
                                      <span className="text-sm font-bold text-blue-700">
                                        {score}/5
                                      </span>
                                    </div>
                                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          score >= 4
                                            ? "bg-green-500"
                                            : score >= 3
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{
                                          width: `${(score / 5) * 100}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Feedback Section */}
                      <div className="space-y-2">
                        <div>
                          <h5 className="font-medium text-green-800 mb-1">
                            ✅ Strengths:
                          </h5>
                          <ul className="list-disc list-inside text-sm text-surface-700 dark:text-surface-300 space-y-1">
                            {qa.feedback.strengths.map((strength, i) => (
                              <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-red-800 mb-1">
                            ❌ Areas for Improvement:
                          </h5>
                          <ul className="list-disc list-inside text-sm text-surface-700 dark:text-surface-300 space-y-1">
                            {qa.feedback.improvements.map((improvement, i) => (
                              <li key={i}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Model Answer Section */}
                      {qa.feedback && qa.feedback.modelAnswer && (
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

                    {/* Video Transcript Section */}
                    <div className="mt-4">
                      <TranscriptDisplay
                        interviewId={interviewId}
                        questionIndex={index}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Adaptive Summary */}
            {interview?.config?.adaptiveDifficulty?.enabled && (
              <div className="card p-6">
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">
                  Adaptive Summary
                </h3>
                {(() => {
                  const hist =
                    interview?.config?.adaptiveDifficulty?.difficultyHistory ||
                    [];
                  if (!hist.length) {
                    return (
                      <div className="text-sm text-surface-600 dark:text-surface-400">
                        No adaptive changes recorded.
                      </div>
                    );
                  }
                  let increases = 0;
                  let decreases = 0;
                  for (let i = 1; i < hist.length; i++) {
                    const prev = hist[i - 1].difficulty;
                    const cur = hist[i].difficulty;
                    const rank = { beginner: 0, intermediate: 1, advanced: 2 };
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
              </div>
            )}
            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">
                Interview Stats
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">
                    Duration:
                  </span>
                  <span className="font-medium">
                    {Math.floor(interview.duration / 60)}m{" "}
                    {interview.duration % 60}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">
                    Questions:
                  </span>
                  <span className="font-medium">
                    {interview.questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">
                    Completed:
                  </span>
                  <span className="font-medium">
                    {new Date(interview.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">
                    Type:
                  </span>
                  <span className="font-medium capitalize">
                    {interview.interviewType}
                  </span>
                </div>
              </div>
            </div>

            {/* Difficulty History (Adaptive) */}
            {interview?.config?.adaptiveDifficulty?.enabled && (
              <div className="card p-6">
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">
                  Difficulty History
                </h3>
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
              </div>
            )}

            {/* Key Recommendations */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">
                Key Recommendations
              </h3>

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
            </div>

            {/* Skill Development */}
            <div className="bg-white dark:bg-surface-800 rounded-lg shadow-md p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">
                Focus Areas
              </h3>

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
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-surface-800 rounded-lg shadow-md p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">
                Next Steps
              </h3>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResultsPage;
