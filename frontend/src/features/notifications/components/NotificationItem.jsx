import { useNavigate, useLocation } from "react-router-dom";

import Avatar from "../../../components/ui/Avatar";
import { formatRelativeShort } from "../../../utils/formatters";

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
      // swallow
    }
    navigate(targetUrl(notification.target, prefix));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "focus-ring flex w-full items-start gap-3 border-b border-ink-200 px-4 py-3 text-left transition-colors hover:bg-ink-100/60 " +
        (unread ? "bg-brand-50/40" : "bg-white")
      }
    >
      <Avatar
        userId={notification.sender_id}
        initials={notification.sender_initials}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={
              "truncate text-sm " +
              (unread ? "font-semibold text-ink-900" : "font-medium text-ink-900")
            }
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-ink-500">
            {formatRelativeShort(notification.created_at)}
          </span>
        </div>
        {notification.body && (
          <p
            className={
              "mt-0.5 line-clamp-2 text-xs " +
              (unread ? "text-ink-700" : "text-ink-500")
            }
          >
            {notification.body}
          </p>
        )}
      </div>

      {unread && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600"
          aria-label="Unread"
        />
      )}
    </button>
  );
}
