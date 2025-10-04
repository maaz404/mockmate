import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// DashboardHero: Welcoming header with profile completeness + quick actions
const DashboardHero = ({ user, profileCompleteness = 0, onStart, onCreate }) => {
  const reduce = useReducedMotion();
  const completeness = Math.max(0, Math.min(100, profileCompleteness));
  const short = completeness >= 60;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl border border-surface-700 bg-gradient-to-br from-surface-800/90 via-surface-800/70 to-surface-900/80 backdrop-blur-md px-6 md:px-10 ${short ? 'py-6' : 'py-10'} shadow-surface-lg`}
    >
      <div className="pointer-events-none absolute -top-24 -left-14 w-80 h-80 rounded-full bg-primary-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-14 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome back{user?.firstName ? ',' : ''} {user?.firstName || user?.username || 'there'}
          </h1>
          {completeness < 100 && (
            <p className="mt-2 text-sm text-surface-300">
              {completeness < 40
                ? "Let's get your profile set up to unlock personalized recommendations."
                : 'Great progress—finish setting up to further refine coaching insights.'}
            </p>
          )}
          {completeness < 100 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-surface-400 mb-1">
                <span>Profile completeness</span>
                <span>{completeness}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-700 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-emerald-500" style={{ width: `${completeness}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {completeness < 40 && (
                  <a href="/onboarding" className="text-[11px] px-2 py-1 rounded-md bg-primary-600/20 text-primary-300 border border-primary-600/40 hover:bg-primary-600/30">Complete Profile</a>
                )}
                <a href="/settings" className="text-[11px] px-2 py-1 rounded-md bg-surface-700/60 text-surface-300 border border-surface-600 hover:bg-surface-700">Edit Preferences</a>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-3 md:items-end md:min-w-[260px]">
          <button onClick={() => onStart?.('mixed')} className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500">Start practice</button>
          <button onClick={() => onCreate?.()} className="px-5 py-3 rounded-xl border border-emerald-500/60 text-emerald-300 text-sm font-medium hover:bg-emerald-600/10 focus:outline-none focus:ring-2 focus:ring-emerald-500">Create interview</button>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHero;
