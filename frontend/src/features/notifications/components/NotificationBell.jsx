import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import { useGetNotificationsQuery } from "../../../store/api/notificationsApi";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const { data: notifications } = useGetNotificationsQuery();
  const unreadCount = (notifications || []).filter((n) => !n.read_at).length;
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  useEffect(() => {
    if (!open) return undefined;

    const handleClick = (e) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-ink-100"
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-[22rem] overflow-hidden rounded-xl border border-ink-300 bg-white shadow-xl sm:w-[24rem]"
        >
          <NotificationPanel onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
