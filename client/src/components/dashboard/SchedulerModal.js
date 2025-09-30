import React, { useState, useEffect } from "react";

export default function SchedulerModal({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("technical");
  const [duration, setDuration] = useState(30);
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "Practice Session");
      setType(initial?.type || "technical");
      setDuration(initial?.duration || 30);
      setWhen(
        initial?.scheduledAt
          ? new Date(initial.scheduledAt).toISOString().slice(0, 16)
          : ""
      );
      setNotes(initial?.notes || "");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!title?.trim()) nextErrors.title = "Title is required";
    if (!when) nextErrors.when = "Schedule time is required";
    if (duration < 5) nextErrors.duration = "Minimum 5 minutes";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSave?.({
      id: initial?._id,
      title,
      type,
      duration: Number(duration),
      scheduledAt: when
        ? new Date(when).toISOString()
        : new Date().toISOString(),
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-surface-xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          {initial ? "Edit" : "Schedule"} Practice
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-surface-300 mb-1">Title</label>
            <input
              className="w-full bg-surface-800 border border-surface-700 rounded-md px-3 py-2 text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1">{errors.title}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-surface-300 mb-1">
                Type
              </label>
              <select
                className="w-full bg-surface-800 border border-surface-700 rounded-md px-3 py-2 text-white"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="system-design">System Design</option>
                <option value="case-study">Case Study</option>
                <option value="coding">Coding</option>
                <option value="mock">Mock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-surface-300 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                className="w-full bg-surface-800 border border-surface-700 rounded-md px-3 py-2 text-white"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              {errors.duration && (
                <p className="text-xs text-red-400 mt-1">{errors.duration}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-surface-300 mb-1">When</label>
            <input
              type="datetime-local"
              className="w-full bg-surface-800 border border-surface-700 rounded-md px-3 py-2 text-white"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
            {errors.when && (
              <p className="text-xs text-red-400 mt-1">{errors.when}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-surface-300 mb-1">Notes</label>
            <textarea
              className="w-full bg-surface-800 border border-surface-700 rounded-md px-3 py-2 text-white"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {initial && (
              <button
                type="button"
                onClick={() => onDelete?.(initial)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Delete
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
