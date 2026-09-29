import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, UserCircle2, TrendingUp, Award } from "lucide-react";

const STEPS = [
  { icon: UserCircle2, title: "Create a unique learning profile", description: "Set your goals, interests, and preferred study pace.", tone: "brand" },
  { icon: TrendingUp, title: "Track progress across every course", description: "See grades, quiz results, and milestones at a glance.", tone: "gold" },
  { icon: Award, title: "Share achievements and certificates", description: "Build a portfolio of verified skills and certificates.", tone: "gold" },
];

const TONE = {
  brand: { icon: "text-brand-300", ring: "border-brand-400/40" },
  gold:  { icon: "text-accent-300", ring: "border-accent-400/40" },
};

const EASE = [0.22, 1, 0.36, 1];

export default function ProfileCtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="profile"
      className="section-pad relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* LEFT — profile mock card, enters from far left */}
          <motion.div
            initial={{ opacity: 0, x: -140, filter: "blur(8px)" }}
            animate={inView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              <div aria-hidden className="absolute inset-8 rounded-full bg-brand-500/10 blur-[100px]" />
              <div className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-night-700/80 to-night-800/60 p-8 shadow-landing-lg backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-bold text-white shadow-glow-blue">
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
                    { label: "Programming", value: 94, color: "bg-accent-400" },
                  ].map(({ label, value, color }, i) => (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted-300">{label}</span>
                        <span className="font-semibold text-cream-100">{value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-night-900/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${value}%` } : {}}
                          transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: EASE }}
                          className={`h-full rounded-full ${color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — copy + steps, enters from far right */}
          <motion.div
            initial={{ opacity: 0, x: 140, filter: "blur(8px)" }}
            animate={inView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="order-1 lg:order-2"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-300">
              Your account
            </p>
            <h2 className="section-heading-gap text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl">
              Build Your{" "}
              <span className="bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                Learning Profile
              </span>
            </h2>
            <p className="section-sub text-base leading-relaxed text-muted-300">
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
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${t.ring} text-sm font-bold ${t.icon}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-cream-100">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-300">
                        {description}
                      </p>
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
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-7 py-3.5 text-sm font-semibold text-night-900 shadow-glow-gold transition-all hover:shadow-glow-gold-lg"
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