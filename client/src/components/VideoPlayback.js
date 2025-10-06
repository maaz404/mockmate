import React, { useEffect, useState } from "react";
import videoService from "../services/videoService";

const VideoPlayback = ({ interviewId, questionIndex, className = "" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playback, setPlayback] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!interviewId || questionIndex == null) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await videoService.getVideoPlayback(
          interviewId,
          questionIndex
        );
        if (!cancelled) {
          if (resp?.success) setPlayback(resp);
          else setError(resp?.message || "Failed to load playback");
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load playback");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [interviewId, questionIndex]);

  if (loading)
    return (
      <div className={`p-4 text-sm text-surface-500 ${className}`}>
        Loading video…
      </div>
    );
  if (error)
    return (
      <div className={`p-4 text-sm text-red-600 ${className}`}>{error}</div>
    );
  if (!playback) return null;

  const url = playback.resolvedUrl;
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2 text-xs text-surface-500 dark:text-surface-400">
        <span>Playback</span>
        {playback.cdn && (
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            CDN
          </span>
        )}
      </div>
      <video
        controls
        className="w-full rounded border border-surface-200 dark:border-surface-700 bg-black"
        src={url}
      />
    </div>
  );
};

export default VideoPlayback;
