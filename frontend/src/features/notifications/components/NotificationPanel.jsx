import { Bell, CheckCheck } from "lucide-react";

import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../../store/api/notificationsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
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
      <header className="flex items-center justify-between border-b border-ink-300 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isMarkingAll}
            className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
          >
            <CheckCheck size={12} />
            Mark all as read
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <LoadingState label="Loading notifications..." />}

        {isError && (
          <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
        )}

        {!isLoading && !isError && list.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <Bell size={28} className="text-ink-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-ink-700">
              You&apos;re all caught up
            </p>
            <p className="text-xs text-ink-500">
              New notifications will show up here.
            </p>
          </div>
        )}

        {!isLoading && !isError && list.length > 0 && (
          <ul>
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
