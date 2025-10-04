import React from "react";
import { formatDistanceToNow } from "date-fns";

const ActivityIndicator = ({ lastPracticeAt }) => {
  return (
    <div className="surface-elevated dark:bg-surface-800/50 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-300">
        <span className="text-xl">⚡</span>
      </div>
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wide text-surface-400">
          Activity
        </p>
        {lastPracticeAt ? (
          <p className="text-sm text-surface-300">
            Last practice{" "}
            {formatDistanceToNow(new Date(lastPracticeAt), { addSuffix: true })}
          </p>
        ) : (
          <p className="text-sm text-surface-400">
            No practice yet — start your first session!
          </p>
        )}
      </div>
      {lastPracticeAt && (
        <div className="text-right">
          <span className="inline-block text-[10px] px-2 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
            Active
          </span>
        </div>
      )}
    </div>
  );
};

export default ActivityIndicator;
