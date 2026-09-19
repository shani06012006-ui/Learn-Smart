import { NavLink, useLocation } from "react-router-dom";

import Avatar from "../../../components/ui/Avatar";
import { formatRelativeShort } from "../../../utils/formatters";

export default function ThreadListItem({ thread, isActive, currentUserId }) {
  const location = useLocation();
  const prefix = location.pathname.startsWith("/teacher") ? "/teacher" : "/student";
  const unread = thread.unread_count > 0;
  const unreadLabel = thread.unread_count > 9 ? "9+" : String(thread.unread_count);

  let preview = "No messages yet";
  if (thread.last_message) {
    const isOwnLast = thread.last_message.sender_id === currentUserId;
    const senderLabel = isOwnLast
      ? "You"
      : thread.last_message.sender_name.split(" ")[0];
    preview = `${senderLabel}: ${thread.last_message.body}`;
  }

  return (
    <NavLink
      to={`${prefix}/chat/${thread.id}`}
      className={
        "flex items-start gap-3 border-b border-ink-200 px-3 py-3 transition-colors " +
        (isActive ? "bg-brand-50" : "hover:bg-ink-100/60")
      }
    >
      <Avatar
        userId={thread.id}
        initials={thread.initials}
        size="lg"
        neutral={thread.kind === "group"}
      />

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
            {formatRelativeShort(thread.last_message?.created_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={
              "truncate text-xs " +
              (unread ? "font-medium text-ink-700" : "text-ink-500")
            }
          >
            {preview}
          </p>
          {unread && (
            <span className="shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadLabel}
            </span>
          )}
        </div>
      </div>
    </NavLink>
  );
}
