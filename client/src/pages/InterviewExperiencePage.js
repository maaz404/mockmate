import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const InterviewExperiencePage = () => {
  // Route param is /interview/:id/experience
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const { t, language, labels } = useLanguage();

  // Interview state
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [, setAnswers] = useState({}); // we only use the setter
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterview = useCallback(async () => {
    if (!interviewId) {
      setError(t("loading_interview"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const resp = await apiService.get(`/interviews/${interviewId}`);
      if (!resp?.data) throw new Error("Invalid response format");
      const interviewData = resp.data;

      // Start if scheduled
      if (interviewData.status === "scheduled") {
        try {
          await apiService.put(`/interviews/${interviewId}/start`);
          interviewData.status = "in-progress";
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(
            "[InterviewExperience] start failed (continuing):",
            e?.response?.data || e.message
          );
        }
      }

      setInterview(interviewData);

      // Seed answers map
      const init = {};
      (interviewData.questions || []).forEach((q) => {
        const key = q._id || q.questionId;
        init[key] = "";
      });
      setAnswers(init);

      const durationMin =
        interviewData?.config?.duration ?? interviewData?.duration ?? 30;
      setTimeRemaining(durationMin * 60);
      setError(null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        "[InterviewExperience] fetch error:",
        e?.response?.data || e
      );
      setError(
        e?.response?.data?.message || e.message || t("loading_interview")
      );
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-surface-600">{t("loading_interview")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="text-red-600">{error}</div>
        <button className="btn-primary" onClick={() => navigate("/dashboard")}>
          ← {t("dashboard_back")}
        </button>
      </div>
    );
  }

  if (!interview) return null;

  const question = interview.questions?.[currentQuestionIndex];

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-semibold">{t("interview_title")}</h1>
        <span className="text-xs bg-surface-200 dark:bg-surface-700 px-2 py-1 rounded-full">
          🌐 {labels[language]}
        </span>
      </div>
      <div className="text-sm text-surface-500 mb-2">
        {t("status_label")}: {interview.status} • {t("time_remaining_label")}:{" "}
        {Math.max(0, Math.floor((timeRemaining ?? 0) / 60))}m
      </div>

      {question ? (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="text-xs text-surface-500 mb-1">
              Q{currentQuestionIndex + 1} • {question.difficulty}
            </div>
            <div className="text-lg">{question.questionText}</div>
          </div>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={6}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={t("type_answer_placeholder")}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={() => {
                const key = question._id || question.questionId;
                setAnswers((prev) => ({ ...prev, [key]: currentAnswer }));
                setCurrentAnswer("");
                setCurrentQuestionIndex((i) =>
                  Math.min(i + 1, (interview.questions?.length ?? 1) - 1)
                );
              }}
            >
              {t("save_next")}
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/dashboard")}
            >
              {t("end_session")}
            </button>
          </div>
        </div>
      ) : (
        <div>{t("no_questions_found")}</div>
      )}
    </div>
  );
};

export default InterviewExperiencePage;
