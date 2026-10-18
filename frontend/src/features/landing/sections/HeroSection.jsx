// frontend/src/features/landing/sections/HeroSection.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ChevronDown, Sparkles, Flame, CheckCircle2, 
  ArrowRight, ShieldCheck, Rocket
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/* ──────────────────────────────────────────────────────────────────
   Floating Badge Notifications (Trust & Excitement)
   ────────────────────────────────────────────────────────────────── */
const FLOATING_BADGES = [
  {
    id: "safe",
    label: "100% Safe Learning",
    icon: ShieldCheck,
    color: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    top: "6%",
    left: "0%",
    delay: 0.6,
  },
  {
    id: "ai",
    label: "AI-Powered Quizzes",
    icon: Rocket,
    color: "bg-purple-100 text-purple-700 ring-purple-200",
    top: "14%",
    left: "72%",
    delay: 0.8,
  },
];

export default function HeroSection() {
  const [category, setCategory] = useState("Kindergarten");
  const [query, setQuery] = useState("");

  const onSearch = (e) => {
    e.preventDefault();
    // TODO: wire to your search route
  };

  return (
    <section id="hero" className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28">
      {/* ── Cheerful Background Blobs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-paper-50" />
        {/* Soft emerald & purple radial washes */}
        <div className="absolute -left-[10%] -top-[20%] h-[700px] w-[700px] rounded-full bg-emerald-100/40 blur-[100px]" />
        <div className="absolute -right-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-purple-100/40 blur-[100px]" />
        {/* Subtle dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.15]" 
          style={{ backgroundImage: 'radial-gradient(#7c6fdd 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
        />
      </div>

      <div className="container-wide">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* ── LEFT — Copy + Search + CTAs ─────────────────────────────── */}
          <div className="min-w-0 lg:col-span-6 xl:col-span-6">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 shadow-sm"
            >
              <Sparkles size={14} className="text-purple-500" />
              The #1 AI Learning Platform for Kids
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-950 sm:text-5xl lg:text-6xl"
            >
              Turn any lesson into a{" "}
              <span className="relative inline-block text-purple-600">
                game they love.
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-emerald-200/60" />
              </span>
            </motion.h1>

            {/* Body - Refined for Parents */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
            >
              Help your child build a daily learning habit. Our AI transforms boring PDFs 
              into interactive quizzes, rewarding them with streaks and badges. 
              Safe, engaging, and trusted by thousands of parents.
            </motion.p>

            {/* Dual CTAs (Replacing the generic search bar for better conversion) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/student-login"
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_30px_rgb(109,40,217,0.3)] transition-all hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-[0_8px_30px_rgb(109,40,217,0.5)]"
              >
                Start Learning Free
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                I'm a Teacher
              </Link>
            </motion.div>

            {/* Functional Search Bar (Kept but styled) */}
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.44, ease: EASE }}
              onSubmit={onSearch}
              className="mt-8 flex max-w-md items-center gap-0 overflow-hidden rounded-full border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-50"
            >
              <div className="relative hidden sm:block">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none rounded-full bg-transparent py-2 pl-4 pr-8 text-xs font-semibold text-slate-600 outline-none"
                >
                  <option>Kindergarten</option>
                  <option>Primary</option>
                  <option>High School</option>
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="hidden h-5 w-px bg-slate-200 sm:block" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a class..."
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-navy-950 placeholder:text-slate-400 outline-none"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-purple-100 hover:text-purple-600"
              >
                <Search size={15} />
              </button>
            </motion.form>
          </div>

          {/* ── RIGHT — Visual + Gamified Widgets ── */}
          <div className="relative min-w-0 lg:col-span-6 xl:col-span-6">
            
            {/* Main Visual Container */}
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm md:max-w-md lg:max-w-lg">
              
              {/* Organic background shape */}
              <div className="absolute inset-4 rounded-[3rem] bg-gradient-to-tr from-emerald-100 to-purple-100 opacity-80" />

              {/* Kid Photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
                className="absolute inset-x-0 bottom-0 top-8 overflow-hidden rounded-[3rem]"
              >
                <img
                  src="https://i.pinimg.com/1200x/85/e8/08/85e80878dbd55569c3f4e4e479b2e9a9.jpg"
                  alt="Happy student learning"
                  className="h-full w-full object-cover object-top"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </motion.div>

              {/* ── FLOATING GAMIFIED WIDGET (Overlaid on image) ── */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
                className="absolute -bottom-6 -right-4 z-30 w-64 animate-float rounded-2xl border border-white/60 bg-white/90 p-4 shadow-2xl backdrop-blur-xl sm:-right-8"
              >
                {/* Streak Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <Flame size={16} className="text-amber-500 animate-pulse-soft" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Streak</p>
                      <p className="text-sm font-extrabold text-navy-950">5 Days</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">+50 XP</span>
                </div>

                {/* Mini Quiz Widget */}
                <div className="pt-3">
                  <p className="text-xs font-bold text-navy-950 mb-2">What is 7 x 8?</p>
                  <div className="space-y-1.5">
                    {[
                      { letter: "A", text: "54", correct: false },
                      { letter: "B", text: "56", correct: true },
                    ].map((opt) => (
                      <div
                        key={opt.letter}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px] transition ${
                          opt.correct 
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800" 
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
                          opt.correct ? "bg-emerald-600 text-white" : "bg-slate-100"
                        }`}>
                          {opt.letter}
                        </span>
                        <span className="font-semibold">{opt.text}</span>
                        {opt.correct && <CheckCircle2 size={12} className="ml-auto text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Trust Badges (Floating) ── */}
              {FLOATING_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: badge.delay, ease: EASE }}
                    style={{ top: badge.top, left: badge.left }}
                    className="absolute z-20"
                  >
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg ring-1 animate-float-slow ${badge.color}`}>
                      <Icon size={14} />
                      {badge.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}