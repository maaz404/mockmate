import { useEffect, useState, useRef, useCallback } from "react";
import { apiService } from "../services/api";

/**
 * Poll transcript statuses for an interview's questions until all completed or failed.
 * Returns a map keyed by questionIndex -> { status, text?(optional), length }
 */
export function useTranscriptPoll(
  interviewId,
  { intervalMs = 5000, autoStart = true } = {}
) {
  const [statuses, setStatuses] = useState({});
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchOnce = useCallback(async () => {
    if (!interviewId) return;
    try {
      setLoading(true);
      const resp = await apiService.get(
        `/interviews/${interviewId}/transcripts`
      );
      const arr = resp.data?.transcripts || resp.transcripts || [];
      const map = {};
      arr.forEach((t) => {
        map[t.questionIndex] = t;
      });
      setStatuses(map);
      const allDone =
        arr.length > 0 &&
        arr.every((t) =>
          ["completed", "failed", "not_started"].includes(t.status)
        );
      if (allDone) {
        setCompleted(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (_) {
      // swallow errors to avoid noisy UI
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    if (!autoStart || !interviewId) return undefined;
    fetchOnce();
    timerRef.current = setInterval(fetchOnce, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchOnce, autoStart, interviewId, intervalMs]);

  const forceRefresh = useCallback(() => {
    fetchOnce();
  }, [fetchOnce]);

  return {
    transcriptStatuses: statuses,
    completed,
    loading,
    refresh: forceRefresh,
  };
}
