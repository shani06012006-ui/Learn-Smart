import { Trophy, Flame, Target, Star } from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import { MiniPanel } from "./previewParts";

export default function AchievementPreview() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="level-up"
      eyebrow="Progress"
      title="Level up as you learn."
      subtitle="Progress rings, streaks, and achievements make the next step worth taking."
      full
    >
      <div ref={ref} className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {/* Progress ring */}
        <MiniPanel
          className={
            "flex flex-col items-center gap-3 p-6 text-center transition-all duration-700 " +
            (revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")
          }
        >
          <ProgressRing value={78} />
          <p className="text-sm font-semibold text-ink-900">Overall progress</p>
          <p className="text-xs text-ink-500">Up 8% this month</p>
        </MiniPanel>

        {/* Streak */}
        <MiniPanel
          className={
            "flex flex-col items-center gap-3 p-6 text-center transition-all duration-700 " +
            (revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")
          }
          style={{ transitionDelay: "200ms" }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning-50">
            <Flame size={36} className="text-warning-500" />
          </div>
          <p className="text-2xl font-semibold text-ink-900">12 days</p>
          <p className="text-xs text-ink-500">Learning streak</p>
        </MiniPanel>

        {/* Achievement badge */}
        <MiniPanel
          className={
            "flex flex-col items-center gap-3 p-6 text-center transition-all duration-700 " +
            (revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")
          }
          style={{ transitionDelay: "400ms" }}
        >
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
              <Trophy size={36} className="text-brand-600" />
            </div>
            <Star
              size={16}
              className="landing-star absolute -right-1 -top-1 text-warning-500"
            />
          </div>
          <p className="text-sm font-semibold text-ink-900">Motion Master</p>
          <p className="text-xs text-ink-500">Latest badge earned</p>
        </MiniPanel>
      </div>

      {/* Next milestone hint */}
      <div
        className={
          "mx-auto mt-8 max-w-3xl rounded-2xl border border-brand-200 bg-brand-50/60 p-5 transition-all duration-700 " +
          (revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")
        }
        style={{ transitionDelay: "600ms" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-600">
            <Target size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              Next milestone · Complete 3 more quizzes in Physics
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              You&apos;re 2 quizzes away from unlocking &quot;Problem Solver&quot;.
            </p>
          </div>
        </div>
      </div>
    </LearningScene>
  );
}

function ProgressRing({ value = 78 }) {
  const radius = 36;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 96 96"
        aria-hidden="true"
      >
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgb(226 232 240)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgb(99 102 241)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="landing-ring"
        />
      </svg>
      <span className="text-lg font-semibold text-ink-900">{value}%</span>
    </div>
  );
}
