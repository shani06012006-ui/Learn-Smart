import { NavLink, useLocation } from "react-router-dom";

function formatRelativeTime(iso) {
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
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ThreadListItem({ thread, isActive }) {
  const location = useLocation();
  const prefix = location.pathname.startsWith("/teacher") ? "/teacher" : "/student";
  const unread = thread.unread_count > 0;

  return (
    <NavLink
      to={`${prefix}/chat/${thread.id}`}
      className={
        "flex items-start gap-3 border-b border-ink-200 px-3 py-3 transition-colors " +
        (isActive ? "bg-brand-50" : "hover:bg-ink-100/60")
      }
    >
      <div
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold " +
          (thread.kind === "group"
            ? "bg-brand-100 text-brand-700"
            : "bg-ink-100 text-ink-700")
        }
      >
        {thread.initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={
              "truncate text-sm " +
              (unread ? "font-semibold text-ink-900" : "font-medium text-ink-900")
            }
          >
            {thread.title}
          </p>
          <span className="shrink-0 text-xs text-ink-500">
            {formatRelativeTime(thread.last_message?.created_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={
              "truncate text-xs " +
              (unread ? "font-medium text-ink-700" : "text-ink-500")
            }
          >
            {thread.last_message
              ? `${thread.last_message.sender_name.split(" ")[0]}: ${thread.last_message.body}`
              : "No messages yet"}
          </p>
          {unread && (
            <span className="shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {thread.unread_count}
            </span>
          )}
        </div>
      </div>
    </NavLink>
  );
}
