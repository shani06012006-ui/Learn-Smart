import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

/**
 * NotificationBell -- placeholder for the notification centre.
 *
 * Shows a bell icon in the top nav. Clicking it opens a small popover
 * that says "No notifications yet." Real notification data (from the
 * backend) will be wired in a later batch.
 *
 * Kept minimal on purpose: the component exists so that Navbar.jsx can
 * import it, and so future notification work has a stable home.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring relative rounded-lg p-2 text-ink-700 transition hover:bg-ink-100"
        aria-label="Notifications"
      >
        <Bell size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-bold text-navy-950">Notifications</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <p className="py-6 text-center text-xs text-slate-400">
            No notifications yet.
          </p>
        </div>
      )}
    </div>
  );
}
