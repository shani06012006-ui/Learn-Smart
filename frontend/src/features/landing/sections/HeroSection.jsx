// frontend/src/features/landing/sections/HeroSection.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/* ──────────────────────────────────────────────────────────────────
   Small floating icon tiles around the boy — matching the reference
   ────────────────────────────────────────────────────────────────── */
const FLOATING_ICONS = [
  {
    id: "book",
    top: "12%",
    left: "30%",
    rotate: -6,
    delay: 0.6,
    color: "bg-coral-50",
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-coral-500" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 4h8a2 2 0 0 1 2 2v14M22 4h-8a2 2 0 0 0-2 2v14M4 8h4M4 12h4M4 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "bulb",
    top: "18%",
    left: "78%",
    rotate: 8,
    delay: 0.75,
    color: "bg-amber-50",
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "person",
    top: "62%",
    left: "4%",
    rotate: -10,
    delay: 0.9,
    color: "bg-coral-50",
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-coral-500" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="6" r="3" />
        <path d="M6 22v-4a6 6 0 0 1 12 0v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "grid",
    top: "68%",
    left: "84%",
    rotate: 6,
    delay: 1.05,
    color: "bg-purple-50",
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
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
      {/* Background — very light lavender wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-paper-50" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-b from-purple-50/70 via-paper-50 to-transparent blur-3xl" />
      </div>

      <div className="container-wide">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* ── LEFT — copy + search ─────────────────────────────── */}
          <div className="min-w-0 lg:col-span-6 xl:col-span-6">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-coral-100 bg-coral-50/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-500"
            >
              Never Stop Learning
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-950 sm:text-5xl lg:text-6xl"
            >
              Grow up your{" "}
              <span className="relative inline-block">
                <span className="relative z-10">skills</span>
                <span aria-hidden className="absolute inset-x-0 bottom-0.5 -z-0 h-3 bg-coral-200/60" />
              </span>{" "}
              by online courses with{" "}
              <span className="text-coral-500">Learn Smart</span>
            </motion.h1>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-500"
            >
              Learn Smart is a Global training provider based across the UK that specialises in
              accredited and bespoke training courses. We crush the barriers to gaining a
              degree.
            </motion.p>

            {/* Search bar */}
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34, ease: EASE }}
              onSubmit={onSearch}
              className="mt-8 flex max-w-xl items-center gap-0 overflow-hidden rounded-full border border-slate-200 bg-white p-1.5 shadow-card"
            >
              {/* Category dropdown */}
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none rounded-full bg-transparent py-3 pl-5 pr-9 text-sm font-semibold text-navy-950 outline-none"
                >
                  <option>Kindergarten</option>
                  <option>High School</option>
                  <option>College</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Divider */}
              <span className="h-6 w-px bg-slate-200" />

              {/* Query input */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Class/Course"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400 outline-none"
              />

              {/* Search button */}
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-500 px-6 py-3 text-sm font-bold text-white shadow-purple-glow transition-all hover:bg-purple-600 hover:-translate-y-0.5"
              >
                <Search size={15} />
                Search
              </button>
            </motion.form>
          </div>

          {/* ── RIGHT — boy + peachy blob + floating icons + carousel arrows ── */}
          <div className="relative min-w-0 lg:col-span-6 xl:col-span-6">
            {/* Carousel arrows (top-right of the hero, per reference) */}
            <div className="absolute -top-2 right-0 z-20 hidden items-center gap-2 md:flex">
              <button
                type="button"
                aria-label="Previous"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-card transition-all hover:border-slate-300"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-card transition-all hover:border-slate-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Visual container */}
            <div className="relative mx-auto aspect-[5/6] w-full max-w-md md:max-w-lg">
              {/* Peachy blob behind the boy */}
              <div
                aria-hidden
                className="absolute inset-x-4 bottom-0 top-12 rounded-[3rem] bg-hero-peach opacity-95"
              />
              {/* Faint dotted accent at bottom-right */}
              <div
                aria-hidden
                className="dot-pattern-coral absolute -bottom-2 -right-2 h-20 w-24 rounded-lg opacity-70"
              />

              {/* Boy photo — replace with your image URL */}
              {/* HERE IS YOUR IMAGE — hero boy — paste a URL below */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
                className="absolute inset-x-0 bottom-0 top-8 overflow-hidden rounded-[3rem]"
              >
                <img
                  src="https://i.pinimg.com/1200x/85/e8/08/85e80878dbd55569c3f4e4e479b2e9a9.jpg"
                  alt="Student with backpack"
                  className="h-full w-full object-cover object-top"
                  onError={(e) => {
                    // Hide image on error so blob shows through
                    e.currentTarget.style.display = "none";
                  }}
                />
              </motion.div>

              {/* Floating icon tiles */}
              {FLOATING_ICONS.map((icon) => (
                <motion.div
                  key={icon.id}
                  initial={{ opacity: 0, scale: 0.5, rotate: icon.rotate - 20 }}
                  animate={{ opacity: 1, scale: 1, rotate: icon.rotate }}
                  transition={{ duration: 0.6, delay: icon.delay, ease: EASE }}
                  style={{ top: icon.top, left: icon.left }}
                  className="absolute z-20"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${icon.color} shadow-elevated ring-1 ring-white/60 animate-float`}
                    style={{ animationDelay: `${icon.delay}s` }}
                  >
                    {icon.svg}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
