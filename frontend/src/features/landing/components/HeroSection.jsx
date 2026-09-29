import { Link } from "react-router-dom";
import { Search, ChevronDown, Users, BookOpen, GraduationCap } from "lucide-react";

import Button from "../../../components/ui/Button";
import { useScrollReveal } from "../../../hooks/useScrollReveal";

// Hero image. If the file at /images/student.jpg exists it will be used;
// otherwise the CSS gradient placeholder behind it becomes visible.
const HERO_IMAGE_SRC = "/images/student.jpg";

const STATS = [
  { icon: Users, value: "10,000+", label: "Students" },
  { icon: BookOpen, value: "500+", label: "Courses" },
  { icon: GraduationCap, value: "50+", label: "Teachers" },
];

export default function HeroSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      id="hero"
      ref={ref}
      className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24"
    >
      {/* Soft background wash */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-50/70 via-white to-white" />
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-accent-100/60 blur-3xl" />
        <div className="absolute -right-32 top-32 h-80 w-80 rounded-full bg-accent-100/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* LEFT — copy + search + stats */}
          <div
            className={`lg:col-span-6 landing-reveal ${revealed ? "is-visible" : ""}`}
          >
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-white px-3 py-1 text-xs font-medium text-accent-700 shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-accent-500" />
              AI-Powered · Personalized · Interactive
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              The Home of Your
              <br />
              <span className="text-accent-500">Learning Journey</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
              Find the right courses, track your progress, and learn from expert
              teachers — all in one place.
            </p>

            {/* Search bar */}
            <form
              className="mt-8 flex w-full max-w-xl items-stretch overflow-hidden rounded-full border border-ink-200 bg-white shadow-landing"
              onSubmit={(e) => e.preventDefault()}
            >
              <button
                type="button"
                className="flex shrink-0 items-center gap-1.5 border-r border-ink-200 px-4 text-sm font-medium text-ink-700 hover:bg-ink-100"
              >
                Category
                <ChevronDown size={14} className="text-ink-500" />
              </button>
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="text"
                  placeholder="Search courses, subjects, teachers..."
                  className="h-full w-full bg-transparent pl-10 pr-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 bg-accent-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
              >
                Search
              </button>
            </form>

            {/* Stats pills */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-full border border-ink-200 bg-white px-4 py-2 shadow-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                    <Icon size={14} />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-ink-900">{value}</span>
                    <span className="text-[10px] uppercase tracking-wide text-ink-500">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button size="lg" variant="accent">
                  Get Started
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="secondary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* RIGHT — hero illustration */}
          <div
            className={`lg:col-span-6 landing-reveal landing-reveal-delay-1 ${revealed ? "is-visible" : ""}`}
          >
            <div className="relative mx-auto flex max-w-md justify-center">
              {/* Decorative glow */}
              <div
                aria-hidden="true"
                className="absolute inset-8 rounded-full bg-accent-200/50 blur-3xl"
              />
              {/* Gradient placeholder (shows if image missing) */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-accent-100 via-accent-50 to-white"
              />
              {/* The image itself. If /images/student.jpg doesn't exist, the
                  gradient behind it shows through. */}
              <img
                src={HERO_IMAGE_SRC}
                alt="Student learning"
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="relative z-10 h-auto w-full max-w-sm object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}