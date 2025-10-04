import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// DashboardHero: Welcoming header with profile completeness + quick actions
const DashboardHero = ({
  user,
  profileCompleteness = 0,
  streak = 0,
  onboardingCompleted = false,
  onStart,
  onCreate,
}) => {
  const reduce = useReducedMotion();
  const completeness = Math.max(0, Math.min(100, profileCompleteness));
  // Compact/metrics removed per request
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
  className={`relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-gradient-to-br dark:from-surface-800/90 dark:via-surface-800/70 dark:to-surface-900/80 backdrop-blur-md px-6 md:px-10 py-10 shadow-surface-md dark:shadow-surface-lg transition-colors`}
    >
      <div className="pointer-events-none absolute -top-24 -left-14 w-80 h-80 rounded-full bg-primary-500/10 dark:bg-primary-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-14 w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-fuchsia-600/10 blur-3xl" />
      <div
        className={`relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6`}
      >
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
          {/* KPI pills removed per request */}
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

export default DashboardHero;
