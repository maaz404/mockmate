import React from "react";

export default function UpcomingList({
  sessions = [],
  pagination,
  onNextPage,
  onPrevPage,
  onEdit,
  onStatusChange,
  statusFilter,
  onFilterChange,
}) {
  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700">
      <div className="p-4 border-b border-surface-700 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-white">Upcoming Sessions</h3>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange?.(e.target.value)}
            className="text-xs bg-surface-900 border border-surface-700 rounded px-2 py-1 text-surface-300"
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
            <option value="all">All</option>
          </select>
          <div className="text-xs text-surface-400">
            {pagination
              ? `Page ${pagination.current} of ${pagination.pages}`
              : null}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {sessions.length === 0 && (
          <p className="text-sm text-surface-400">No sessions scheduled.</p>
        )}
        {sessions.map((s) => (
          <div
            key={s._id}
            className="flex items-center justify-between bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2"
          >
            <div>
              <p className="text-sm text-white font-medium">{s.title}</p>
              <p className="text-xs text-surface-400">
                {new Date(s.scheduledAt).toLocaleString()} • {s.type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={s.status}
                onChange={(e) => onStatusChange?.(s, e.target.value)}
                className="text-xs bg-surface-900 border border-surface-700 rounded px-2 py-1 text-surface-300"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
              <button
                className="text-primary-400 hover:text-primary-300 text-xs"
                onClick={() => onEdit?.(s)}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="px-4 pb-4 flex items-center justify-between text-xs text-surface-400">
          <button
            className="btn-outline disabled:opacity-50"
            onClick={onPrevPage}
            disabled={pagination.current <= 1}
          >
            Prev
          </button>
          <button
            className="btn-outline disabled:opacity-50"
            onClick={onNextPage}
            disabled={pagination.current >= pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
