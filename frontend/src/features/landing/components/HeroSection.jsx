import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Search, ChevronDown, Users, BookOpen, GraduationCap, Sparkles } from "lucide-react";

import Button from "../../../components/ui/Button";
import ScrambleText from "./ScrambleText";
import HeroFloatingCards from "./HeroFloatingCards";

const STATS = [
  { icon: Users, value: "10,000+", label: "Students" },
  { icon: BookOpen, value: "500+", label: "Courses" },
  { icon: GraduationCap, value: "50+", label: "Teachers" },
];

const EASE = [0.22, 1, 0.36, 1];

function celebrate() {
  confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.4 },
    colors: ["#2ee6c8", "#ff7854", "#f2c14e", "#0da58a"],
  });
}

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-16 pb-28 md:pt-24 md:pb-36"
    >
      {/* ── Background layers ────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* mesh */}
        <div className="absolute inset-0 bg-hero-mesh" />
        {/* animated grid */}
        <div
          className="absolute inset-0 animate-grid-flow opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(46,230,200,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(46,230,200,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at 50% 40%, black 25%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 25%, transparent 75%)",
          }}
        />
        {/* glow blobs */}
        <div className="absolute -left-40 top-20 h-[32rem] w-[32rem] animate-blob rounded-full bg-brand-400/15 blur-[100px]" />
        <div className="absolute -right-40 top-40 h-[32rem] w-[32rem] animate-blob rounded-full bg-accent-400/12 blur-[100px] [animation-delay:6s]" />
        {/* bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-night-900" />
      </div>

      {/* ── Floating cards ───────────────────────────────────────── */}
      <HeroFloatingCards />

      {/* ── Centered content ─────────────────────────────────────── */}
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/5 px-3.5 py-1.5 text-xs font-medium text-brand-300 shadow-glow-teal backdrop-blur"
        >
          <span className="flex h-1.5 w-1.5 animate-pulse-glow rounded-full bg-brand-400" />
          AI-Powered · Personalized · Interactive
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="mt-8 text-5xl font-bold leading-[1.02] tracking-tight text-cream-100 sm:text-6xl lg:text-7xl"
        >
          The Home of Your
          <br />
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-accent-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(46,230,200,0.35)]">
            <ScrambleText text="Learning Journey" delay={400} />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-300 sm:text-lg"
        >
          Find the right courses, track your progress, and learn from expert
          teachers — all in one place.
        </motion.p>

        {/* Floating search pill */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto mt-10 flex w-full max-w-2xl items-stretch overflow-hidden rounded-full border border-white/10 bg-night-800/70 p-1.5 shadow-landing-lg backdrop-blur-xl"
        >
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-300 transition-colors hover:bg-white/5 hover:text-cream-100"
          >
            Category
            <ChevronDown size={14} className="text-muted-400" />
          </button>
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-400"
            />
            <input
              type="text"
              placeholder="Search courses, subjects, teachers..."
              className="h-full w-full bg-transparent py-3 pl-10 pr-4 text-sm text-cream-100 placeholder:text-muted-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 px-6 text-sm font-semibold text-night-900 shadow-glow-teal transition-all hover:shadow-glow-teal-lg"
          >
            Search
          </button>
        </motion.form>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/login" onClick={celebrate}>
            <Button size="lg" variant="accent">
              <Sparkles size={16} className="mr-1.5" />
              Get Started
            </Button>
          </Link>
          <Link to="/features">
            <Button size="lg" variant="secondary">
              Learn More
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-full border border-white/10 bg-night-800/60 px-4 py-2 shadow-landing backdrop-blur"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-400/15 text-brand-300">
                <Icon size={14} />
              </span>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-sm font-semibold text-cream-100">{value}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-400">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}