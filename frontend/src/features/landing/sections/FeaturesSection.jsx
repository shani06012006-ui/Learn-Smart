import {
  BookOpen,
  Video,
  BarChart3,
  Award,
  Sparkles,
  MessageSquare,
} from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Course Library",
    description:
      "Over 1,000 ready-to-learn classes across every subject and level.",
  },
  {
    icon: Video,
    title: "Live Interactive Sessions",
    description:
      "Real-time classes with expert teachers, joinable from any device.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Every quiz, every grade, every milestone — visible in one place.",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description:
      "Shareable certificates on completion, recognized by institutions.",
  },
  {
    icon: Sparkles,
    title: "AI Learning Paths",
    description:
      "Personalized study plans that adapt to your pace and strengths.",
  },
  {
    icon: MessageSquare,
    title: "Discussion Forums",
    description:
      "Ask questions, share insights, and learn alongside your peers.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
            Everything you need
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            We Are Providing Many Features You Can Use
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            A complete learning platform that brings courses, live sessions,
            progress, and community into a single place.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-ink-200 bg-white p-6 shadow-landing transition-all duration-200 hover:-translate-y-1 hover:shadow-landing-lg"
            >
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors group-hover:bg-accent-500 group-hover:text-white">
                <Icon size={22} />
              </span>
              <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}