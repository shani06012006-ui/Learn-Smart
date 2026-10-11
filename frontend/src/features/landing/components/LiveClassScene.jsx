import { useEffect, useState } from "react";
import { Video, Calendar, Clock } from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import Badge from "../../../components/ui/Badge";
import {
  MiniPanel,
  MiniAvatar,
  MiniBadge,
} from "./previewParts";

export default function LiveClassScene() {
  const { ref, revealed } = useSceneReveal();
  const [seconds, setSeconds] = useState(2 * 3600 + 48 * 60); // 2h 48m

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <LearningScene
      id="live-class"
      eyebrow="Live classes"
      title="Schedule a session. Students see it instantly."
      subtitle="Live sessions are scheduled per class. Every enrolled student gets a notification and can join from their dashboard."
      full
    >
      <div ref={ref} className="mx-auto max-w-3xl">
        <div
          className={
            "space-y-3 transition-all duration-700 " +
            (revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")
          }
        >
          {/* Live now */}
          <MiniPanel className="p-4 shadow-lg md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant="success" dot>
                    Live now
                  </Badge>
                  <span className="text-[10px] text-ink-500">
                    Started 5 min ago
                  </span>
                </div>
                <p className="truncate text-sm font-semibold text-ink-900 md:text-base">
                  Newton&apos;s Laws — Problem Solving
                </p>
                <p className="text-[11px] text-ink-500 md:text-xs">
                  Grade 10 Physics · 45 min
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                Join now
              </span>
            </div>
          </MiniPanel>

          {/* Upcoming with countdown */}
          <MiniPanel className="p-4 shadow-lg md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant="brand" dot>
                    Upcoming
                  </Badge>
                  <span className="text-[10px] text-ink-500">Starts in</span>
                </div>
                <p className="truncate text-sm font-semibold text-ink-900 md:text-base">
                  Mid-term Revision
                </p>
                <p className="text-[11px] text-ink-500 md:text-xs">
                  Grade 10 Physics · 60 min
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={10} />
                    Wed, 24 Sept
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={10} />
                    18:00
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="font-mono text-lg font-semibold tracking-widest text-brand-700 tabular-nums md:text-xl">
                  {hh}:{mm}:{ss}
                </div>
                <button
                  type="button"
                  className="rounded-md border border-ink-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700"
                >
                  Join
                </button>
              </div>
            </div>
          </MiniPanel>

          {/* Teacher + meeting link row */}
          <MiniPanel className="p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <MiniAvatar initials="AI" color="bg-success-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink-900">
                  Anita Iyer
                </p>
                <p className="text-[10px] text-ink-500">
                  Teacher · will host this session
                </p>
              </div>
              <MiniBadge tone="neutral">meet.example.com/…</MiniBadge>
            </div>
          </MiniPanel>

          <div className="flex items-center gap-2 px-1 pt-1 text-xs text-ink-500">
            <Video size={12} />
            <span>Powered by the Live Classes module</span>
          </div>
        </div>
      </div>
    </LearningScene>
  );
}
