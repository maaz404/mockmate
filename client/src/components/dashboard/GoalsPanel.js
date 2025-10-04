import React from "react";

export default function GoalsPanel({ goals = [], onToggle }) {
  const items = goals.length
    ? goals
    : [
        { title: "Practice 3x this week", done: false },
        { title: "Complete 1 system design round", done: false },
        { title: "Improve behavioral answers clarity", done: false },
      ];

  return (
  <div className="surface-elevated dark:bg-surface-800/50">
      <div className="p-6 border-b border-surface-700">
        <h3 className="text-lg font-medium text-white">Weekly Goals</h3>
        <p className="text-sm text-surface-400 mt-1">Stay on track</p>
      </div>
      <div className="p-6 space-y-3">
        {items.map((g, idx) => (
          <label key={idx} className="flex items-center gap-3 group">
            <input
              type="checkbox"
              checked={!!g.done}
              onChange={() => onToggle?.(idx)}
              className="h-4 w-4 rounded border-surface-600 text-primary-600 focus:ring-primary-500 bg-surface-700"
            />
            <span
              className={`text-sm ${
                g.done ? "line-through text-surface-500" : "text-surface-300"
              }`}
            >
              {g.title}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
