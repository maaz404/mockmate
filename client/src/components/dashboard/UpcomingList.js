import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateLabel, formatRelativeCountdown } from "../../utils/datetime";
// Import with alias + explicit assignment to ensure ESLint/ bundler sees definition
import StyledSelectDefault from "../ui/StyledSelect";
const StyledSelect = StyledSelectDefault; // defensive alias to satisfy lint

export default function UpcomingList({
  sessions = [],
  pagination,
  onNextPage,
  onPrevPage,
  onEdit,
  onStatusChange,
  statusFilter,
  onFilterChange,
  onCreate,
  density = "comfortable", // 'comfortable' | 'compact'
  // Controlled preferences (optional)
  viewMode: viewModeProp,
  thisWeekOnly: thisWeekOnlyProp,
  onChangeViewMode,
  onChangeThisWeekOnly,
}) {
  const isViewControlled = typeof viewModeProp === "string";
  const [viewModeState, setViewModeState] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.upcoming.view") || "list";
    } catch {
      return "list";
    }
  });
  const viewMode = isViewControlled ? viewModeProp : viewModeState;
  const setViewMode = useMemo(() => {
    return isViewControlled ? onChangeViewMode || (() => {}) : setViewModeState;
  }, [isViewControlled, onChangeViewMode, setViewModeState]);

  const isWeekOnlyControlled = typeof thisWeekOnlyProp === "boolean";
  const [thisWeekOnlyState, setThisWeekOnlyState] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.upcoming.weekOnly") === "1";
    } catch {
      return false;
    }
  });
  const thisWeekOnly = isWeekOnlyControlled
    ? thisWeekOnlyProp
    : thisWeekOnlyState;
  const setThisWeekOnly = useMemo(() => {
    return isWeekOnlyControlled
      ? onChangeThisWeekOnly || (() => {})
      : setThisWeekOnlyState;
  }, [isWeekOnlyControlled, onChangeThisWeekOnly, setThisWeekOnlyState]);

  useEffect(() => {
    if (isViewControlled) return;
    try {
      localStorage.setItem("mm.dashboard.upcoming.view", viewMode);
    } catch {}
  }, [viewMode, isViewControlled]);

  useEffect(() => {
    if (isWeekOnlyControlled) return;
    try {
      localStorage.setItem(
        "mm.dashboard.upcoming.weekOnly",
        thisWeekOnly ? "1" : "0"
      );
    } catch {}
  }, [thisWeekOnly, isWeekOnlyControlled]);

  // Keyboard shortcuts for power users
  useEffect(() => {
    const onKey = (e) => {
      const mKey = e.ctrlKey || e.metaKey;
      if (mKey && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        setViewMode((m) => (m === "list" ? "week" : "list"));
      }
      if (mKey && e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        setThisWeekOnly((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setViewMode, setThisWeekOnly]);

  const sortedSessions = useMemo(() => {
    let list = [...sessions].sort(
      (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
    );
    if (!thisWeekOnly) return list;
    const now = new Date();
    // start of week (Mon) configurable; here we use local week start
    const day = now.getDay(); // 0 Sun ... 6 Sat
    const diffToMon = (day + 6) % 7; // days since Monday
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToMon,
      0,
      0,
      0,
      0
    );
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    list = list.filter((s) => {
      const t = new Date(s.scheduledAt);
      return t >= start && t < end;
    });
    return list;
  }, [sessions, thisWeekOnly]);

  const weekGroups = useMemo(() => {
    if (viewMode !== "week") return {};
    const groups = {};
    for (const s of sortedSessions) {
      const d = new Date(s.scheduledAt);
      const key = d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  }, [sortedSessions, viewMode]);

  const firstId = sortedSessions[0]?._id;
  const itemPad = density === "compact" ? "px-3 py-1.5" : "px-3 py-2";
  const listGap = density === "compact" ? "space-y-2" : "space-y-3";

  return (
    <div className="surface-elevated dark:bg-surface-800/50">
      <div className="px-4 py-3 border-b border-surface-700 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-surface-400">
            Schedule
          </p>
          <h3 className="text-base font-semibold text-white">
            Upcoming Sessions
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 mr-2"
            role="tablist"
            aria-label="View mode"
          >
            <button
              type="button"
              aria-pressed={viewMode === "list"}
              className={`text-xs px-2 py-1 rounded border border-surface-700 ${
                viewMode === "list"
                  ? "bg-surface-800 text-white"
                  : "text-surface-300 hover:bg-surface-800"
              }`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "week"}
              className={`text-xs px-2 py-1 rounded border border-surface-700 ${
                viewMode === "week"
                  ? "bg-surface-800 text-white"
                  : "text-surface-300 hover:bg-surface-800"
              }`}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-1 mr-2 text-[11px]">
            <input
              id="this-week-only"
              type="checkbox"
              className="accent-primary-500"
              checked={thisWeekOnly}
              onChange={(e) => setThisWeekOnly(e.target.checked)}
            />
            <label htmlFor="this-week-only" className="text-surface-300">
              This week only
            </label>
          </div>
          <label className="sr-only" htmlFor="upcoming-status-filter">
            Filter by status
          </label>
          <div className="w-32">
            <StyledSelect
              id="upcoming-status-filter"
              value={statusFilter}
              onChange={(e) => onFilterChange?.(e.target.value)}
              size="sm"
              ariaLabel="Filter by status"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="all">All</option>
            </StyledSelect>
          </div>
          <div className="text-xs text-surface-400">
            {pagination
              ? `Page ${pagination.current} of ${pagination.pages}`
              : null}
          </div>
        </div>
      </div>

      <div className={`p-4 ${listGap}`}>
        {sortedSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-surface-400">No sessions scheduled.</p>
            <p className="text-xs text-surface-500 mb-3">
              Create your first practice session from Quick Start or schedule
              one now.
            </p>
            {onCreate && (
              <button
                className="btn-primary text-xs"
                onClick={onCreate}
                aria-label="Schedule a new session"
              >
                Schedule session
              </button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <AnimatePresence initial={false}>
            {sortedSessions.map((s) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`flex items-center justify-between bg-surface-900/50 border border-surface-700 rounded-lg ${itemPad} focus-within:ring-1 focus-within:ring-primary-500 ${
                  s._id === firstId ? "ring-1 ring-primary-500/40" : ""
                }`}
              >
                <div>
                  <p className="text-sm text-white font-medium">{s.title}</p>
                  <p className="text-xs text-surface-400">
                    {formatDateLabel(s.scheduledAt)} • {s.type}
                  </p>
                  {s._id === firstId && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/20">
                      Next up
                      <span className="text-primary-200/90">
                        • in {formatRelativeCountdown(s.scheduledAt)}
                      </span>
                    </span>
                  )}
                  {statusFilter === "all" && s.status === "completed" && (
                    <span className="ml-2 inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/20">
                      Completed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${s._id}`}>
                    Status
                  </label>
                  <select
                    id={`status-${s._id}`}
                    value={s.status}
                    onChange={(e) => onStatusChange?.(s, e.target.value)}
                    className="text-xs bg-surface-900 border border-surface-700 rounded px-2 py-1 text-surface-300"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <button
                    className="text-primary-400 hover:text-primary-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900 rounded"
                    onClick={() => onEdit?.(s)}
                    aria-label={`Edit session ${s.title}`}
                  >
                    Edit
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          // Week view: group by day label
          <div className="space-y-4">
            {Object.entries(weekGroups).map(([day, items]) => (
              <div key={day}>
                <div className="text-xs text-surface-400 px-1 pb-1">{day}</div>
                <div
                  className={
                    density === "compact" ? "space-y-1.5" : "space-y-2"
                  }
                >
                  <AnimatePresence initial={false}>
                    {items.map((s) => (
                      <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`flex items-center justify-between bg-surface-900/50 border border-surface-700 rounded-lg ${itemPad} ${
                          s._id === firstId ? "ring-1 ring-primary-500/40" : ""
                        }`}
                      >
                        <div>
                          <p className="text-sm text-white font-medium">
                            {s.title}
                          </p>
                          <p className="text-xs text-surface-400">
                            {formatDateLabel(s.scheduledAt)} • {s.type}
                          </p>
                          {s._id === firstId && (
                            <span className="mt-1 inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/20">
                              Next up
                            </span>
                          )}
                          {statusFilter === "all" &&
                            s.status === "completed" && (
                              <span className="ml-2 inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/20">
                                Completed
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            className="sr-only"
                            htmlFor={`status-${s._id}`}
                          >
                            Status
                          </label>
                          <select
                            id={`status-${s._id}`}
                            value={s.status}
                            onChange={(e) =>
                              onStatusChange?.(s, e.target.value)
                            }
                            className="text-xs bg-surface-900 border border-surface-700 rounded px-2 py-1 text-surface-300"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                          </select>
                          <button
                            className="text-primary-400 hover:text-primary-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900 rounded"
                            onClick={() => onEdit?.(s)}
                            aria-label={`Edit session ${s.title}`}
                          >
                            Edit
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="px-4 pb-4 flex items-center justify-between text-xs text-surface-400">
          <button
            className="btn-outline disabled:opacity-50"
            onClick={onPrevPage}
            disabled={pagination.current <= 1}
          >
            Prev
          </button>
          <button
            className="btn-outline disabled:opacity-50"
            onClick={onNextPage}
            disabled={pagination.current >= pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
