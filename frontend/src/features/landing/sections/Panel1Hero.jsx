// frontend/src/features/landing/sections/Panel1Hero.jsx
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Flame, Star } from "lucide-react";
import SafeImage from "../components/SafeImage";
import ChalkDoodles from "../components/ChalkDoodles";
import { AVATARS, IMAGES } from "../landingAssets";

const EASE = [0.22, 1, 0.36, 1];

export default function Panel1Hero() {
  const reduce = useReducedMotion();
  // Staggered page-load entrance (skipped when the visitor prefers reduced motion)
  const rise = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section id="home" className="px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink-800 pb-20 pt-32 sm:rounded-[2.5rem] sm:pt-40 lg:pb-28">
        {/* soft glow + chalkboard grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-sage-400/15 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "linear-gradient(to bottom, black, transparent 80%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)",
            }}
          />
        </div>

        <div className="container-wide relative grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ── Left: copy ─────────────────────────────────────────── */}
          <div>
            <motion.h1
              {...rise(0)}
              className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Unlock Your Next
              <br />
              Learning Move
            </motion.h1>

            <motion.p
              {...rise(0.1)}
              className="mt-6 max-w-md text-base leading-relaxed text-white/70"
            >
              Turn any lesson PDF into a ready-to-play quiz in under a minute.
              Teachers save hours on grading, and students stay motivated with
              streaks, live classes and clear progress.
            </motion.p>

            {/* Pill CTA (echoes the reference's search pill, but actually works) */}
            <motion.div {...rise(0.2)} className="mt-9">
              <Link
                to="/register"
                className="group flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-white p-1.5 pl-6 shadow-lg shadow-black/20"
              >
                <span className="text-sm font-medium text-ink-500">
                  <span className="sm:hidden">Join for free</span>
                  <span className="hidden sm:inline">Create your free account</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-sage-500 px-6 py-3 text-sm font-bold text-ink-950 transition-colors group-hover:bg-sage-400">
                  Get started
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              <p className="mt-4 text-sm text-white/60">
                Already a student?{" "}
                <Link
                  to="/student-login"
                  className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
                >
                  Log in with your PIN
                </Link>
              </p>
            </motion.div>

            {/* Social proof */}
            <motion.div {...rise(0.3)} className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {AVATARS.map((src, i) => (
                  <SafeImage
                    key={src}
                    src={src}
                    alt={`Learner ${i + 1}`}
                    eager
                    className="h-10 w-10 rounded-full border-2 border-ink-800 object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5" aria-label="Rated 4.9 out of 5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className="fill-sage-300 text-sage-300" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-white/60">
                  Loved by 2,400+ students and teachers
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Right: photo + doodles ─────────────────────────────── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="relative mx-auto w-full max-w-sm sm:max-w-md"
          >
            <div className="relative aspect-[4/5]">
              <ChalkDoodles />

              <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] rounded-tl-[7rem] bg-ink-700 ring-1 ring-white/15">
                <SafeImage
                  src={IMAGES.hero}
                  alt="Student studying on a laptop"
                  eager
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent" />
              </div>

              {/* Product chips */}
              <div className="absolute -left-3 bottom-10 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl sm:-left-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-ink-700">
                  <FileText size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold text-ink-900">Quiz ready</p>
                  <p className="flex items-center gap-1 text-[11px] text-ink-500">
                    <CheckCircle2 size={11} className="text-sage-600" />
                    10 questions · 28 sec
                  </p>
                </div>
              </div>

              <div className="absolute -right-2 top-1/3 flex items-center gap-2 rounded-full bg-ink-900/90 py-2 pl-3 pr-4 text-white shadow-xl ring-1 ring-white/15 backdrop-blur sm:-right-6">
                <Flame size={16} className="text-sage-300" />
                <span className="text-xs font-bold">12-day streak</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}