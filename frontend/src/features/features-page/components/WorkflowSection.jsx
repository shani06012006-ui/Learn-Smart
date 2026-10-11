import {
  UserPlus,
  BookOpen,
  PenLine,
  BarChart3,
  TrendingUp,
} from "lucide-react";

// Horizontal workflow rail on desktop, stacked on mobile. Background is a
// tinted band so the section reads as a distinct "moment" between the
// student/teacher blocks and the recommendations section.

const STEPS = [
  {
    icon: UserPlus,
    label: "Join",
    body: "A student redeems a teacher's joining code and lands in the class.",
  },
  {
    icon: BookOpen,
    label: "Learn",
    body: "Materials and announcements flow from the class into the student's view.",
  },
  {
    icon: PenLine,
    label: "Practice",
    body: "Quizzes are taken with per-question marks. Submissions are recorded automatically.",
  },
  {
    icon: BarChart3,
    label: "Assess",
    body: "Topic-level accuracy, completion rate, and class averages update from the results.",
  },
  {
    icon: TrendingUp,
    label: "Improve",
    body: "Weak topics surface as recommendations for the student and the teacher.",
  },
];

export default function WorkflowSection() {
  return (
    <section className="border-t border-ink-200 bg-brand-50/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            How the loop works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
            One loop, five steps.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500 md:text-lg">
            Each step feeds the next. The data a quiz produces is the same
            data that drives what comes after it -- nothing is entered twice.
          </p>
        </header>

        {/* Desktop: horizontal rail */}
        <div className="mt-16 hidden lg:block">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-7 h-px bg-brand-200"
            />
            <ol className="relative grid grid-cols-5 gap-6">
              {STEPS.map((step, i) => (
                <Step key={step.label} step={step} index={i} />
              ))}
            </ol>
          </div>
        </div>

        {/* Mobile / tablet: stacked */}
        <ol className="mt-12 flex flex-col gap-6 lg:hidden">
          {STEPS.map((step, i) => (
            <Step key={step.label} step={step} index={i} compact />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({ step, index, compact = false }) {
  const Icon = step.icon;
  return (
    <li className={compact ? "flex items-start gap-4" : "flex flex-col items-center text-center"}>
      <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white shadow-lg">
        <Icon size={20} />
      </div>
      <div className={compact ? "min-w-0 flex-1" : "mt-4"}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          Step {String(index + 1).padStart(2, "0")}
        </p>
        <p className="mt-0.5 text-base font-semibold text-ink-900">
          {step.label}
        </p>
        <p className={"mt-1 text-sm leading-relaxed text-ink-500 " + (compact ? "" : "mx-auto max-w-[16rem]")}>
          {step.body}
        </p>
      </div>
    </li>
  );
}
