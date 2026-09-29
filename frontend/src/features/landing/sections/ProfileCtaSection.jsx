import { Link } from "react-router-dom";
import { ArrowRight, UserCircle2, TrendingUp, Award } from "lucide-react";
import Reveal from "../components/Reveal";

const STEPS = [
  { icon: UserCircle2, title: "Create a unique learning profile", description: "Set your goals, interests, and preferred study pace.", tone: "brand" },
  { icon: TrendingUp, title: "Track progress across every course", description: "See grades, quiz results, and milestones at a glance.", tone: "accent" },
  { icon: Award, title: "Share achievements and certificates", description: "Build a portfolio of verified skills and certificates.", tone: "gold" },
];

const TONE = {
  brand: { icon: "text-brand-300", ring: "border-brand-400/40", glow: "shadow-glow-teal" },
  accent: { icon: "text-accent-300", ring: "border-accent-400/40", glow: "shadow-glow-coral" },
  gold: { icon: "text-gold-300", ring: "border-gold-400/40", glow: "shadow-glow-gold" },
};

export default function ProfileCtaSection() {
  return (
    <section id="profile" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — profile mock */}
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative">
              <div aria-hidden className="absolute inset-8 rounded-full bg-brand-500/15 blur-[100px]" />
              <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-night-700/80 to-night-800/60 p-8 shadow-landing-lg backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-bold text-night-900 shadow-glow-teal">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-cream-100">Anita Iyer</p>
                    <p className="text-xs text-muted-400">Student · Grade 10</p>
                  </div>
                  <span className="rounded-full bg-brand-400/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-300 ring-1 ring-brand-400/30">
                    Pro
                  </span>
                </div>

                <div className="mt-7 space-y-4">
                  {[
                    { label: "Physics", value: 82, color: "bg-brand-400" },
                    { label: "Mathematics", value: 67, color: "bg-accent-400" },
                    { label: "Programming", value: 94, color: "bg-gold-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted-300">{label}</span>
                        <span className="font-semibold text-cream-100">{value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-night-900/60">
                        <div
                          className={`h-full rounded-full ${color} shadow-glow-teal`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* RIGHT — copy + steps */}
          <Reveal delay={0.15} className="order-1 lg:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-300">
              Your account
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl md:text-5xl">
              Build Your{" "}
              <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">
                Learning Profile
              </span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-300">
              Everything you learn — captured, organized, and shareable.
            </p>

            <ul className="mt-10 space-y-6">
              {STEPS.map(({ icon: Icon, title, description, tone }, idx) => {
                const t = TONE[tone];
                return (
                  <li key={title} className="flex items-start gap-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${t.ring} ${t.glow} text-sm font-bold ${t.icon}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-cream-100">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-300">
                        {description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              to="/register"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-glow-coral transition-all hover:shadow-glow-coral-lg"
            >
              Create my profile
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}