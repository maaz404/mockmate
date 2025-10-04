import React from "react";

const dayColor = (active) =>
  active
    ? "bg-primary-500/80 border-primary-400"
    : "bg-surface-600/40 border-surface-600 hover:bg-surface-500/40";

const StreakStrip = ({ days }) => {
  if (!days || !days.length)
    return (
  <div className="surface-elevated dark:bg-surface-800/50 p-5 text-sm text-surface-400">
        No activity yet.
      </div>
    );
  const activeCount = days.filter((d) => d.active).length;
  const pct = Math.round((activeCount / days.length) * 100);
  return (
  <div className="surface-elevated dark:bg-surface-800/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-surface-400">
            Consistency
          </p>
          <h3 className="text-lg font-semibold text-white">21‑Day Activity</h3>
        </div>
        <div className="text-xs text-surface-400">{pct}% active</div>
      </div>
      <div
        className="grid grid-cols-21 gap-1"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}
      >
        {days.map((d) => (
          <div
            key={d.date}
            role="listitem"
            aria-label={`${d.date} ${
              d.active ? "active practice day" : "no practice"
            }`}
            data-active={d.active ? "1" : "0"}
            title={`${d.date} • ${d.active ? "Active" : "Idle"}`}
            className={`h-4 rounded border ${dayColor(
              d.active
            )} transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500`}
            tabIndex={0}
          />
        ))}
      </div>
      <p className="mt-3 text-[11px] text-surface-400">
        Aim for steady daily touches—small consistent practice compounds faster
        than bursts.
      </p>
    </div>
  );
};

export default StreakStrip;
