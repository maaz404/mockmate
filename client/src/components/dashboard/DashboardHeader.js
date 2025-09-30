import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHeader({ user, userProfile, onStartInterview }) {
  const completeness = userProfile?.profileCompleteness ?? 0;
  const streak = userProfile?.streak?.current ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-black/50 backdrop-blur-md p-6 shadow-surface-md dark:shadow-surface-lg">
      {/* Accent gradient blur */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="mt-1 text-surface-600 dark:text-surface-300">
            {userProfile?.onboardingCompleted
              ? "Ready for your next interview practice session?"
              : "Let's get your profile set up first!"}
          </p>

          {completeness < 100 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400 mb-1">
                <span>Profile completeness</span>
                <span>{completeness}%</span>
              </div>
              <div className="h-2 w-full bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${completeness}%` }}
                  aria-hidden
                />
              </div>
              <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                Complete your profile to get better interview recommendations.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-full px-3 py-1 text-xs border border-surface-200 dark:border-surface-700">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            Streak: <strong className="ml-1">{streak}</strong> days
          </div>
          <button
            onClick={() => onStartInterview?.("mixed")}
            className="btn-primary"
          >
            Start practice
          </button>
          <Link
            to="/interview/new"
            className="btn-outline"
          >
            Create interview
          </Link>
        </div>
      </div>
    </div>
  );
}
