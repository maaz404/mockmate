import React, { useMemo } from "react";
import { Link } from "react-router-dom";

function minutesUntil(dateStr) {
  const now = Date.now();
  const t = new Date(dateStr).getTime();
  const diffMin = Math.max(0, Math.round((t - now) / 60000));
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function UpcomingCard({ next }) {
  const countdown = useMemo(
    () => (next?.scheduledAt ? minutesUntil(next.scheduledAt) : null),
    [next]
  );
  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700">
      <div className="p-6 border-b border-surface-700">
        <h3 className="text-lg font-medium text-white">Next Up</h3>
        <p className="text-sm text-surface-400 mt-1">Stay consistent</p>
      </div>
      <div className="p-6">
        {next ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Scheduled practice</p>
              <p className="text-base text-white font-medium">{next.title}</p>
              <p className="text-sm text-surface-400">{next.when}</p>
              {countdown && (
                <span className="inline-flex mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/20">
                  Starts in {countdown}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link to="/interviews" className="btn-outline">
                Open
              </Link>
              <Link
                to="/interview/new"
                className="btn-primary hidden sm:inline-flex"
              >
                Start now
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-surface-300 text-sm flex items-center justify-between gap-3">
            <div>No session scheduled. Create one or use Quick Start.</div>
            <Link to="/interview/new" className="btn-primary">
              Schedule
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
