import React, { useEffect, useRef, useState } from "react";

export default function CommandPalette({ open, onClose, onAction }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");

  const actions = [
    { id: "start:technical", label: "Start Technical Interview" },
    { id: "start:behavioral", label: "Start Behavioral Interview" },
    { id: "start:system-design", label: "Start System Design" },
    { id: "start:mixed", label: "Start Mixed Interview" },
    { id: "schedule:quick", label: "Open Quick Scheduler" },
    { id: "nav:interviews", label: "Go to Interviews" },
    { id: "nav:new", label: "Create Interview" },
    { id: "nav:settings", label: "Open Settings" },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-xl rounded-2xl border border-surface-700 bg-surface-900 shadow-surface-xl"
      >
        <div className="px-4 py-3 border-b border-surface-700">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="w-full bg-surface-800 border border-surface-700 rounded-md px-3 py-2 text-white"
            aria-label="Command search"
          />
        </div>
        <ul className="max-h-80 overflow-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-2 text-sm text-surface-400">
              No commands found
            </li>
          )}
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                className="w-full text-left px-4 py-2 text-sm text-surface-200 hover:bg-surface-800 focus:bg-surface-800 focus:outline-none"
                onClick={() => onAction?.(a.id)}
              >
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
