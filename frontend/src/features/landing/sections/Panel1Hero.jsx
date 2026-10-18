// frontend/src/features/landing/sections/Panel1Hero.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Flame,
  ShieldCheck,
  Rocket,
  Star,
  CheckCircle2,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

export default function Panel1Hero({ layout = "horizontal" }) {
  const isH = layout === "horizontal";

  return (
    <section
      id="hero"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-navy-950"
    >
      {/* ── Layer 1: Animated gradient orbs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-purple-600/30 blur-[140px]"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/25 blur-[140px]"
        />
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 80, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-fuchsia-500/20 blur-[140px]"
        />
      </div>

      {/* ── Layer 2: Grid pattern ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* ── Layer 3: Noise texture ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Content ── */}
      <div className="container-wide relative py-20 lg:py-0">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — Copy */}
          <div className={isH ? "" : "text-center"}>
            {/* Top badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(124,58,237,0.15)] backdrop-blur-xl sm:text-xs"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-white/90">
                Now with AI-powered quizzes
              </span>
              <ArrowRight size={11} className="text-white/60" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Turn any lesson{" "}
              <br className="hidden sm:block" />
              into a{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  game they love.
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-2 -z-0 h-3 bg-emerald-500/30 blur-sm"
                />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg lg:mx-0"
            >
              Help your child build a daily learning habit. Our AI turns boring
              PDFs into interactive quizzes, rewarding them with streaks and
              badges — trusted by thousands of parents.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34, ease: EASE }}
              className={
                "mt-8 flex flex-wrap items-center gap-3 " +
                (isH ? "" : "justify-center")
              }
            >
              <Link
                to="/student-login"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_30px_rgb(16,185,129,0.4)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_8px_40px_rgb(16,185,129,0.6)] sm:px-7"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Sparkles size={15} />
                Start Learning Free
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-bold text-white backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.1]"
              >
                I'm a Teacher
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
              className={
                "mt-8 flex flex-wrap items-center gap-4 " +
                (isH ? "" : "justify-center")
              }
            >
              <div className="flex -space-x-2">
                {["A", "M", "S", "R"].map((initial, i) => (
                  <span
                    key={initial}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy-950 bg-gradient-to-br from-purple-500 to-purple-700 text-[10px] font-extrabold text-white"
                    style={{ zIndex: 10 - i }}
                  >
                    {initial}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span>
                  <strong className="text-white">2,400+</strong> families trust us
                </span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — Phone mockup with glow */}
          <motion.div
            initial={{ opacity: 0, x: isH ? 60 : 0, y: isH ? 0 : 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
            className="relative mx-auto flex w-full max-w-[280px] items-center justify-center lg:max-w-sm"
          >
            {/* Glow halo behind phone */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 mx-auto h-full w-[120%] rounded-full bg-gradient-to-br from-purple-500/40 via-fuchsia-500/20 to-emerald-500/40 blur-[100px]"
            />

            {/* Phone frame */}
            <div className="relative aspect-[9/19] w-full rounded-[2.5rem] border-[6px] border-slate-800 bg-slate-900 p-2 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
              {/* Screen edge highlight */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10"
              />

              {/* Notch */}
              <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />

              {/* Screen */}
              <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-paper-50 p-4">
                {/* Status bar */}
                <div className="flex items-center justify-between text-[9px] font-bold text-navy-950">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className="h-1 w-0.5 rounded-full bg-navy-950" />
                      ))}
                    </div>
                    <span className="ml-1">🔋</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                      Learn Smart
                    </p>
                    <p className="text-sm font-extrabold text-navy-950">
                      Hi, Aarav 👋
                    </p>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Sparkles size={12} />
                  </span>
                </div>

                {/* Streak card */}
                <div className="mt-3 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-3 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                      Daily Streak
                    </span>
                    <Flame size={12} className="text-amber-300" />
                  </div>
                  <p className="mt-1 text-xl font-extrabold">14 days</p>
                  <p className="text-[9px] text-white/70">+50 XP earned today</p>
                </div>

                {/* Quiz card */}
                <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600">
                    Q3 of 10
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-navy-950">
                    What is the SI unit of force?
                  </p>
                  <div className="mt-2 space-y-1">
                    {[
                      { l: "A", t: "Joule" },
                      { l: "B", t: "Newton", correct: true },
                    ].map((o) => (
                      <div
                        key={o.l}
                        className={
                          "flex items-center gap-1.5 rounded-lg border px-1.5 py-1 text-[9px] " +
                          (o.correct
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 bg-white")
                        }
                      >
                        <span
                          className={
                            "flex h-3.5 w-3.5 items-center justify-center rounded text-[7px] font-bold " +
                            (o.correct
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-500")
                          }
                        >
                          {o.l}
                        </span>
                        <span className="font-semibold text-navy-950">{o.t}</span>
                        {o.correct && (
                          <CheckCircle2 size={9} className="ml-auto text-emerald-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom badges */}
                <div className="mt-2 flex gap-1.5">
                  <div className="flex flex-1 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-1">
                    <Star size={9} className="fill-amber-500 text-amber-500" />
                    <span className="text-[8px] font-bold text-amber-700">
                      Level 5
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-1">
                    <ShieldCheck size={9} className="text-emerald-500" />
                    <span className="text-[8px] font-bold text-emerald-700">
                      Safe
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges around the phone */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 top-1/4 hidden rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-2 text-[10px] font-bold text-white shadow-xl backdrop-blur-xl sm:flex"
            >
              <ShieldCheck size={12} className="mr-1 text-emerald-300" />
              100% Safe
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 top-1/2 hidden rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-2 text-[10px] font-bold text-white shadow-xl backdrop-blur-xl sm:flex"
            >
              <Rocket size={12} className="mr-1 text-purple-300" />
              AI-Powered
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 left-1/2 hidden -translate-x-1/2 rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-2 text-[10px] font-bold text-white shadow-xl backdrop-blur-xl sm:flex"
            >
              <Flame size={12} className="mr-1 text-amber-300" />
              14-day streak
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-paper-50"
      />
    </section>
  );
}