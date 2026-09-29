import {
  BookOpen, Video, BarChart3, Award, Sparkles, MessageSquare,
} from "lucide-react";
import Reveal from "../components/Reveal";
import TiltCard from "../components/TiltCard";

const FEATURES = [
  { icon: BookOpen, title: "Course Library", description: "Over 1,000 ready-to-learn classes across every subject and level.", tone: "brand" },
  { icon: Video, title: "Live Interactive Sessions", description: "Real-time classes with expert teachers, joinable from any device.", tone: "accent" },
  { icon: BarChart3, title: "Progress Tracking", description: "Every quiz, every grade, every milestone — visible in one place.", tone: "gold" },
  { icon: Award, title: "Verified Certificates", description: "Shareable certificates on completion, recognized by institutions.", tone: "brand" },
  { icon: Sparkles, title: "AI Learning Paths", description: "Personalized study plans that adapt to your pace and strengths.", tone: "accent" },
  { icon: MessageSquare, title: "Discussion Forums", description: "Ask questions, share insights, and learn alongside your peers.", tone: "gold" },
];

const TONES = {
  brand: {
    icon: "bg-brand-400/15 text-brand-300 ring-brand-400/30",
    hover: "group-hover:bg-brand-400 group-hover:text-night-900 group-hover:shadow-glow-teal",
    line: "bg-brand-400",
  },
  accent: {
    icon: "bg-accent-400/15 text-accent-300 ring-accent-400/30",
    hover: "group-hover:bg-accent-400 group-hover:text-night-900 group-hover:shadow-glow-coral",
    line: "bg-accent-400",
  },
  gold: {
    icon: "bg-gold-400/15 text-gold-300 ring-gold-400/30",
    hover: "group-hover:bg-gold-400 group-hover:text-night-900 group-hover:shadow-glow-gold",
    line: "bg-gold-400",
  },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-300">
            Everything you need
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl md:text-5xl">
            We Are Providing Many{" "}
            <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">
              Features
            </span>{" "}
            You Can Use
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-300">
            A complete learning platform that brings courses, live sessions, progress, and community into one place.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, tone }, i) => {
            const t = TONES[tone];
            return (
              <Reveal key={title} delay={i * 0.06}>
                <TiltCard className="group h-full">
                  <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-night-700/80 to-night-800/60 p-6 shadow-landing backdrop-blur-sm transition-all duration-300 hover:border-white/[0.15]">
                    {/* top accent line */}
                    <div className={`absolute inset-x-0 top-0 h-px ${t.line} opacity-40 transition-opacity group-hover:opacity-100`} />

                    <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${t.icon} transition-all duration-300 ${t.hover}`}>
                      <Icon size={22} strokeWidth={2.2} />
                    </div>
                    <h3 className="text-lg font-semibold text-cream-100">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-300">
                      {description}
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}