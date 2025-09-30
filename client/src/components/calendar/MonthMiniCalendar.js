import React, { useMemo } from "react";

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfWeek = (d) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function MonthMiniCalendar({
  referenceDate = new Date(),
  sessions = [],
  onSelectDate,
}) {
  const monthStart = useMemo(
    () => startOfMonth(referenceDate),
    [referenceDate]
  );
  const monthEnd = useMemo(() => endOfMonth(referenceDate), [referenceDate]);
  const gridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const totalDays = useMemo(
    () => Math.ceil((monthEnd - gridStart) / (1000 * 60 * 60 * 24)) + 1,
    [monthEnd, gridStart]
  );

  const days = useMemo(
    () =>
      Array.from(
        { length: Math.ceil(totalDays / 7) * 7 },
        (_, i) =>
          new Date(
            gridStart.getFullYear(),
            gridStart.getMonth(),
            gridStart.getDate() + i
          )
      ),
    [gridStart, totalDays]
  );

  const dotsByDay = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      const dt = new Date(s.scheduledAt);
      const key = new Date(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate()
      ).toDateString();
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [sessions]);

  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-3">
      <div className="grid grid-cols-7 text-[10px] text-surface-400 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === referenceDate.getMonth();
          const key = d.toDateString();
          const count = dotsByDay[key] || 0;
          return (
            <button
              key={i}
              onClick={() => onSelectDate?.(d)}
              className={`h-16 rounded-md border text-xs flex flex-col items-center justify-center ${
                inMonth
                  ? "border-surface-700 text-white"
                  : "border-surface-800 text-surface-500"
              } hover:bg-surface-700/40`}
            >
              <div>{d.getDate()}</div>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: Math.min(count, 3) }).map((_, k) => (
                  <span
                    key={k}
                    className="w-1.5 h-1.5 rounded-full bg-primary-400"
                  />
                ))}
                {count > 3 && (
                  <span className="text-[10px] text-primary-300">
                    +{count - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
