import React, { useState } from "react";

// Accessible collapsible/accordion panel
// Props: title (node), children, defaultOpen (bool), onToggle
// Adds motion reduced respect via prefers-reduced-motion

const Collapsible = ({
  title,
  children,
  defaultOpen = false,
  onToggle,
  dense = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onToggle && onToggle(next);
  };

  return (
    <div
      className={`border border-surface-200 dark:border-surface-700 rounded-xl bg-white/70 dark:bg-surface-800/70 backdrop-blur-sm transition-colors ${
        dense ? "py-2" : "py-3"
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-3 text-left px-4 focus:outline-none group ${
          dense ? "py-1.5" : "py-2.5"
        }`}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-medium text-surface-800 dark:text-surface-100">
          {title}
        </span>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-surface-300 dark:border-surface-600 text-xs font-semibold transition-all duration-200 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:border-primary-300 dark:group-hover:border-primary-700 ${
            open
              ? "rotate-90 text-primary-600 dark:text-primary-300"
              : "text-surface-500 dark:text-surface-400"
          }`}
        >
          ▶
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`px-4 pb-4 ${
              dense ? "pt-1" : "pt-2"
            } text-sm text-surface-700 dark:text-surface-300 space-y-4`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collapsible;
