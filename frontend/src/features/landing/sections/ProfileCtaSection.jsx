import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, UserCircle2, TrendingUp, Award, Play, Check } from "lucide-react";

const STEPS = [
  { icon: UserCircle2, title: "Create a unique learning profile",   description: "Set your goals, interests, and preferred study pace.", tone: "brand" },
  { icon: TrendingUp,  title: "Track progress across every course", description: "See grades, quiz results, and milestones at a glance.", tone: "peach" },
  { icon: Award,       title: "Share achievements and certificates", description: "Build a portfolio of verified skills and certificates.", tone: "mint" },
];

const TONE = {
  brand: { icon: "text-brand-600",  ring: "border-brand-200 bg-brand-50" },
  peach: { icon: "text-accent-600", ring: "border-accent-200 bg-accent-50" },
  mint:  { icon: "text-mint-600",   ring: "border-mint-400/30 bg-mint-400/10" },
};

const EASE = [0.22, 1, 0.36, 1];

export default function ProfileCtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [demoActive, setDemoActive] = useState(false);

  // values used by the bars
  const bars = [
    { label: "Physics",     base: 82, color: "bg-brand-500"  },
    { label: "Mathematics", base: 67, color: "bg-accent-500" },
    { label: "Programming", base: 94, color: "bg-mint-500"   },
  ];

  return (
    <section ref={ref} id="profile" className="section-pad relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* LEFT — profile mock */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              <div aria-hidden className="absolute inset-8 rounded-full bg-brand-100/60 blur-[90px]" />
              <div className="relative rounded-3xl border border-ink-200 bg-white p-8 shadow-landing-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">Anita Iyer</p>
                    <p className="text-xs text-ink-500">Student · Grade 10</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
                    Pro
                  </span>
                </div>

                <div className="mt-7 space-y-4">
                  {bars.map(({ label, base, color }, i) => {
                    const value = demoActive ? Math.min(base + 6, 100) : base;
                    return (
                      <div key={label}>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-ink-600">{label}</span>
                          <motion.span
                            key={value}
                            initial={{ opacity: 0.5, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="font-semibold text-ink-900 tabular-nums"
                          >
                            {value}%
                          </motion.span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={inView ? { width: `${value}%` } : {}}
                            transition={{ duration: 1, delay: 0.4 + i * 0.15, ease: EASE }}
                            className={`h-full rounded-full ${color}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live demo button */}
                <button
                  type="button"
                  onClick={() => {
                    setDemoActive(false);
                    requestAnimationFrame(() => setDemoActive(true));
                  }}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-paper-100 py-2.5 text-xs font-semibold text-ink-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {demoActive ? (
                      <motion.span
                        key="done"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="inline-flex items-center gap-2"
                      >
                        <Check size={14} /> Progress updated
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="inline-flex items-center gap-2"
                      >
                        <Play size={12} /> Try a lesson
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — copy + steps */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="order-1 lg:order-2"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-600">
              Your account
            </p>
            <h2 className="section-heading-gap text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Build Your{" "}
              <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
                Learning Profile
              </span>
            </h2>
            <p className="section-sub text-base leading-relaxed text-ink-500">
              Everything you learn — captured, organized, and shareable.
            </p>

            <ul className="mt-8 space-y-5">
              {STEPS.map(({ icon: Icon, title, description, tone }, idx) => {
                const t = TONE[tone];
                return (
                  <motion.li
                    key={title}
                    initial={{ opacity: 0, x: 40 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.5 + idx * 0.12, ease: EASE }}
                    className="flex items-start gap-4"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${t.ring} text-sm font-bold ${t.icon}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-ink-900">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
            >
              <Link
                to="/register"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-glow-peach transition-all hover:bg-accent-600"
              >
                Create my profile
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}