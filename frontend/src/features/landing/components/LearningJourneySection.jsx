import {
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  TrendingUp,
} from "lucide-react";

import { useScrollReveal } from "../../../hooks/useScrollReveal";

const STEPS = [
  {
    icon: Users,
    label: "Learn",
    body: "Join a class with a teacher-issued code and see the study materials shared with you.",
  },
  {
    icon: BookOpen,
    label: "Practice",
    body: "Work through notes, PDFs, and practice sets uploaded by your teacher.",
  },
  {
    icon: ClipboardList,
    label: "Quiz",
    body: "Take interactive quizzes with immediate scoring — multiple-choice, per-question marks.",
  },
  {
    icon: BarChart3,
    label: "Analyze",
    body: "See accuracy, completion rate, weak topics, and how you're trending over time.",
  },
  {
    icon: TrendingUp,
    label: "Improve",
    body: "Follow targeted recommendations and personal practice until the topic is closed.",
  },
];

export default function LearningJourneySection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative border-t border-ink-200 bg-ink-100/40 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className={revealed ? "landing-reveal is-visible" : "landing-reveal"}>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            How it works
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            A learning cycle that closes the loop.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-500">
            Every feature on Learn-Smart feeds the next. Nothing happens in
            isolation — each step builds on the one before, and the loop only
            ends when the topic is actually learned.
          </p>
        </div>

        <div className="mt-14 hidden lg:block">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-6 h-px bg-ink-300"
            />
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
        </div>

        <ol className="mt-12 flex flex-col gap-6 lg:hidden">
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
    </section>
  );
}

function Step({ step, index, revealed, compact = false }) {
  const Icon = step.icon;
  return (
    <li
      className={
        "landing-reveal " +
        `landing-reveal-delay-${Math.min(index, 3)} ` +
        (revealed ? "is-visible" : "")
      }
    >
      <div className={compact ? "flex items-start gap-4" : "flex flex-col"}>
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-brand-600 shadow-card">
          <Icon size={18} />
        </div>
        <div className={compact ? "min-w-0 flex-1" : "mt-4"}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            Step {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mt-0.5 text-base font-semibold text-ink-900">
            {step.label}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {step.body}
          </p>
        </div>
      </div>
    </li>
  );
}
