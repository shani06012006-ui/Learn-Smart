// Renders a centred date label for a message group.
// Accepts either an ISO string or a Date and formats to "Today",
// "Yesterday", or a short date.

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function shouldShowDivider(currentIso, previousIso) {
  if (!previousIso) return true;
  const cur = startOfDay(currentIso);
  const prev = startOfDay(previousIso);
  return cur !== prev;
}

export default function DateDivider({ iso }) {
  const now = new Date();
  const then = new Date(iso);

  const todayStart = startOfDay(now);
  const thenStart = startOfDay(then);
  const diffDays = Math.round((todayStart - thenStart) / 86400000);

  let label;
  if (diffDays === 0) label = "Today";
  else if (diffDays === 1) label = "Yesterday";
  else if (diffDays < 7)
    label = then.toLocaleDateString(undefined, { weekday: "long" });
  else
    label = then.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: then.getFullYear() === now.getFullYear() ? undefined : "numeric",
    });

  return (
    <div className="my-3 flex items-center justify-center">
      <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-ink-500 shadow-sm">
        {label}
      </span>
    </div>
  );
}
