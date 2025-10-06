import React from "react";

export function TranscriptViewer({ transcriptsMap, questions }) {
  if (!questions || !questions.length) return null;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-2">Transcripts</h3>
      <ul className="space-y-3">
        {questions.map((q, idx) => {
          const t = transcriptsMap[idx];
          const status = t?.status || "not_started";
          return (
            <li
              key={q._id || idx}
              className="p-3 rounded border bg-surface-50 dark:bg-surface-800/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Q{idx + 1}:{" "}
                  {q.questionText?.slice(0, 70) || q.text?.slice(0, 70)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full capitalize ${
                    status === "completed"
                      ? "bg-green-600 text-white"
                      : status === "failed"
                      ? "bg-red-600 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {status.replace("_", " ")}
                </span>
              </div>
              {status === "completed" && t.length > 0 && (
                <details className="mt-1 text-xs opacity-80">
                  <summary className="cursor-pointer">
                    View transcript preview
                  </summary>
                  <TranscriptPreview
                    interviewId={q.interviewId}
                    questionIndex={idx}
                  />
                </details>
              )}
              {status === "failed" && t?.error && (
                <p className="text-xs text-red-500 mt-1">{t.error}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Lazy fetch full transcript when expanded
function TranscriptPreview({ interviewId, questionIndex }) {
  const [full, setFull] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(
          `/api/interviews/${interviewId}/transcripts?full=1`
        );
        const json = await r.json();
        if (!cancelled && json?.data?.transcripts) {
          const item = json.data.transcripts.find(
            (t) => t.questionIndex === questionIndex
          );
          if (item) setFull(item.text || null);
        }
      } catch (_) {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interviewId, questionIndex]);
  if (loading && !full)
    return <div className="mt-2 text-xs italic">Loading...</div>;
  if (!full)
    return (
      <div className="mt-2 text-xs italic">No transcript text available.</div>
    );
  return (
    <div className="mt-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
      {full}
    </div>
  );
}

export default TranscriptViewer;
