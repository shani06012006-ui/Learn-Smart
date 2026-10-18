// frontend/src/features/landing/sections/Panel1Hero.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Flame, ShieldCheck, Rocket,
  Trophy, CheckCircle2, Star,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

export default function Panel1Hero({ layout = "horizontal" }) {
  const isH = layout === "horizontal";
  return (
    <section 
    id="hero"
    className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-paper-50" > 
    
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-emerald-100/50 blur-[100px]" />
        <div className="absolute -right-20 top-1/4 h-[500px] w-[500px] rounded-full bg-purple-100/50 blur-[100px]" />
      </div>

      <div className="container-wide relative py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* LEFT */}
          <div className={isH ? "" : "text-center"}>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 shadow-sm sm:text-xs">
              <Sparkles size={12} className="text-purple-500" />
              The #1 AI Learning Platform for Kids
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-950 sm:text-5xl lg:text-6xl">
              Turn any lesson into a{" "}
              <span className="relative inline-block text-purple-600">
                game they love.
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-emerald-200/60" />
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
              Help your child build a daily learning habit. Our AI transforms
              boring PDFs into interactive quizzes, rewarding them with streaks
              and badges.
            </p>
            <div
              className={
                "mt-8 flex flex-wrap items-center gap-3 " +
                (isH ? "" : "justify-center")
              }
            >
              <Link
                to="/student-login"
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgb(109,40,217,0.3)] transition hover:-translate-y-0.5 hover:bg-purple-700"
              >
                Start Learning Free <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                I'm a Teacher
              </Link>
            </div>
          </div>

          {/* RIGHT — phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: isH ? 60 : 0, y: isH ? 0 : 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, ease: EASE }}
            className="relative mx-auto flex w-full max-w-[260px] items-center justify-center lg:max-w-xs"
          >
            <div className="relative aspect-[9/19] w-full rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-900 p-2 shadow-2xl">
              <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
              <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-paper-50 p-4">
                <div className="flex items-center justify-between">
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
                <div className="mt-3 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-3 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-white/70">
                      Daily Streak
                    </span>
                    <Flame size={12} className="text-amber-300" />
                  </div>
                  <p className="mt-1 text-xl font-extrabold">14 days</p>
                </div>
                <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
                  <p className="text-[9px] font-bold uppercase text-purple-600">
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
                          "flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[9px] " +
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
                        <span className="font-semibold text-navy-950">
                          {o.t}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}