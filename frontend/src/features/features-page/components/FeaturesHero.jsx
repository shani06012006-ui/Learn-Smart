import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Users,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Bell,
} from "lucide-react";

import Button from "../../../components/ui/Button";

// Asymmetric hero. The right column is a composed abstract visualization
// built from real app UI atoms (avatar chips, progress bars, message rows,
// a quiz card, an insight tile) -- not a screenshot, not stock imagery.
// Every element references a feature that actually exists in the app.

const CAPABILITY_STRIP = [
  { icon: Users, label: "Classes" },
  { icon: BookOpen, label: "Materials" },
  { icon: ClipboardList, label: "Quizzes" },
  { icon: MessageSquare, label: "Messages" },
  { icon: Bell, label: "Notifications" },
];

export default function FeaturesHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background: soft brand radial + faint grid, distinct from the
          landing page hero which uses a two-orb composition. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="landing-grid absolute inset-0 opacity-[0.25]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-28 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* LEFT -- copy */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-700 shadow-sm backdrop-blur">
              <Sparkles size={12} className="text-brand-500" />
              Product Features
            </p>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              The whole classroom,
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
              Classes, materials, quizzes, performance, and conversations --
              joined together so teachers can see where to help and students
              know what to do next.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button size="lg">
                  Get started
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Capability strip -- exact app terminology, no invented names. */}
            <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-ink-500">
              {CAPABILITY_STRIP.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon size={13} className="text-brand-500" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT -- abstract composition */}
          <HeroComposition />
        </div>
      </div>
    </section>
  );
}

// A layered, spatially-composed visualization: a primary card (class
// overview) with secondary cards offset around it. Not interactive, purely
// visual, but built from real UI atoms so it reads as "the actual app"
// rather than "generic SaaS illustration."
function HeroComposition() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Glow behind the composition */}
      <div
        aria-hidden="true"
        className="absolute inset-8 rounded-[3rem] bg-brand-200/40 blur-3xl"
      />

      <div className="relative">
        {/* Primary card -- class summary */}
        <div className="relative z-10 rounded-2xl border border-ink-200 bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Users size={15} />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink-900">
                  Grade 10 Physics
                </p>
                <p className="text-[10px] text-ink-500">12 students -- 4 quizzes</p>
              </div>
            </div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              Active
            </span>
          </div>

          <div className="space-y-3">
            <MiniBar label="Kinematics" percent={82} tone="success" />
            <MiniBar label="Newton's Laws" percent={71} tone="brand" />
            <MiniBar label="Projectile Motion" percent={38} tone="danger" />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50/60 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={11} className="text-brand-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                Recommendation
              </p>
            </div>
            <p className="truncate text-[11px] text-ink-700">
              Reinforce Projectile Motion
            </p>
          </div>
        </div>

        {/* Floating card -- message bubble */}
        <div className="absolute -left-4 -top-6 z-20 hidden w-56 rounded-xl border border-ink-200 bg-white p-3 shadow-lg sm:block">
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
              AI
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-ink-900">
                Anita Iyer
              </p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ink-500">
                Bring your notebook tomorrow -- we&apos;ll work through examples.
              </p>
            </div>
          </div>
        </div>

        {/* Floating card -- quiz tile */}
        <div className="absolute -right-4 top-24 z-20 hidden w-44 rounded-xl border border-ink-200 bg-white p-3 shadow-lg sm:block">
          <div className="mb-1.5 flex items-center gap-1.5">
            <ClipboardList size={12} className="text-brand-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
              Quiz ready
            </p>
          </div>
          <p className="text-[11px] font-semibold text-ink-900">
            Newton&apos;s Laws -- Short Check
          </p>
          <p className="mt-0.5 text-[10px] text-ink-500">
            5 questions -- 8 min
          </p>
        </div>

        {/* Floating card -- notification */}
        <div className="absolute -bottom-6 left-8 z-20 hidden w-56 rounded-xl border border-ink-200 bg-white p-3 shadow-lg sm:block">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-700">
              <Bell size={11} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-ink-900">
                New material uploaded
              </p>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-ink-500">
                Motion Practice Problems
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, percent, tone = "brand" }) {
  const TONE = {
    success: "bg-success-500",
    brand: "bg-brand-500",
    danger: "bg-danger-500",
  };
  const TEXT = {
    success: "text-success-700",
    brand: "text-brand-700",
    danger: "text-danger-700",
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-[11px] text-ink-700">
        {label}
      </span>
      <span className="flex-1">
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <span
            className={"block h-full rounded-full " + TONE[tone]}
            style={{ width: `${percent}%` }}
          />
        </span>
      </span>
      <span className={"w-9 shrink-0 text-right text-[10px] font-semibold " + TEXT[tone]}>
        {percent}%
      </span>
    </div>
  );
}
