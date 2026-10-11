import { Bell, CheckCheck } from "lucide-react";

import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../../store/api/notificationsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import EmptyState from "../../../components/feedback/EmptyState";
import NotificationItem from "./NotificationItem";

export default function NotificationPanel({ onNavigate }) {
  const { data: notifications, isLoading, isError, error, refetch } =
    useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsReadMutation();

  const list = notifications || [];
  const unreadCount = list.filter((n) => !n.read_at).length;

  const handleMarkRead = async (notificationId) => {
    try {
      await markRead(notificationId).unwrap();
    } catch {
      // best-effort
    }
    onNavigate?.();
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
    } catch {
      // no-op
    }
  };

  return (
    <div className="flex max-h-[70vh] flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-ink-300 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
          {unreadCount > 0 && (
            <span
              className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"
              aria-label={`${unreadCount} unread`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isMarkingAll}
            className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={12} />
            Mark all as read
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4">
            <LoadingState label="Loading notifications..." />
          </div>
        )}

        {isError && (
          <div className="p-4">
            <ErrorState
              message={extractErrorMessage(error)}
              onRetry={refetch}
            />
          </div>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <div className="p-4">
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              description="New notifications will show up here."
            />
          </div>
        )}

        {!isLoading && !isError && list.length > 0 && (
          <ul className="flex flex-col">
            {list.map((n) => (
              <li key={n.id}>
                <NotificationItem notification={n} onRead={handleMarkRead} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
