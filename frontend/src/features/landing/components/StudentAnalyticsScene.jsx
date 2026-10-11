import { Trophy, Target, TrendingUp, CheckCircle2 } from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import {
  MiniPanel,
  MiniProgress,
  MiniSparkline,
  MiniBadge,
} from "./previewParts";

const TOPICS = [
  { name: "Kinematics", percent: 82, tone: "success" },
  { name: "Newton's Laws", percent: 71, tone: "brand" },
  { name: "Free-body Diagrams", percent: 54, tone: "warning" },
  { name: "Projectile Motion", percent: 38, tone: "danger" },
];

const TONE_BAR = {
  success: "bg-success-500",
  brand: "bg-brand-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
};

const TONE_TEXT = {
  success: "text-success-700",
  brand: "text-brand-700",
  warning: "text-warning-700",
  danger: "text-danger-700",
};

export default function StudentAnalyticsScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="students"
      eyebrow="For students"
      title="Know where you stand."
      subtitle="Every quiz you take feeds a live view of your topic-level performance."
      full
    >
      <div ref={ref} className="mx-auto max-w-5xl">
        <MiniPanel className="p-4 shadow-xl md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Performance
            </p>
            <MiniBadge tone="success">
              <TrendingUp size={10} />
              Up 8% this month
            </MiniBadge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniPanel className="p-3 md:p-4">
              <Trophy size={16} className="text-brand-500" />
              <p className="mt-2 text-[10px] uppercase tracking-wide text-ink-500">
                Score
              </p>
              <p className="text-xl font-semibold text-ink-900 md:text-2xl">78%</p>
            </MiniPanel>
            <MiniPanel className="p-3 md:p-4">
              <Target size={16} className="text-brand-500" />
              <p className="mt-2 text-[10px] uppercase tracking-wide text-ink-500">
                Accuracy
              </p>
              <p className="text-xl font-semibold text-ink-900 md:text-2xl">86%</p>
            </MiniPanel>
            <MiniPanel className="p-3 md:p-4">
              <CheckCircle2 size={16} className="text-brand-500" />
              <p className="mt-2 text-[10px] uppercase tracking-wide text-ink-500">
                Completed
              </p>
              <p className="text-xl font-semibold text-ink-900 md:text-2xl">12</p>
            </MiniPanel>
          </div>

          <div className="mt-4 rounded-lg border border-ink-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Topic performance
            </p>
            <ul className="flex flex-col gap-3">
              {TOPICS.map((t, i) => (
                <li
                  key={t.name}
                  className={
                    "flex items-center gap-3 transition-all duration-700 " +
                    (revealed
                      ? "translate-x-0 opacity-100"
                      : "translate-x-3 opacity-0")
                  }
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <span className="w-28 shrink-0 truncate text-xs text-ink-700 sm:w-40">
                    {t.name}
                  </span>
                  <span className="flex-1">
                    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <span
                        className={
                          "block h-full rounded-full landing-progress " +
                          TONE_BAR[t.tone]
                        }
                        style={{ width: `${t.percent}%` }}
                      />
                    </span>
                  </span>
                  <span
                    className={
                      "w-10 shrink-0 text-right text-xs font-semibold " +
                      TONE_TEXT[t.tone]
                    }
                  >
                    {t.percent}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-ink-100/60 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                Recent trend
              </p>
              <p className="text-xs text-ink-700">Last 7 assessments</p>
            </div>
            <MiniSparkline
              points={[10, 11, 12, 11, 13, 14, 16]}
              width={140}
              height={40}
            />
          </div>
        </MiniPanel>
      </div>
    </LearningScene>
  );
}
