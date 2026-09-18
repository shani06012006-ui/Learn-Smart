import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

function formatRemaining(sec) {
  if (sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function QuizTimer({ durationMinutes, onExpire }) {
  const totalSec = useMemo(
    () => Math.max(0, Math.floor(durationMinutes * 60)),
    [durationMinutes]
  );
  const [remaining, setRemaining] = useState(totalSec);
  const expiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpire?.();
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const isWarning = remaining <= 60;

  return (
    <div
      className={
        "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium " +
        (isWarning
          ? "border-danger-500 bg-danger-50 text-danger-700"
          : "border-ink-300 bg-white text-ink-700")
      }
    >
      <Clock size={16} />
      <span className="font-mono tabular-nums">{formatRemaining(remaining)}</span>
      <span className="text-xs font-normal text-ink-500">remaining</span>
    </div>
  );
}
