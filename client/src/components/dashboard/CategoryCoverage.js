import React from "react";

const CategoryCoverage = ({ coverage }) => {
  if (!coverage || coverage.length === 0) {
    return (
      <div className="surface-elevated dark:bg-surface-800/50 p-6">
        <p className="text-sm text-surface-400">
          No category data yet. Complete some interviews to see coverage.
        </p>
      </div>
    );
  }
  return (
    <div className="surface-elevated dark:bg-surface-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-surface-400">
            Coverage
          </p>
          <h3 className="text-lg font-semibold text-white">
            Category Coverage
          </h3>
        </div>
      </div>
      <div className="space-y-3">
        {coverage.map((c) => {
          const score = c.avgScore == null ? "—" : `${c.avgScore}%`;
          return (
            <div key={c.category} className="group">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-300 group-hover:text-white transition-colors truncate max-w-[55%]">
                  {c.category}
                </span>
                <span className="text-surface-500 text-xs">{c.count} q</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-2 rounded bg-surface-700 overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, c.count * 8)}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs text-surface-400 group-hover:text-surface-300">
                  {score}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryCoverage;
