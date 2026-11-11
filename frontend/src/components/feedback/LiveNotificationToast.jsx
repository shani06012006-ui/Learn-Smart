// frontend/src/components/feedback/LiveNotificationToast.jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";

export default function LiveNotificationToast({ latest }) {
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!latest) return undefined;
    setShown(latest);
    const timer = setTimeout(() => setShown(null), 5000);
    return () => clearTimeout(timer);
  }, [latest]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed right-6 top-20 z-[130] flex w-80 items-start gap-3 rounded-2xl border border-purple-100 bg-white p-4 shadow-elevated-lg"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Bell size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-navy-950">{shown.title}</p>
            {shown.body && (
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{shown.body}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShown(null)}
            className="text-slate-400 hover:text-navy-950"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}