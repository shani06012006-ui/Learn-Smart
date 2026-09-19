import { useNavigate, useLocation } from "react-router-dom";

import Avatar from "../../../components/ui/Avatar";
import { formatRelativeShort } from "../../../utils/formatters";

// Map a notification's `target` object to a URL, given the current role
// prefix. Kept as a small function here (not a URL string on the backend)
// so future notification kinds can be added without touching the API.
function targetUrl(target, prefix) {
  if (!target) return `${prefix}`;
  switch (target.kind) {
    case "chat_thread":
      return `${prefix}/chat/${target.thread_id}`;
    case "announcement":
      return `${prefix}/announcements?class=${target.class_id}`;
    case "material":
      return `${prefix}/materials?class=${target.class_id}`;
    case "quiz":
      return `${prefix}/quizzes/${target.quiz_id}`;
    case "live_class":
      // Teachers land on their list page; students land on the session.
      // (Teacher-side notifications for live classes are rare — they're
      // the creator — but this keeps the routing consistent.)
      return prefix === "/teacher"
        ? `${prefix}/live-classes`
        : `${prefix}/live-classes/${target.live_class_id}`;
    default:
      return `${prefix}`;
  }
}

export default function NotificationItem({ notification, onRead }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith("/teacher") ? "/teacher" : "/student";
  const unread = !notification.read_at;

  const handleClick = async () => {
    try {
      await onRead?.(notification.id);
    } catch {
      // swallow — navigation still proceeds
    }
    navigate(targetUrl(notification.target, prefix));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "focus-ring group relative flex w-full items-start gap-3 border-b border-ink-200 px-4 py-3 text-left transition-colors last:border-b-0 " +
        (unread
          ? "bg-brand-50/50 hover:bg-brand-50"
          : "bg-white hover:bg-ink-100/60")
      }
    >
      {unread && (
        <span
          className="absolute inset-y-0 left-0 w-0.5 bg-brand-500"
          aria-hidden="true"
        />
      )}

      <Avatar
        userId={notification.sender_id}
        initials={notification.sender_initials}
        size="md"
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={
              "truncate text-sm " +
              (unread ? "font-semibold text-ink-900" : "font-medium text-ink-900")
            }
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[11px] text-ink-500">
            {formatRelativeShort(notification.created_at)}
          </span>
        </div>

        {notification.body && (
          <p
            className={
              "mt-0.5 line-clamp-2 text-xs leading-relaxed " +
              (unread ? "text-ink-700" : "text-ink-500")
            }
          >
            {notification.body}
          </p>
        )}
      </div>
    </button>
  );
}

