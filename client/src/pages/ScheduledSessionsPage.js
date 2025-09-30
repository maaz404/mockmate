import React, { useEffect, useState, useMemo } from "react";
import { apiService } from "../services/api";
import SchedulerModal from "../components/dashboard/SchedulerModal";
import WeeklyTimeline from "../components/calendar/WeeklyTimeline";
import MonthMiniCalendar from "../components/calendar/MonthMiniCalendar";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ScheduledSessionsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState(
    () => localStorage.getItem("sched_status") || "scheduled"
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [onlySelectedDay, setOnlySelectedDay] = useState(
    () => localStorage.getItem("sched_only_day") === "1"
  );

  const load = async (p = 1, st = status) => {
    try {
      const res = await apiService.get(
        `/users/scheduled-sessions?limit=10&page=${p}&includePast=true&status=${st}`
      );
      setItems(res.data || []);
      setPagination(res.pagination || null);
      setPage(p);
      localStorage.setItem("sched_page", String(p));
      localStorage.setItem("sched_status", st);
    } catch {
      setItems([]);
      setPagination(null);
    }
  };

  useEffect(() => {
    const savedPage = parseInt(localStorage.getItem("sched_page") || "1", 10);
    const savedStatus = localStorage.getItem("sched_status") || status;
    setStatus(savedStatus);
    load(savedPage, savedStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("sched_only_day", onlySelectedDay ? "1" : "0");
  }, [onlySelectedDay]);

  const onSave = async (payload) => {
    try {
      if (payload.id) {
        await apiService.put(
          `/users/scheduled-sessions/${payload.id}`,
          payload
        );
      } else {
        await apiService.post("/users/scheduled-sessions", payload);
      }
      setOpen(false);
      setEditing(null);
      await load(page);
      toast.success("Session saved");
    } catch {}
  };

  const onDelete = async (session) => {
    try {
      await apiService.delete(`/users/scheduled-sessions/${session._id}`);
      setOpen(false);
      setEditing(null);
      await load(page);
      toast.success("Session deleted");
    } catch {}
  };

  // Quick status tabs
  const tabs = [
    { key: "scheduled", label: "Scheduled" },
    { key: "completed", label: "Completed" },
    { key: "canceled", label: "Canceled" },
    { key: "all", label: "All" },
  ];

  const onChangeStatusTab = async (key) => {
    setStatus(key);
    await load(1, key);
  };

  // Optimistic status quick actions (hover)
  const updateStatus = async (session, newStatus) => {
    const prev = [...items];
    setItems((cur) =>
      cur.map((s) => (s._id === session._id ? { ...s, status: newStatus } : s))
    );
    try {
      await apiService.patch(
        `/users/scheduled-sessions/${session._id}/status`,
        { status: newStatus }
      );
      toast.success("Status updated");
    } catch (e) {
      setItems(prev);
      toast.error("Failed to update status; reverted");
    }
  };

  const sessionsForWeek = useMemo(() => items, [items]);

  // Week helpers (Mon start)
  const startOfWeek = (d) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const weekLabel = useMemo(() => {
    const s = startOfWeek(selectedDate);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });
    return `${fmt.format(s)} – ${fmt.format(e)}`;
  }, [selectedDate]);

  const displayItems = useMemo(() => {
    if (!onlySelectedDay) return items;
    return items.filter((s) => {
      const a = new Date(s.scheduledAt);
      return (
        a.getFullYear() === selectedDate.getFullYear() &&
        a.getMonth() === selectedDate.getMonth() &&
        a.getDate() === selectedDate.getDate()
      );
    });
  }, [items, onlySelectedDay, selectedDate]);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Scheduled Sessions
          </h1>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New Session
          </button>
        </div>

        <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 mb-6">
          <div className="p-3 border-b border-surface-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => onChangeStatusTab(t.key)}
                  className={`px-3 py-1 rounded-md text-xs border ${
                    status === t.key
                      ? "border-primary-500 text-primary-300 bg-primary-500/10"
                      : "border-surface-700 text-surface-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-surface-300">
                <input
                  type="checkbox"
                  className="accent-primary-500"
                  checked={onlySelectedDay}
                  onChange={(e) => setOnlySelectedDay(e.target.checked)}
                />
                Only selected day
              </label>
              <div className="text-xs text-surface-400">
                Page {pagination?.current || 1} of {pagination?.pages || 1}
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous week"
                  className="btn-outline p-1.5"
                  onClick={() =>
                    setSelectedDate((d) => {
                      const nd = new Date(d);
                      nd.setDate(nd.getDate() - 7);
                      return nd;
                    })
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-xs text-surface-300">{weekLabel}</div>
                <button
                  aria-label="Next week"
                  className="btn-outline p-1.5"
                  onClick={() =>
                    setSelectedDate((d) => {
                      const nd = new Date(d);
                      nd.setDate(nd.getDate() + 7);
                      return nd;
                    })
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                className="btn-outline text-xs"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </button>
            </div>
            <WeeklyTimeline
              sessions={sessionsForWeek}
              referenceDate={selectedDate}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700">
            <div className="divide-y divide-surface-700">
              {displayItems.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between px-4 py-3 group"
                >
                  <div>
                    <div className="text-white text-sm font-medium">
                      {s.title}
                    </div>
                    <div className="text-surface-400 text-xs">
                      {new Date(s.scheduledAt).toLocaleString()} • {s.type} •{" "}
                      {s.duration}m
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-xs text-green-400 hover:text-green-300"
                      onClick={() => updateStatus(s, "completed")}
                    >
                      Mark Complete
                    </button>
                    <button
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() => updateStatus(s, "canceled")}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              {displayItems.length === 0 && (
                <div className="px-4 py-8 text-sm text-surface-400">
                  No sessions found.
                </div>
              )}
            </div>
            {!onlySelectedDay && pagination && pagination.pages > 1 && (
              <div className="p-4 flex items-center justify-between">
                <button
                  className="btn-outline"
                  disabled={page <= 1}
                  onClick={() => load(Math.max(1, page - 1), status)}
                >
                  Prev
                </button>
                <button
                  className="btn-outline"
                  disabled={page >= pagination.pages}
                  onClick={() => load(page + 1, status)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <div>
            <MonthMiniCalendar
              referenceDate={selectedDate}
              sessions={items}
              onSelectDate={(d) => setSelectedDate(d)}
            />
            <div className="mt-4 bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-3">
              <div className="text-xs text-surface-400 mb-2">Selected Day</div>
              <div className="space-y-2">
                {items
                  .filter((s) => {
                    const a = new Date(s.scheduledAt);
                    return (
                      a.getFullYear() === selectedDate.getFullYear() &&
                      a.getMonth() === selectedDate.getMonth() &&
                      a.getDate() === selectedDate.getDate()
                    );
                  })
                  .map((s) => (
                    <div
                      key={s._id}
                      className="text-xs text-surface-300 flex items-center justify-between"
                    >
                      <span>
                        {new Date(s.scheduledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {s.title}
                      </span>
                      <button
                        className="text-primary-400 hover:text-primary-300"
                        onClick={() => {
                          setEditing(s);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                {items.filter((s) => {
                  const a = new Date(s.scheduledAt);
                  return (
                    a.getFullYear() === selectedDate.getFullYear() &&
                    a.getMonth() === selectedDate.getMonth() &&
                    a.getDate() === selectedDate.getDate()
                  );
                }).length === 0 && (
                  <div className="text-xs text-surface-500">
                    No sessions for this day.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SchedulerModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={onSave}
        onDelete={onDelete}
        initial={editing}
      />
    </div>
  );
}
