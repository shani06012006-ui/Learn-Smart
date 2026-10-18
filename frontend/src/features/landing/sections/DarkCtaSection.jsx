// frontend/src/features/landing/sections/DarkCtaSection.jsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  Flame,
  Users,
  CheckCircle2,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const PATHS = [
  {
    role: "Student",
    icon: BookOpen,
    tone: "emerald",
    tagline: "Join your class, take quizzes, build your streak.",
    features: ["Join with a class code", "AI-generated quizzes", "Streaks & badges"],
    cta: "Start as student",
    href: "/student-login",
  },
  {
    role: "Teacher",
    icon: GraduationCap,
    tone: "purple",
    tagline: "Create AI quizzes from PDFs. Track your class in real time.",
    features: ["PDF → Quiz in 60s", "Live class hosting", "Per-student analytics"],
    cta: "Enter teacher portal",
    href: "/login",
  },
];

const TONES = {
  emerald: {
    ring: "ring-emerald-400/30",
    btn: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30",
    accent: "text-emerald-300",
    glow: "bg-emerald-500/20",
  },
  purple: {
    ring: "ring-purple-400/30",
    btn: "bg-purple-500 hover:bg-purple-400 shadow-purple-500/30",
    accent: "text-purple-300",
    glow: "bg-purple-500/20",
  },
};

export default function DarkCtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="cta" className="relative overflow-hidden py-16 md:py-24">
      <div ref={ref} className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 px-6 py-14 sm:px-10 md:px-14 md:py-20"
        >
          {/* Background glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative">
            {/* Header */}
            <div className="mx-auto max-w-2xl text-center">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur-md"
              >
                <Sparkles size={12} className="text-emerald-300" />
                One platform, three portals
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
                className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
              >
                Ready to level up{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  your classroom?
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                className="mt-4 text-base leading-relaxed text-white/70"
              >
                Pick your path — everything from AI quiz creation to daily
                streaks is waiting on the other side.
              </motion.p>
            </div>

            {/* Two cards */}
            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
              {PATHS.map((p, i) => {
                const Icon = p.icon;
                const tone = TONES[p.tone];

                return (
                  <motion.div
                    key={p.role}
                    initial={{ opacity: 0, y: 24 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.55, delay: 0.35 + i * 0.1, ease: EASE }}
                    className={
                      "relative overflow-hidden rounded-3xl bg-white/5 p-6 ring-1 backdrop-blur-xl transition hover:bg-white/10 " +
                      tone.ring
                    }
                  >
                    <div
                      aria-hidden
                      className={
                        "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl " +
                        tone.glow
                      }
                    />

                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                          <Icon size={22} className={tone.accent} />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                            For
                          </p>
                          <p className="text-lg font-extrabold text-white">
                            {p.role}s
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-white/70">
                        {p.tagline}
                      </p>

                      <ul className="mt-5 space-y-2">
                        {p.features.map((feat) => (
                          <li
                            key={feat}
                            className="flex items-center gap-2 text-xs font-semibold text-white/80"
                          >
                            <CheckCircle2 size={13} className={tone.accent} />
                            {feat}
                          </li>
                        ))}
                      </ul>

                      <Link
                        to={p.href}
                        className={
                          "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 " +
                          tone.btn
                        }
                      >
                        {p.cta}
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-wider text-white/40"
            >
              <span className="inline-flex items-center gap-1.5">
                <Flame size={12} /> 14-day streak avg
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={12} /> 2,400+ students
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={12} /> 60s AI generation
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}