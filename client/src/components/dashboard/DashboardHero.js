import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { formatRelativeCountdown } from "../../utils/datetime";

// DashboardHero: Welcoming header with profile completeness + quick actions
const DashboardHero = ({
  user,
  profileCompleteness = 0,
  streak = 0,
  onboardingCompleted = false,
  nextSession = null,
  consistency = null,
  openGoals = 0,
  onStart,
  onCreate,
  initialCompact,
}) => {
  const reduce = useReducedMotion();
  const completeness = Math.max(0, Math.min(100, profileCompleteness));
  const [compact, setCompact] = useState(() => {
    if (typeof initialCompact === "boolean") return initialCompact;
    try {
      return localStorage.getItem("mm.dashboard.heroCompact") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.heroCompact", compact ? "1" : "0");
    } catch {}
  }, [compact]);
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-gradient-to-br dark:from-surface-800/90 dark:via-surface-800/70 dark:to-surface-900/80 backdrop-blur-md px-6 md:px-10 ${compact ? 'py-5' : 'py-10'} shadow-surface-md dark:shadow-surface-lg transition-colors`}
    >
      <div className="pointer-events-none absolute -top-24 -left-14 w-80 h-80 rounded-full bg-primary-500/10 dark:bg-primary-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-14 w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-fuchsia-600/10 blur-3xl" />
      <div className={`relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6`}>      
        <div className="max-w-xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            Welcome back{user?.firstName ? "," : ""}{" "}
            {user?.firstName || user?.username || "there"}
          </h1>
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">
            {onboardingCompleted
              ? "Ready for your next interview practice session?"
              : completeness < 40
              ? "Let's get your profile set up to unlock personalized recommendations."
              : "Great progress—finish setting up to further refine coaching insights."}
          </p>
          {completeness < 100 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-surface-400 mb-1">
                <span>Profile completeness</span>
                <span>{completeness}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {completeness < 40 && (
                  <a
                    href="/onboarding"
                    className="text-[11px] px-2 py-1 rounded-md bg-primary-500/15 text-primary-700 dark:text-primary-300 border border-primary-500/40 hover:bg-primary-500/25 dark:bg-primary-600/20 dark:hover:bg-primary-600/30"
                  >
                    Complete Profile
                  </a>
                )}
                <a
                  href="/settings"
                  className="text-[11px] px-2 py-1 rounded-md bg-surface-100 text-surface-600 border border-surface-300 hover:bg-surface-200 dark:bg-surface-700/60 dark:text-surface-300 dark:border-surface-600 dark:hover:bg-surface-700"
                >
                  Edit Preferences
                </a>
              </div>
            </div>
          )}
          {/* KPI Ribbon inline (footer area on large screens) */}
          <div
            className={`mt-6 flex flex-wrap items-center gap-3 ${compact ? "text-[10px]" : "text-[11px]"}`}
          >
            <KpiPill
              label="Next"
              value={nextSession ? formatRelativeCountdown(nextSession) : "—"}
              tone={nextSession ? "info" : "neutral"}
              tooltip={nextSession ? `Starts ${formatRelativeCountdown(nextSession)}` : 'No upcoming session'}
            />
            <KpiPill
              label="Consistency"
              value={consistency != null ? `${consistency}%` : "—"}
              tone={
                consistency >= 70
                  ? "success"
                  : consistency >= 40
                  ? "info"
                  : "warn"
              }
              tooltip={consistency != null ? 'Practice consistency over selected horizon' : 'No data yet'}
            />
            <KpiPill
              label="Goals Left"
              value={openGoals}
              tone={openGoals === 0 ? "success" : "info"}
              tooltip={openGoals === 0 ? 'All goals completed' : `${openGoals} goals remaining`}
            />
            <button
              onClick={() => setCompact((c) => !c)}
              className="ml-2 px-2 py-1 rounded-md border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-300 text-[10px] hover:bg-surface-200 dark:hover:bg-surface-700"
            >
              {compact ? "Expand Hero" : "Compact Hero"}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 md:items-end md:min-w-[260px]">
          <div className="flex items-center gap-2 self-end bg-surface-100 dark:bg-surface-700/60 border border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-300 rounded-full px-3 py-1 text-[11px]">
            <span
              className="inline-block w-2 h-2 rounded-full bg-emerald-500"
              aria-hidden
            />
            Streak:{" "}
            <strong className="ml-1 text-surface-900 dark:text-white">
              {streak}
            </strong>{" "}
            days
          </div>
          <button
            onClick={() => onStart?.("mixed")}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            Start practice
          </button>
          <button
            onClick={() => onCreate?.()}
            className="px-5 py-3 rounded-xl border border-emerald-500/60 text-emerald-600 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-600/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Create interview
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const KpiPill = ({ label, value, tone = "neutral", tooltip }) => {
  const toneClasses = {
    neutral:
      "bg-surface-100 dark:bg-surface-700/60 text-surface-600 dark:text-surface-300 border-surface-300 dark:border-surface-600",
    success:
      "bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
    warn: "bg-amber-50 dark:bg-amber-600/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
    info: "bg-primary-50 dark:bg-primary-600/20 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-500/40",
  }[tone];
  return (
    <div className="relative group">
      <div
        className={`text-[11px] px-3 py-1 rounded-full border flex items-center gap-1 ${toneClasses}`}
      >
        {label}: <span className="font-medium">{value}</span>
      </div>
      <AnimatePresence>
        {!tooltip ? null : (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md bg-surface-900/95 text-surface-50 text-[10px] px-2 py-1 shadow-lg border border-surface-700 dark:bg-surface-800/90 dark:text-surface-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100"
            style={{ willChange: 'opacity, transform' }}
          >{tooltip}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardHero;
