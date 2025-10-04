import React from "react";

/** TagPill component
 * Props:
 * - label (string)
 * - active (bool)
 * - onClick (fn)
 * - onRemove (fn) optional - shows remove icon
 * - count (number) optional - small badge
 * - size (sm|md)
 * - ariaLabel override
 */
export default function TagPill({
  label,
  active,
  onClick,
  onRemove,
  count,
  size = "sm",
  ariaLabel,
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 text-xs";
  const sizing = size === "md" ? "px-3 py-1.5" : "px-2 py-1";
  const style = active
    ? "bg-primary-600 text-white border-primary-600 hover:bg-primary-500"
    : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-300 dark:border-surface-600 hover:bg-surface-200 dark:hover:bg-surface-600";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      aria-pressed={active}
      className={`${base} ${sizing} ${style}`}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span className="text-[10px] font-semibold bg-primary-600 text-white px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          role="button"
          aria-label={`Remove tag ${label}`}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3 h-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
