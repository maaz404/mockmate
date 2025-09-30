import React, { useMemo } from "react";

// Utility: start of week (Mon)
const startOfWeek = (d) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const minutesSinceMidnight = (date) => date.getHours() * 60 + date.getMinutes();

export default function WeeklyTimeline({
  sessions = [],
  referenceDate = new Date(),
  slotMinutes = 30,
}) {
  const weekStart = useMemo(() => startOfWeek(referenceDate), [referenceDate]);
  const days = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) =>
          new Date(
            weekStart.getFullYear(),
            weekStart.getMonth(),
            weekStart.getDate() + i
          )
      ),
    [weekStart]
  );

  // Group sessions by day (same local date)
  const grouped = useMemo(() => {
    const map = {};
    for (const day of days) {
      const key = day.toDateString();
      map[key] = [];
    }
    for (const s of sessions) {
      const dt = new Date(s.scheduledAt);
      const key = new Date(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate()
      ).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [sessions, days]);

  const totalSlots = (24 * 60) / slotMinutes; // 48 for 30-min

  return (
    <div className="w-full overflow-x-auto hover-scrollbar">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 gap-0">
          {/* Time column */}
          <div className="text-xs text-surface-400 border-b border-surface-700" />
          {days.map((d, idx) => (
            <div
              key={idx}
              className="text-xs text-surface-300 px-2 py-2 border-b border-surface-700"
            >
              {d.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-0">
          {/* Time ruler */}
          <div className="border-r border-surface-700">
            {Array.from({ length: totalSlots + 1 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 relative ${
                  i % 2 === 0
                    ? "border-t border-surface-800"
                    : "border-t border-surface-900/40"
                }`}
              >
                {i % (60 / slotMinutes) === 0 && (
                  <span className="absolute -top-2 text-[10px] text-surface-500">
                    {String(Math.floor((i * slotMinutes) / 60)).padStart(
                      2,
                      "0"
                    )}
                    :00
                  </span>
                )}
              </div>
            ))}
          </div>
          {days.map((d, idx) => {
            const key = d.toDateString();
            const items = grouped[key] || [];
            return (
              <div key={idx} className="relative border-r border-surface-700">
                {/* Background grid */}
                {Array.from({ length: totalSlots + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 ${
                      i % 2 === 0
                        ? "border-t border-surface-800"
                        : "border-t border-surface-900/40"
                    }`}
                  />
                ))}
                {/* Session blocks */}
                <div className="absolute inset-0">
                  {items.map((s) => {
                    const dt = new Date(s.scheduledAt);
                    const top =
                      (minutesSinceMidnight(dt) / (24 * 60)) *
                      ((totalSlots + 1) * 24); // each slot is 6px (h-6)
                    const height = Math.max(
                      12,
                      ((s.duration || 30) / slotMinutes) * 24
                    ); // 24px per slot
                    return (
                      <div
                        key={s._id}
                        className="absolute left-1 right-1 rounded-md bg-primary-500/20 border border-primary-500/40 p-1"
                        style={{ top, height }}
                        title={`${s.title} • ${dt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                      >
                        <div className="text-[10px] text-primary-200 truncate">
                          {s.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
