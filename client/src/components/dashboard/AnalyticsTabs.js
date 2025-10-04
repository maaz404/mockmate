import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// Tab metadata
const TABS = [
  { key: "radar", label: "Skills" },
  { key: "tags", label: "Tags" },
  { key: "coverage", label: "Coverage" },
  { key: "consistency", label: "Consistency" },
  { key: "activity", label: "Activity" },
  { key: "followups", label: "Follow-ups" },
  { key: "streak", label: "Streak" },
];

const AnalyticsTabs = ({ components, loading }) => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.tab") || "radar";
    } catch {
      return "radar";
    }
  });
  const setActiveTab = (k) => {
    setActive(k);
    try {
      localStorage.setItem("mm.dashboard.tab", k);
    } catch {}
  };

  const onKey = useCallback(
    (e) => {
      if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
      e.preventDefault();
      const idx = TABS.findIndex((t) => t.key === active);
      const next =
        e.key === "ArrowRight"
          ? (idx + 1) % TABS.length
          : (idx - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[next].key);
    },
    [active]
  );

  useEffect(() => {
    const el = document.getElementById("analytics-tablist");
    if (el) el.addEventListener("keydown", onKey);
    return () => el && el.removeEventListener("keydown", onKey);
  }, [onKey]);

  const content = (() => {
    if (loading)
      return <div className="text-xs text-surface-500">Loading analytics…</div>;
    switch (active) {
      case "radar":
        return components.radar;
      case "tags":
        return components.tags;
      case "coverage":
        return components.coverage;
      case "consistency":
        return components.consistency;
      case "activity":
        return components.activity;
      case "followups":
        return components.followups;
      case "streak":
        return components.streak;
      default:
        return null;
    }
  })();

  return (
    <div
      className="dashboard-card p-4 flex flex-col gap-4"
      aria-label="Advanced analytics"
    >
      <div
        id="analytics-tablist"
        role="tablist"
        aria-orientation="horizontal"
        className="flex flex-wrap gap-2"
      >
        {TABS.map((t) => {
          const activeState = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeState}
              tabIndex={activeState ? 0 : -1}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] border transition-colors ${
                activeState
                  ? "bg-primary-600 text-white border-primary-500"
                  : "bg-surface-700/40 text-surface-300 border-surface-600 hover:bg-surface-600/60"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="relative min-h-[140px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalyticsTabs;
