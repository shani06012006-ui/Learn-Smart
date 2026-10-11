import { Trophy, Target, TrendingUp, CheckCircle2 } from "lucide-react";

import { useScrollReveal } from "../../../hooks/useScrollReveal";
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

export default function QuizAnalyticsSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      id="students"
      ref={ref}
      className="relative border-t border-ink-200 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div
            className={
              "order-2 lg:order-1 " +
              (revealed ? "landing-reveal is-visible" : "landing-reveal")
            }
          >
            <MiniPanel className="p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Performance
                </p>
                <MiniBadge tone="success">
                  <TrendingUp size={10} />
                  Up 8%
                </MiniBadge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MiniPanel className="p-3">
                  <Trophy size={14} className="text-brand-500" />
                  <p className="mt-1.5 text-[10px] uppercase tracking-wide text-ink-500">
                    Score
                  </p>
                  <p className="text-base font-semibold text-ink-900">78%</p>
                </MiniPanel>
                <MiniPanel className="p-3">
                  <Target size={14} className="text-brand-500" />
                  <p className="mt-1.5 text-[10px] uppercase tracking-wide text-ink-500">
                    Accuracy
                  </p>
                  <p className="text-base font-semibold text-ink-900">86%</p>
                </MiniPanel>
                <MiniPanel className="p-3">
                  <CheckCircle2 size={14} className="text-brand-500" />
                  <p className="mt-1.5 text-[10px] uppercase tracking-wide text-ink-500">
                    Completed
                  </p>
                  <p className="text-base font-semibold text-ink-900">12</p>
                </MiniPanel>
              </div>

              <div className="mt-3 rounded-lg border border-ink-200 bg-white p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Topic performance
                </p>
                <ul className="flex flex-col gap-2">
                  {TOPICS.map((t) => (
                    <li key={t.name} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-[11px] text-ink-700">
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
                          "w-10 shrink-0 text-right text-[11px] font-semibold " +
                          TONE_TEXT[t.tone]
                        }
                      >
                        {t.percent}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-100/60 px-3 py-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    Recent trend
                  </p>
                  <p className="text-[11px] text-ink-700">
                    Last 7 assessments
                  </p>
                </div>
                <MiniSparkline
                  points={[10, 11, 12, 11, 13, 14, 16]}
                  width={120}
                  height={34}
                />
              </div>
            </MiniPanel>
          </div>

          <div
            className={
              "order-1 lg:order-2 " +
              (revealed
                ? "landing-reveal landing-reveal-delay-1 is-visible"
                : "landing-reveal landing-reveal-delay-1")
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              For students
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Know where you stand.
              <br />
              And exactly what to do next.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-500">
              Every quiz you take feeds a live view of your topic-level
              performance. You&apos;ll see your score, accuracy, completion,
              and which topics are trailing — without waiting for a report card.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              <Bullet label="Per-question review after every quiz" />
              <Bullet label="Topic-wise accuracy across all assessments" />
              <Bullet label="Strength and improvement areas, side by side" />
              <Bullet label="Trend over your last few assessments" />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ label }) {
  return (
    <li className="flex items-start gap-2 text-sm text-ink-700">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
      {label}
    </li>
  );
}
