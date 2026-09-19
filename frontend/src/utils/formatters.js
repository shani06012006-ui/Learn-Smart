// Shared formatters for date/time display. Centralized so chat, notifications,
// materials, and any future feature use the same strings and edge-case handling.

export function formatClockTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Short relative timestamp for thread-list previews.
//   0-59s   -> "now"
//   1-59m   -> "5m"
//   1-23h   -> "3h"
//   1-6d    -> "4d"
//   else    -> "12 Aug" or "12 Aug 2025" if a different year
export function formatRelativeShort(iso) {
  if (!iso) return "";
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d`;
  return then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: then.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

// Long "last seen" style relative string for profile presence.
export function formatLastSeen(iso) {
  if (!iso) return null;
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "last seen just now";
  if (min < 60) return `last seen ${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `last seen ${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `last seen ${days}d ago`;
  return `last seen ${then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

// Date label for message grouping. Returns "Today", "Yesterday", a weekday
// name if within the last week, or a short date.
export function formatDateLabel(iso) {
  if (!iso) return "";
  const now = new Date();
  const then = new Date(iso);
  const startOfDay = (d) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
  };
  const diffDays = Math.round((startOfDay(now) - startOfDay(then)) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return then.toLocaleDateString(undefined, { weekday: "long" });
  return then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: then.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

// True when two ISO timestamps fall on different calendar days.
export function isDifferentDay(isoA, isoB) {
  if (!isoA || !isoB) return true;
  const a = new Date(isoA);
  const b = new Date(isoB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return a.getTime() !== b.getTime();
}
