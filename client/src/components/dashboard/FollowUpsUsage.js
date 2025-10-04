import React from "react";

const FollowUpsUsage = ({ followUps }) => {
  const total = followUps?.total || 0;
  const reviewed = followUps?.reviewed || 0;
  const pct = total === 0 ? 0 : Math.round((reviewed / total) * 100);
  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl border border-surface-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-surface-400">Feedback Utilization</p>
          <h3 className="text-lg font-semibold text-white">Follow-ups Reviewed</h3>
        </div>
        <div className="text-xs text-surface-400">{reviewed}/{total}</div>
      </div>
      <div className="relative h-3 rounded-full bg-surface-700 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-surface-200 font-medium">
          {pct}%
        </div>
      </div>
      <p className="mt-3 text-xs text-surface-400">
        {total === 0
          ? "Follow-up review stats appear after your first completed interview."
          : pct < 50
          ? "Review more follow-ups to reinforce learning."
          : pct < 80
          ? "Good habit forming. Keep pushing for deeper review."
          : "Excellent follow-through—you're closing knowledge gaps."}
      </p>
    </div>
  );
};

export default FollowUpsUsage;
