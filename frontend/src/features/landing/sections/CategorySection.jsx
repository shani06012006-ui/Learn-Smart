import { ArrowRight, FlaskConical, Calculator, Languages, Code2 } from "lucide-react";
import Reveal from "../components/Reveal";
import TiltCard from "../components/TiltCard";

const CATEGORIES = [
  { icon: FlaskConical, name: "Science & Engineering", courses: 120, tone: "brand" },
  { icon: Calculator, name: "Mathematics", courses: 85, tone: "accent" },
  { icon: Languages, name: "Languages", courses: 60, tone: "gold" },
  { icon: Code2, name: "Programming & Tech", courses: 150, tone: "brand" },
];

const TONES = {
  brand: {
    iconBg: "bg-brand-400/15 text-brand-300 ring-brand-400/30",
    glow: "group-hover:shadow-glow-teal",
    link: "text-brand-300",
  },
  accent: {
    iconBg: "bg-accent-400/15 text-accent-300 ring-accent-400/30",
    glow: "group-hover:shadow-glow-coral",
    link: "text-accent-300",
  },
  gold: {
    iconBg: "bg-gold-400/15 text-gold-300 ring-gold-400/30",
    glow: "group-hover:shadow-glow-gold",
    link: "text-gold-300",
  },
};

export default function CategorySection() {
  return (
    <section id="categories" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-300">
            Browse by subject
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl md:text-5xl">
            Choose the{" "}
            <span className="bg-gradient-to-r from-accent-300 to-gold-300 bg-clip-text text-transparent">
              Category
            </span>{" "}
            You Want
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-300">
            Explore courses across the disciplines you care about.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, name, courses, tone }, i) => {
            const t = TONES[tone];
            return (
              <Reveal key={name} delay={i * 0.07}>
                <TiltCard className="group h-full">
                  <button
                    type="button"
                    className={`flex h-full w-full flex-col items-start gap-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-night-700/80 to-night-800/60 p-5 text-left shadow-landing backdrop-blur-sm transition-all duration-300 hover:border-white/[0.15] ${t.glow}`}
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${t.iconBg}`}>
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold leading-snug text-cream-100 sm:text-base">
                        {name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-400">{courses} courses</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.link} opacity-0 transition-opacity group-hover:opacity-100`}>
                      Explore <ArrowRight size={12} />
                    </span>
                  </button>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}