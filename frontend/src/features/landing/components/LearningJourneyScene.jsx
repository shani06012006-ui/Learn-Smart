import { Users, BookOpen, ClipboardList, BarChart3, TrendingUp } from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import { MiniBadge } from "./previewParts";

const STEPS = [
  { icon: Users, label: "Learn", body: "Join a class and see what's shared." },
  { icon: BookOpen, label: "Practice", body: "Work through materials and notes." },
  { icon: ClipboardList, label: "Quiz", body: "Take a short check with instant scoring." },
  { icon: BarChart3, label: "Analyze", body: "See topic accuracy and trends." },
  { icon: TrendingUp, label: "Improve", body: "Follow the next recommendation." },
];

export default function LearningJourneyScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="journey"
      eyebrow="The learning cycle"
      title="One loop, five steps."
      subtitle="Nothing happens in isolation. Every step feeds the next — the loop ends when the topic is closed."
      full
    >
      <div ref={ref} className="relative">
        {/* Desktop rail */}
        <div className="relative hidden lg:block">
          <div className="absolute left-0 right-0 top-14 h-1 rounded-full bg-ink-200" />
          <div
            className={
              "absolute left-0 top-14 h-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-1000 ease-out " +
              (revealed ? "w-full" : "w-0")
            }
            aria-hidden="true"
          />

          {/* Character marker traveling along the rail */}
          <div
            className={
              "absolute -top-1 z-20 transition-all duration-1000 ease-out " +
              (revealed ? "left-[calc(100%-2rem)]" : "left-0")
            }
            aria-hidden="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white shadow-lg ring-4 ring-white">
              LS
            </div>
          </div>

          <ol className="relative grid grid-cols-5 gap-6">
            {STEPS.map((step, i) => (
              <Step
                key={step.label}
                step={step}
                index={i}
                revealed={revealed}
              />
            ))}
          </ol>
        </div>

        {/* Mobile stacked */}
        <ol className="flex flex-col gap-6 lg:hidden">
          {STEPS.map((step, i) => (
            <Step
              key={step.label}
              step={step}
              index={i}
              revealed={revealed}
              compact
            />
          ))}
        </ol>
      </div>
    </LearningScene>
  );
}

function Step({ step, index, revealed, compact = false }) {
  const Icon = step.icon;
  const delay = index * 150;

  return (
    <li
      className={
        "transition-all duration-700 " +
        (revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")
      }
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={compact ? "flex items-start gap-4" : "flex flex-col items-center text-center"}>
        <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white shadow-lg">
          <Icon size={20} />
        </div>
        <div className={compact ? "min-w-0 flex-1" : "mt-4"}>
          <MiniBadge tone="brand">Step {String(index + 1).padStart(2, "0")}</MiniBadge>
          <p className="mt-2 text-base font-semibold text-ink-900">{step.label}</p>
          <p className="mt-1 max-w-[16rem] text-sm text-ink-500">{step.body}</p>
        </div>
      </div>
    </li>
  );
}
