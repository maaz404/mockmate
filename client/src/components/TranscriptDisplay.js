import React, { useState, useEffect, useRef } from "react";
import videoService from "../services/videoService";

/**
 * TranscriptDisplay
 * Fetches and displays transcript for one interview question.
 * Polls while status === 'pending'. Renders segments if available.
 */
const TranscriptDisplay = ({
  interviewId,
  questionIndex,
  className = "",
  currentTime = null, // optional: current playback time in seconds for segment highlighting
}) => {
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingRef = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!interviewId || questionIndex === undefined || questionIndex === null)
        return;
      try {
        setLoading(true);
        setError(null);
        const resp = await videoService.getTranscription(
          interviewId,
          questionIndex
        );
        if (cancelled) return;
        if (resp?.success) {
          const t = resp.data.transcription;
          setTranscription(t);
          if (t?.status === "pending" && !pollingRef.current) {
            pollingRef.current = true;
            setTimedOut(false);
            timeoutRef.current = setTimeout(() => {
              if (!cancelled) setTimedOut(true);
            }, 60000); // 60s timeout
            videoService
              .pollTranscription(interviewId, questionIndex, {
                onUpdate: (latest) => {
                  if (!cancelled) setTranscription({ ...latest });
                },
                timeoutMs: 60000,
              })
              .finally(() => {
                pollingRef.current = false;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
              });
          } else {
            setTimedOut(false);
          }
        } else {
          setError(resp?.message || "Failed to load transcript");
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load transcript");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [interviewId, questionIndex]);

  // Highlight scroll-to-active segment when currentTime changes
  useEffect(() => {
    if (!currentTime || !transcription?.segments) return;
    const activeIdx = transcription.segments.findIndex(
      (seg) => currentTime >= seg.start && currentTime < seg.end
    );
    if (activeIdx !== -1 && containerRef.current) {
      const el = containerRef.current.querySelector(
        `[data-seg-index="${activeIdx}"]`
      );
      if (el) {
        const parent = containerRef.current;
        const top = el.offsetTop;
        if (
          top < parent.scrollTop ||
          top > parent.scrollTop + parent.clientHeight - el.clientHeight
        ) {
          parent.scrollTo({
            top: top - parent.clientHeight / 2,
            behavior: "smooth",
          });
        }
      }
    }
  }, [currentTime, transcription]);

  const manualRefresh = async () => {
    if (!interviewId || questionIndex === undefined) return;
    try {
      setLoading(true);
      const resp = await videoService.getTranscription(
        interviewId,
        questionIndex
      );
      if (resp?.success) {
        setTranscription(resp.data.transcription);
        setError(null);
      } else {
        setError(resp?.message || "Failed to refresh");
      }
    } catch (e) {
      setError("Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  const retry = async () => {
    try {
      setError(null);
      const resp = await videoService.retryTranscription(
        interviewId,
        questionIndex
      );
      if (resp?.success) {
        // trigger a fresh load which will start polling
        setTranscription({ status: "pending" });
        manualRefresh();
      } else {
        setError(resp?.message || "Retry failed");
      }
    } catch (e) {
      setError("Retry failed");
    }
  };

  const copyTranscript = () => {
    if (!transcription?.text) return;
    try {
      navigator.clipboard.writeText(transcription.text);
    } catch (e) {
      // swallow; could add toast
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Processing…";
      case "failed":
        return "Failed";
      case "not_started":
        return "Not started";
      default:
        return "—";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "pending":
        return (
          <svg
            className="w-4 h-4 text-primary-500 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case "failed":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m-7.072 0a5 5 0 010-7.072M9 12h6m-3-3v6"
            />
          </svg>
        );
    }
  };

  const renderCompleted = () => {
    if (!transcription?.text) return null;
    const hasSegments =
      Array.isArray(transcription.segments) &&
      transcription.segments.length > 0;
    return (
      <div className="space-y-4">
        {hasSegments ? (
          <div
            ref={containerRef}
            className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar"
          >
            {transcription.segments.map((seg, idx) => {
              const active =
                currentTime != null &&
                currentTime >= seg.start &&
                currentTime < seg.end;
              return (
                <div
                  key={seg.id || seg.start}
                  data-seg-index={idx}
                  className={`text-sm rounded px-1 py-0.5 transition-colors ${
                    active
                      ? "bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-600"
                      : "text-surface-800 dark:text-surface-200"
                  }`}
                >
                  <span className="text-[10px] font-mono text-surface-500 mr-2">
                    [{Math.floor(seg.start)}s-{Math.floor(seg.end)}s]
                  </span>
                  <span className="whitespace-pre-wrap leading-relaxed">
                    {seg.text}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-surface-800 dark:text-surface-100 leading-relaxed whitespace-pre-wrap">
            {transcription.text}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center space-x-2">
            {transcription.generatedAt && (
              <div className="text-[10px] text-surface-500">
                {new Date(transcription.generatedAt).toLocaleString()}
              </div>
            )}
            {transcription.language && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                {transcription.language.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyTranscript}
              className="text-[10px] px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            {getStatusIcon("pending")}
            <span className="text-primary-600 dark:text-primary-400 text-sm">
              Loading transcription…
            </span>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-6">
          <div className="inline-flex items-center space-x-2">
            {getStatusIcon("failed")}
            <span className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </span>
          </div>
        </div>
      );
    }
    switch (transcription?.status) {
      case "completed":
        return renderCompleted();
      case "pending":
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2">
              {getStatusIcon("pending")}
              <span className="text-primary-600 dark:text-primary-400">
                Processing transcription…
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-2">
              This may take a few moments depending on video length.
            </p>
          </div>
        );
      case "failed":
        return (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center space-x-2">
              {getStatusIcon("failed")}
              <span className="text-red-600 dark:text-red-400 text-sm">
                Transcription failed
              </span>
            </div>
            {transcription?.error && (
              <p className="text-xs text-surface-500 max-w-sm mx-auto">
                {transcription.error}
              </p>
            )}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={retry}
                className="px-3 py-1 text-xs rounded bg-primary-600 hover:bg-primary-500 text-white"
              >
                Retry
              </button>
              <button
                onClick={manualRefresh}
                className="px-3 py-1 text-xs rounded border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Refresh
              </button>
            </div>
          </div>
        );
      case "not_started":
      default:
        return (
          <div className="text-center py-6">
            {getStatusIcon("not_started")}
            <p className="text-sm text-surface-500">
              No transcript available for this question yet.
            </p>
            <div className="mt-3">
              <button
                onClick={manualRefresh}
                className="px-3 py-1 text-xs rounded border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Check Again
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg ${className}`}
    >
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 rounded-t-lg flex items-center justify-between">
        <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100 flex items-center space-x-2">
          <svg
            className="w-4 h-4 text-surface-600 dark:text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m-7.072 0a5 5 0 010-7.072M9 12h6m-3-3v6"
            />
          </svg>
          <span>Video Transcript</span>
        </h4>
        <div className="flex items-center space-x-2">
          {getStatusIcon(transcription?.status)}
          <span className="text-xs text-surface-500 dark:text-surface-400">
            {getStatusText(transcription?.status)}
          </span>
          {timedOut && transcription?.status === "pending" && (
            <button
              onClick={manualRefresh}
              className="text-xs px-2 py-0.5 rounded border border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            >
              Refresh
            </button>
          )}
        </div>
      </div>
      <div className="p-4 text-sm min-h-[140px]">{renderBody()}</div>
    </div>
  );
};

export default TranscriptDisplay;
