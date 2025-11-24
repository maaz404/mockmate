import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiService } from "../services/api";
import SpokenQuestionUI from "../components/interview/SpokenQuestionUI";
import CodingQuestionUI from "../components/interview/CodingQuestionUI";
import { useLanguage } from "../context/LanguageContext";

// Professional code templates with better structure
const CODE_TEMPLATES = {
  javascript: `/**
 * @param {any} input - Your input parameter
 * @return {any} - Your return value
 */
function solution(input) {
    // Write your code here
    
    return null;
}

// Test your solution
console.log(solution());
`,
  typescript: `/**
 * @param {any} input - Your input parameter
 * @return {any} - Your return value
 */
function solution(input: any): any {
    // Write your code here
    
    return null;
}

// Test your solution
console.log(solution());
`,
  python: `"""
Solution function
Args:
    input: Your input parameter
Returns:
    Your return value
"""
def solution(input):
    # Write your code here
    
    return None

# Test your solution
if __name__ == "__main__":
    result = solution()
    print(result)
`,
  java: `public class Solution {
    /**
     * Your solution method
     * @param input Your input parameter
     * @return Your return value
     */
    public static Object solution(Object input) {
        // Write your code here
        
        return null;
    }
    
    public static void main(String[] args) {
        Object result = solution(null);
        System.out.println(result);
    }
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

/**
 * Your solution function
 */
void solution() {
    // Write your code here
    
}

int main() {
    solution();
    return 0;
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>

/**
 * Your solution function
 */
void solution() {
    // Write your code here
    
}

int main() {
    solution();
    return 0;
}
`,
  csharp: `using System;
using System.Collections.Generic;

class Solution {
    /**
     * Your solution method
     */
    public static object SolutionMethod(object input) {
        // Write your code here
        
        return null;
    }
    
    static void Main(string[] args) {
        var result = SolutionMethod(null);
        Console.WriteLine(result);
    }
}
`,
};

// Build a starter template augmented with category/difficulty header
function getCommentPrefix(language) {
  if (language === "python") return "#";
  // default to // for C-style languages and JS/TS
  return "//";
}

function getStarterTemplate(language, question) {
  const base = CODE_TEMPLATES[language] || CODE_TEMPLATES.javascript;
  const title = question?.title || "Coding Challenge";
  const difficulty = (question?.difficulty || "intermediate").toString();
  const category = (question?.category || "coding").toString();
  const prefix = getCommentPrefix(language);

  // Build professional header with problem details
  const header = `${prefix}${"=".repeat(
    60
  )}\n${prefix} ${title}\n${prefix} Difficulty: ${difficulty.toUpperCase()} | Category: ${category}\n${prefix}${"=".repeat(
    60
  )}\n\n`;

  // Add problem description excerpt if available
  let problemDesc = "";
  if (question?.questionText) {
    const firstLine = question.questionText.split("\\n")[0];
    if (firstLine && firstLine.length < 100) {
      problemDesc = `${prefix} Problem: ${firstLine}\n${prefix}\n`;
    }
  }

  // Add examples as comments
  let examplesSection = "";
  if (Array.isArray(question?.examples) && question.examples.length > 0) {
    examplesSection = `${prefix} Examples:\n`;
    question.examples.slice(0, 2).forEach((ex, i) => {
      examplesSection += `${prefix}   ${i + 1}. Input: ${ex.input || "N/A"}\n`;
      if (ex.output) {
        examplesSection += `${prefix}      Output: ${ex.output}\n`;
      }
    });
    examplesSection += `${prefix}\n`;
  }

  // Add complexity requirements
  const complexityNote = `${prefix} Time Complexity: O(?)\n${prefix} Space Complexity: O(?)\n${prefix}${"=".repeat(
    60
  )}\n\n`;

  return header + problemDesc + examplesSection + complexityNote + base;
}

const InterviewPage = () => {
  // Route is defined as /interview/:id, normalize param name
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [validationError, setValidationError] = useState(null); // Holds backend validation errors for current question
  const { language, setLanguage, labels, t } = useLanguage();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [codeSnippets, setCodeSnippets] = useState({});
  const [codeLanguages, setCodeLanguages] = useState({}); // per-question language memory
  const [isRunning, setIsRunning] = useState(false);
  const [runState, setRunState] = useState({}); // { [index]: { output, error, results, hasRun, lastRunAt, durationMs } }
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
  const [questionType, setQuestionType] = useState("spoken"); // 'spoken' or 'coding'

  // Session-level enrichment data
  const [sessionTranscript, setSessionTranscript] = useState("");
  const [sessionFacialMetrics, setSessionFacialMetrics] = useState([]);
  const [sessionEmotionTimeline, setSessionEmotionTimeline] = useState([]);

  // Submit current answer helper
  const submitCurrentAnswer = useCallback(async () => {
    if (!interview || !interview.questions || !interview.questions.length)
      return 0;
    const baseText = responses[currentQuestionIndex] || "";
    const codeText = codeSnippets[currentQuestionIndex] || "";
    const currentCodeLanguage =
      codeLanguages[currentQuestionIndex] || "javascript";
    const answerText =
      codeText &&
      (interview?.config?.coding ||
        interview?.questions?.[currentQuestionIndex]?.category === "coding")
        ? `${baseText}\n\n\u0060\u0060\u0060${currentCodeLanguage}\n${codeText}\n\u0060\u0060\u0060`
        : baseText;
    try {
      setSubmittingAnswer(true);
      setValidationError(null);
      const timeSpentSec = Math.max(
        0,
        Math.round((Date.now() - questionStartTime) / 1000)
      );
      const res = await apiService.post(
        `/interviews/${interviewId}/answer/${currentQuestionIndex}`,
        {
          answer: answerText,
          notes: answerText,
          timeSpent: timeSpentSec,
          language,
        }
      );
      toast.success("Answer submitted");
      // Request follow-ups if available from response or fetch explicitly
      const generated = res?.data?.followUpQuestions;
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
          const arr = fu?.data?.followUpQuestions || [];
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
      // Non-blocking: log and allow progression even on validation errors
      // eslint-disable-next-line no-console
      console.warn(
        "Failed to submit answer for question",
        currentQuestionIndex,
        e
      );
      const code = e?.response?.data?.code;
      if (code === "EMPTY_ANSWER" || code === "ANSWER_TOO_SHORT") {
        const errorMsg = e?.response?.data?.message || "Validation error";
        setValidationError(errorMsg);
        // Show warning toast but don't block
        toast.warning(`${errorMsg} - Continuing anyway`, {
          duration: 3000,
        });
        return 0; // treat as no follow-ups, but don't throw
      }
      // For other errors, show toast but continue
      toast.error(e?.response?.data?.message || "Failed to submit answer", {
        duration: 3000,
      });
      return 0;
    } finally {
      setSubmittingAnswer(false);
    }
  }, [
    interview,
    interviewId,
    currentQuestionIndex,
    questionStartTime,
    responses,
    codeSnippets,
    codeLanguages,
  ]);

  // End interview: submit current answer, complete on server, then navigate
  const handleEndInterview = useCallback(async () => {
    try {
      await submitCurrentAnswer();

      // Persist enrichment data (transcript + facial metrics + emotion timeline) if available
      const enrichmentPayload = {};
      if (sessionTranscript && sessionTranscript.trim()) {
        enrichmentPayload.transcript = sessionTranscript;
      }
      if (sessionFacialMetrics && sessionFacialMetrics.length > 0) {
        enrichmentPayload.facialMetrics = sessionFacialMetrics;
      }
      if (sessionEmotionTimeline && sessionEmotionTimeline.length > 0) {
        enrichmentPayload.emotionTimeline = sessionEmotionTimeline;
      }

      await apiService.post(
        `/interviews/${interviewId}/complete`,
        enrichmentPayload
      );
      toast.success("Interview completed!");
      navigate(`/interview/${interviewId}/results`);
    } catch (e) {
      toast.error("Failed to complete interview. Please try again.");
    }
  }, [
    navigate,
    interviewId,
    submitCurrentAnswer,
    sessionTranscript,
    sessionFacialMetrics,
    sessionEmotionTimeline,
  ]);

  // Fetch interview data on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/interviews/${interviewId}`);

        if (response.success) {
          const interviewData = response.data;
          // Normalize question objects to always have a stable string `text` field
          if (Array.isArray(interviewData.questions)) {
            interviewData.questions = interviewData.questions.map((q) => {
              if (typeof q === "string") {
                return { text: q };
              }
              if (q && typeof q === "object") {
                const baseText = q.text || q.questionText || "";
                // If the object contains a separate reason and no plain text, merge for readability
                const merged =
                  !q.text && q.questionText && q.reason
                    ? `${q.questionText} — ${q.reason}`
                    : baseText;
                return { ...q, text: merged };
              }
              return { text: "" };
            });
          }
          setInterview(interviewData);

          // Set the UI language to match the interview's language
          if (interviewData.config?.language) {
            setLanguage(interviewData.config.language);
          }

          // Initialize timer from server's remaining time if available
          // Otherwise fall back to config duration
          if (interviewData.timing?.remainingSeconds != null) {
            setTimeRemaining(interviewData.timing.remainingSeconds);
          } else {
            const minutes =
              interviewData?.duration || interviewData?.config?.duration || 30;
            setTimeRemaining(minutes * 60);
          }

          // Check if interview is already completed
          if (interviewData.status === "completed") {
            toast(
              "This interview has been completed. Redirecting to results...",
              {
                icon: "ℹ️",
              }
            );
            setTimeout(() => {
              navigate(`/interview/${interviewId}/results`);
            }, 2000);
            return;
          }

          // Start interview if scheduled
          const status = interviewData?.status || interviewData?.config?.status;
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
  }, [interviewId, navigate, setLanguage]);

  // Update questionType when currentQuestionIndex changes
  useEffect(() => {
    if (interview?.questions?.[currentQuestionIndex]) {
      const question = interview.questions[currentQuestionIndex];
      const type = question.type || question.category || "spoken";
      setQuestionType(type.toLowerCase() === "coding" ? "coding" : "spoken");
    }
  }, [currentQuestionIndex, interview]);

  // Timer effect - only auto-complete if user is actively on the page
  useEffect(() => {
    // Don't run timer if interview is completed or not loaded
    if (!interview || interview.status === "completed") {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Only auto-complete if user is still on the page and actively working
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleEndInterview, interview]);

  // Periodic sync with server to get updated remaining time (every 30 seconds)
  useEffect(() => {
    if (!interview || interview.status === "completed") {
      return;
    }

    const syncTimer = setInterval(async () => {
      try {
        const response = await apiService.get(`/interviews/${interviewId}`);
        if (
          response.success &&
          response.data.timing?.remainingSeconds != null
        ) {
          setTimeRemaining(response.data.timing.remainingSeconds);

          // If server says interview is completed, end locally
          if (response.data.status === "completed") {
            toast("Interview time has expired", { icon: "⏱️" });
            navigate(`/interview/${interviewId}/results`);
          }
        }
      } catch (e) {
        // Non-blocking, continue with local timer
        // eslint-disable-next-line no-console
        console.warn("Failed to sync time with server:", e);
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncTimer);
  }, [interview, interviewId, navigate]);

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

  // Handle follow-up acknowledgment
  const handleFollowUpAck = async (questionIndex) => {
    setFollowUpsAck((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
    try {
      await apiService.post(
        `/interviews/${interviewId}/followups-reviewed/${questionIndex}`
      );
    } catch (_) {
      // ignore
    }
    toast.success("Marked reviewed. You can proceed.");
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

    // Show toast if follow-ups exist but aren't acknowledged, but don't block progression
    if (hasFollowUps && !acked) {
      toast("Note: Follow-up questions are available for review", {
        icon: "ℹ️",
        duration: 2000,
      });
    }

    // Check if we can move to next question
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex((idx) => idx + 1);
      setQuestionStartTime(Date.now());
    } else {
      // Reached the end - complete the interview
      handleEndInterview();
    }
  };

  // Skip current question without submitting an answer
  const handleSkip = async () => {
    if (!interview) return;
    try {
      setSkipping(true);
      setValidationError(null);
      const timeSpentSec = Math.max(
        0,
        Math.round((Date.now() - questionStartTime) / 1000)
      );
      await apiService.post(
        `/interviews/${interviewId}/answer/${currentQuestionIndex}`,
        { skip: true, timeSpent: timeSpentSec }
      );
      await apiService.post(
        `/interviews/${interviewId}/answer/${currentQuestionIndex}`,
        { skip: true, timeSpent: timeSpentSec, language }
      );
      toast("Question skipped", { icon: "⏭️" });
      setCurrentQuestionIndex((idx) =>
        Math.min(idx + 1, (interview.questions?.length || 1) - 1)
      );
      setQuestionStartTime(Date.now());
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to skip question"
      );
    } finally {
      setSkipping(false);
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

  // Run code for current coding question using backend
  const handleRunCode = useCallback(
    async (customCase) => {
      try {
        const code = codeSnippets[currentQuestionIndex] || "";
        const currentCodeLanguage =
          codeLanguages[currentQuestionIndex] || "javascript";
        setRunState((prev) => ({
          ...prev,
          [currentQuestionIndex]: {
            output: "",
            error: "",
            results: null,
            hasRun: false,
          },
        }));
        if (!code) {
          toast("Nothing to run. Add some code first.", { icon: "ℹ️" });
          return;
        }
        setIsRunning(true);
        const started = Date.now();
        // Derive test cases from examples when available
        const examples = interview?.questions?.[currentQuestionIndex]?.examples;
        let testCases = Array.isArray(examples)
          ? examples
              .map((ex) => ({
                input:
                  typeof ex?.input === "string"
                    ? ex.input
                    : typeof ex?.input !== "undefined"
                    ? String(ex.input)
                    : "",
                expectedOutput:
                  typeof ex?.output === "string"
                    ? ex.output
                    : typeof ex?.output !== "undefined"
                    ? String(ex.output)
                    : undefined,
              }))
              .filter((t) => typeof t.input === "string")
          : [];
        if (
          customCase &&
          (customCase.input || typeof customCase.expectedOutput !== "undefined")
        ) {
          testCases = [...testCases, customCase];
        }
        const res = await apiService.post("/coding/run", {
          code,
          language: currentCodeLanguage,
          ...(testCases.length ? { testCases } : {}),
        });
        const results = res?.data?.results;
        if (Array.isArray(results) && results.length) {
          const firstErr = results.find((r) => r.compile_output || r.stderr);
          setRunState((prev) => ({
            ...prev,
            [currentQuestionIndex]: {
              output: firstErr
                ? ""
                : results.map((r) => r.output || r.stdout || "").join("\n"),
              error: firstErr?.compile_output || firstErr?.stderr || "",
              results,
              hasRun: true,
              lastRunAt: new Date().toISOString(),
              durationMs: Date.now() - started,
            },
          }));
        } else {
          // Fallback: old single response shape
          const first = res?.data?.result || res?.data || {};
          setRunState((prev) => ({
            ...prev,
            [currentQuestionIndex]: {
              output:
                first.compile_output || first.stderr
                  ? ""
                  : first.output || first.stdout || "No output",
              error: first.compile_output || first.stderr || "",
              results: null,
              hasRun: true,
              lastRunAt: new Date().toISOString(),
              durationMs: Date.now() - started,
            },
          }));
        }
      } catch (e) {
        const msg = e?.message || "Failed to run code";
        setRunState((prev) => ({
          ...prev,
          [currentQuestionIndex]: {
            output: "",
            error: msg,
            results: null,
            hasRun: false,
          },
        }));
      } finally {
        setIsRunning(false);
      }
    },
    [codeLanguages, codeSnippets, currentQuestionIndex, interview?.questions]
  );

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
            {t("loading_interview")}
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
            {t("return_dashboard")}
          </button>
        </div>
      </div>
    );
  }

  // Now it's safe to access interview data
  const currentQuestion = interview.questions[currentQuestionIndex] || {};
  const targetCount =
    interview?.config?.questionCount || interview.questions.length;
  // Simplified: since we now pre-generate all questions even in adaptive mode,
  // isLastQuestion is simply when we've reached the last question in the array
  const isLastQuestion = currentQuestionIndex >= interview.questions.length - 1;
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
              {/* Language indicator */}
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700"
                title="Interview Language"
              >
                🌐 {labels[language] || language.toUpperCase()}
              </span>
              {/* Difficulty chip */}
              {(() => {
                const level =
                  currentQuestion?.difficulty ||
                  interview?.config?.adaptiveDifficulty?.currentDifficulty ||
                  interview?.config?.difficulty ||
                  "-";
                const colorClasses =
                  level === "beginner"
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                    : level === "intermediate"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
                    : level === "advanced"
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                    : "bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-800/50 dark:text-surface-300 dark:border-surface-700";
                const label =
                  typeof level === "string"
                    ? level.charAt(0).toUpperCase() + level.slice(1)
                    : level;
                return (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClasses}`}
                    title="Current difficulty"
                  >
                    🎯 {label}
                  </span>
                );
              })()}
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
              {/* Video upload status chip removed per request */}
              {/* Run indicator chip (coding) */}
              {questionType === "coding" &&
                runState[currentQuestionIndex]?.hasRun && (
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                    title={`Code executed • ${
                      runState[currentQuestionIndex]?.durationMs || 0
                    }ms`}
                  >
                    {(() => {
                      const rs = runState[currentQuestionIndex];
                      const t = rs?.lastRunAt
                        ? new Date(rs.lastRunAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "";
                      return `✅ Run${t ? ` ${t}` : ""}`;
                    })()}
                  </span>
                )}
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

        {/* Interview Interface - Adaptive Layout */}
        {questionType === "spoken" ? (
          <SpokenQuestionUI
            interview={interview}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            responses={responses}
            onResponseChange={handleResponseChange}
            validationError={validationError}
            settings={settings}
            permission={permission}
            isRecording={isRecording}
            followUps={followUps}
            followUpsAck={followUpsAck}
            ttsFlash={ttsFlash}
            isSpeaking={isSpeaking}
            onVideoUploaded={handleVideoUploaded}
            onRecordingChange={setIsRecording}
            onPermissionChange={setPermission}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onNext={handleNext}
            onEndInterview={handleEndInterview}
            onToggleSetting={toggleSetting}
            onFollowUpAck={handleFollowUpAck}
            onSpeakQuestion={speakQuestion}
            onStopSpeech={stopSpeech}
            submittingAnswer={submittingAnswer}
            skipping={skipping}
            targetCount={targetCount}
            interviewId={interviewId}
            isLastQuestion={isLastQuestion}
            onTranscriptUpdate={(text) =>
              setSessionTranscript((prev) => (prev ? `${prev}\n${text}` : text))
            }
            onFacialMetricsUpdate={(metrics) =>
              setSessionFacialMetrics((prev) => [
                ...prev,
                { timestamp: Date.now(), ...metrics },
              ])
            }
            onEmotionUpdate={(emotionSummary) =>
              setSessionEmotionTimeline((prev) => [
                ...prev,
                ...emotionSummary.timeline,
              ])
            }
          />
        ) : (
          <CodingQuestionUI
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            code={
              codeSnippets[currentQuestionIndex] ??
              getStarterTemplate(
                codeLanguages[currentQuestionIndex] || "javascript",
                currentQuestion
              )
            }
            onChangeCode={(val) =>
              setCodeSnippets((prev) => ({
                ...prev,
                [currentQuestionIndex]: val,
              }))
            }
            language={codeLanguages[currentQuestionIndex] || "javascript"}
            onChangeLanguage={(lang) =>
              setCodeLanguages((prev) => ({
                ...prev,
                [currentQuestionIndex]: lang,
              }))
            }
            isRunning={isRunning}
            runOutput={runState[currentQuestionIndex]?.output || ""}
            runError={runState[currentQuestionIndex]?.error || ""}
            runResults={runState[currentQuestionIndex]?.results || null}
            runMeta={runState[currentQuestionIndex] || null}
            disableSubmit={!runState[currentQuestionIndex]?.hasRun}
            onRunCode={handleRunCode}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onNext={handleNext}
            submittingAnswer={submittingAnswer}
            skipping={skipping}
            settings={settings}
            onSpeakQuestion={speakQuestion}
            onStopSpeech={stopSpeech}
            isSpeaking={isSpeaking}
          />
        )}

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
