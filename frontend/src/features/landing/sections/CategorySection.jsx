import { ArrowRight, FlaskConical, Calculator, Languages, Code2 } from "lucide-react";

const CATEGORIES = [
  {
    icon: FlaskConical,
    name: "Science & Engineering",
    courses: 120,
    bg: "bg-accent-50",
    text: "text-accent-600",
  },
  {
    icon: Calculator,
    name: "Mathematics",
    courses: 85,
    bg: "bg-[#E6F0FF]",
    text: "text-[#3B82F6]",
  },
  {
    icon: Languages,
    name: "Languages",
    courses: 60,
    bg: "bg-[#F0E6FF]",
    text: "text-[#8B5CF6]",
  },
  {
    icon: Code2,
    name: "Programming & Tech",
    courses: 150,
    bg: "bg-[#E6FFF5]",
    text: "text-[#10B981]",
  },
];

export default function CategorySection() {
  return (
    <section id="categories" className="bg-ink-100/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
            Browse by subject
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Let&apos;s Help You Choose the Category You Want
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            Explore courses across the disciplines you care about.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, name, courses, bg, text }) => (
            <button
              key={name}
              type="button"
              className="focus-ring group flex flex-col items-start gap-4 rounded-2xl border border-ink-200 bg-white p-5 text-left shadow-landing transition-all duration-200 hover:-translate-y-1 hover:shadow-landing-lg"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${text}`}
              >
                <Icon size={22} />
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold leading-snug text-ink-900 sm:text-base">
                  {name}
                </h3>
                <p className="mt-1 text-xs text-ink-500">{courses} courses</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 opacity-0 transition-opacity group-hover:opacity-100">
                Explore
                <ArrowRight size={12} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}