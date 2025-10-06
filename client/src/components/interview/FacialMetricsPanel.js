import React from 'react';

/**
 * Lightweight real-time facial analysis metrics panel.
 * Expects metrics object with numeric fields (0-100 or raw) and loading booleans.
 */
export function FacialMetricsPanel({ metrics, analyzing, onStop, onStart, initialized, error }) {
  return (
    <div className="mt-6 p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-surface-700 dark:text-surface-300 flex items-center gap-2">
          <span>🎥 Facial Metrics</span>
          {!analyzing && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 border border-surface-300 dark:border-surface-600">idle</span>
          )}
          {analyzing && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-500 animate-pulse">live</span>
          )}
        </h3>
        <div className="flex gap-2">
          {!initialized && (
            <button onClick={onStart} className="btn-ghost !px-2 !py-1 text-xs">Enable</button>
          )}
          {initialized && !analyzing && (
            <button onClick={onStart} className="btn-outline !px-2 !py-1 text-xs">Start</button>
          )}
          {analyzing && (
            <button onClick={onStop} className="btn-outline !px-2 !py-1 text-xs">Stop</button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {initialized ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            ['Eye Contact', metrics.eyeContact, '%'],
            ['Confidence', metrics.confidenceScore, '%'],
            ['Smile', metrics.smilePercentage, '%'],
            ['Blink Rate', metrics.blinkRate, '/min'],
            ['Steadiness', metrics.headSteadiness, '%'],
            ['Off Screen', metrics.offScreenPercentage, '%'],
          ].map(([label, val, suffix]) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between"><span className="font-medium text-surface-600 dark:text-surface-400">{label}</span><span className="font-semibold text-surface-900 dark:text-surface-200 tabular-nums">{typeof val === 'number' ? Math.round(val) : '-'}{suffix}</span></div>
              <div className="h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600" style={{width: `${Math.min(100, Math.max(0, val || 0))}%`}} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-surface-500 dark:text-surface-400">Enable to receive real-time speaking feedback. Processing happens locally (mock mode).</p>
      )}
    </div>
  );
}

export default FacialMetricsPanel;
