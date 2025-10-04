import React from "react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

/*
 * Enhanced LoadingSpinner
 *  - modes: fullscreen | inline | overlay
 *  - optional progress (0-100)
 *  - accessible labels
 */
const LoadingSpinner = ({
  size = "medium",
  message = "Loading...",
  mode = "fullscreen",
  progress = null,
}) => {
  const sizeClasses = {
    xsmall: "w-3 h-3",
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };
  const prefersReducedMotion = usePrefersReducedMotion();
  const pulse = prefersReducedMotion ? "" : "animate-spin";

  const spinner = (
    <div
      className={`${
        sizeClasses[size] || sizeClasses.medium
      } border-4 border-primary-500/20 border-t-primary-500 rounded-full ${pulse}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    />
  );

  const progressBar =
    typeof progress === "number" && progress >= 0 && progress <= 100 ? (
      <div className="mt-4 w-40 h-2 rounded bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all"
          style={{ width: `${progress}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          role="progressbar"
        />
      </div>
    ) : null;

  if (mode === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-surface-500">
        {spinner}
        <span>{message}</span>
        {progressBar}
      </span>
    );
  }
  if (mode === "overlay") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-surface-900/70 backdrop-blur-sm z-50">
        {spinner}
        <p className="mt-3 text-sm font-medium text-surface-600 dark:text-surface-300">
          {message}
        </p>
        {progressBar}
      </div>
    );
  }
  // fullscreen default
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-900">
      {spinner}
      <p className="mt-4 text-surface-300 font-medium">{message}</p>
      {progressBar}
    </div>
  );
};

export default LoadingSpinner;

/* CSS (tailwind layer suggestion):
@keyframes ripple { to { transform: scale(4); opacity: 0; } }
.animate-ripple { animation: ripple 600ms ease-out; }
*/
