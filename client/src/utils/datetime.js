// Centralized date/time helpers for consistent formatting

export function formatAbsolute(date) {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return String(date);
  }
}

export function formatDateLabel(date) {
  try {
    return new Date(date).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(date);
  }
}

export function formatRelativeCountdown(dateStr) {
  const now = Date.now();
  const t = new Date(dateStr).getTime();
  const diffMin = Math.max(0, Math.round((t - now) / 60000));
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function isWithinNextMs(dateStr, ms) {
  const t = new Date(dateStr).getTime();
  const now = Date.now();
  return t - now <= ms && t - now >= 0;
}
