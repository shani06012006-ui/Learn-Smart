import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, GraduationCap, Bell, TrendingUp, PlayCircle,
  CheckCircle2, Wifi, Battery, Signal, Users, Sparkles, Award,
} from "lucide-react";
import { EASE } from "../motion";

/* ────────────────────────────────────────────────────────────────
   Phone screen UI — the LMS mobile app preview.
   ──────────────────────────────────────────────────────────────── */
function PhoneScreen() {
  return (
    <div className="relative aspect-[9/19.2] w-full bg-gradient-to-b from-surface-50 to-white">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pb-2 pt-6 text-[10px] font-semibold text-slate-800">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <Signal size={11} />
          <Wifi size={11} />
          <Battery size={11} />
        </div>
      </div>

      {/* App header */}
      <div className="px-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-navy-800 to-navy-950 text-[9px] font-bold text-white">
              EC
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-900">EduCore</p>
              <p className="text-[8px] text-slate-500">Spring 2026</p>
            </div>
          </div>
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
            <Bell size={12} className="text-slate-600" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-coral" />
          </span>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 pt-3">
        <p className="text-[10px] text-slate-500">Good morning,</p>
        <p className="text-sm font-bold text-slate-900">Anita Iyer</p>
      </div>

      {/* Progress card */}
      <div className="mx-4 mt-3 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 p-3 text-white shadow-elevated">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={10} className="text-electric-400" />
          <p className="text-[8px] font-semibold uppercase tracking-wider text-electric-300">
            Today's progress
          </p>
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums">87%</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "87%" }}
            transition={{ duration: 1.4, delay: 1.1, ease: EASE.smooth }}
            className="h-full rounded-full bg-gradient-to-r from-electric-400 to-electric-500"
          />
        </div>
        <p className="mt-1 text-[8px] text-white/70">3 of 4 modules complete</p>
      </div>

      {/* Up next */}
      <div className="mx-4 mt-3">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Up next
        </p>
        <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric-500/15 text-electric-600">
              <PlayCircle size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold text-slate-900">Advanced Calculus</p>
              <p className="truncate text-[8px] text-slate-500">09:00 · Dr. Chen</p>
            </div>
            <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-navy-800">
              Now
            </span>
          </div>
        </div>
      </div>

      {/* Course list */}
      <div className="mx-4 mt-3 space-y-1.5">
        {[
          { n: "Organic Chemistry", p: 72, c: "bg-accent-mint" },
          { n: "Data Structures", p: 45, c: "bg-accent-violet" },
        ].map((c) => (
          <div key={c.n} className="rounded-lg border border-slate-100 bg-white p-2">
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-semibold text-slate-700">{c.n}</span>
              <span className="tabular-nums text-slate-500">{c.p}%</span>
            </div>
            <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${c.c}`} style={{ width: `${c.p}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom tab bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-slate-100 bg-white/90 px-4 pb-3 pt-2 backdrop-blur">
        <span className="flex flex-col items-center gap-0.5 text-navy-800">
          <div className="h-4 w-4 rounded-md bg-navy-800/15" />
          <span className="text-[7px] font-semibold">Home</span>
        </span>
        <span className="flex flex-col items-center gap-0.5 text-slate-400">
          <div className="h-4 w-4 rounded-md bg-slate-200" />
          <span className="text-[7px] font-semibold">Courses</span>
        </span>
        <span className="flex flex-col items-center gap-0.5 text-slate-400">
          <div className="h-4 w-4 rounded-md bg-slate-200" />
          <span className="text-[7px] font-semibold">Chat</span>
        </span>
        <span className="flex flex-col items-center gap-0.5 text-slate-400">
          <div className="h-4 w-4 rounded-md bg-slate-200" />
          <span className="text-[7px] font-semibold">Me</span>
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Hero visual — floating phone with side cards. No hand.
   ──────────────────────────────────────────────────────────────── */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md min-w-0">
      {/* Ambient glow behind the phone */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-navy-500/15 via-electric-400/10 to-transparent blur-3xl"
      />

      {/* Two soft orbs behind, floating */}
      <div
        aria-hidden
        className="absolute right-4 top-6 h-32 w-32 rounded-full bg-electric-500/15 blur-2xl animate-float-slow"
      />
      <div
        aria-hidden
        className="absolute bottom-8 left-2 h-40 w-40 rounded-full bg-navy-500/15 blur-2xl animate-float"
      />

      {/* Perspective container */}
      <div className="relative" style={{ perspective: "1400px", perspectiveOrigin: "50% 40%" }}>
        <motion.div
          initial={{ opacity: 0, y: 60, rotateY: -16, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateY: -8, rotateX: 4 }}
          transition={{ duration: 1.1, delay: 0.6, ease: EASE.smooth }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative"
        >
          {/* Phone */}
          <div className="relative mx-auto w-[280px] animate-float">
            {/* Soft cast shadow under phone */}
            <div
              aria-hidden
              className="absolute -bottom-8 left-1/2 h-10 w-4/5 -translate-x-1/2 rounded-full bg-slate-900/20 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[2.2rem] border-[9px] border-slate-900 bg-slate-900 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset]">
              {/* Notch */}
              <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900">
                <div className="absolute left-1/2 top-1.5 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-800" />
              </div>
              <PhoneScreen />
            </div>
          </div>

          {/* Floating side card — top right */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: -30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 1.3, ease: EASE.smooth }}
            className="absolute -right-14 top-20 hidden w-48 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-elevated backdrop-blur-xl lg:block animate-float"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric-500/15 text-electric-600">
                <PlayCircle size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-900">Live class started</p>
                <p className="truncate text-[10px] text-slate-500">142 students joined</p>
              </div>
            </div>
          </motion.div>

          {/* Floating side card — left middle */}
          <motion.div
            initial={{ opacity: 0, x: -40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 1.45, ease: EASE.smooth }}
            className="absolute -left-16 top-44 hidden w-48 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-elevated backdrop-blur-xl lg:block animate-float-slow"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-mint/15 text-emerald-600">
                <CheckCircle2 size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-900">Assignment graded</p>
                <p className="truncate text-[10px] text-slate-500">Research Paper · 2m ago</p>
              </div>
            </div>
          </motion.div>

          {/* Floating card — bottom right */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 1.6, ease: EASE.smooth }}
            className="absolute -right-12 bottom-24 hidden w-44 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-elevated backdrop-blur-xl md:block animate-float"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-violet/15 text-violet-600">
                <Award size={13} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-slate-900">Certificate earned</p>
                <p className="truncate text-[9px] text-slate-500">Python Basics</p>
              </div>
            </div>
          </motion.div>

          {/* Small floating pill — bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.75, ease: EASE.smooth }}
            className="absolute -left-12 bottom-40 hidden items-center gap-2 rounded-full border border-slate-200 bg-white/95 py-1.5 pl-1.5 pr-3.5 shadow-elevated backdrop-blur-xl md:flex animate-float-slow"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-800 text-white">
              <Users size={11} />
            </span>
            <p className="text-[10px] font-bold text-slate-900">
              2,340 <span className="font-medium text-slate-500">online</span>
            </p>
          </motion.div>

          {/* Small sparkle badge top-left */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 1.9, ease: EASE.overshoot }}
            className="absolute left-0 top-4 hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-elevated md:flex"
          >
            <Sparkles size={16} className="text-electric-500" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Background — soft wash + faint grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-hero-wash" />
        <div className="absolute inset-0 bg-grid-faint opacity-40 [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_50%_30%,black_30%,transparent_75%)]" />
      </div>

      <div className="container grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
        {/* LEFT — copy */}
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE.smooth }}
            className="eyebrow"
          >
            <GraduationCap size={13} className="text-navy-800" />
            Trusted by <span className="font-bold text-slate-900">150+ universities</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE.smooth }}
            className="h1 mt-6"
          >
            Empowering Next-Gen{" "}
            <span className="bg-gradient-to-r from-navy-800 via-navy-700 to-electric-500 bg-clip-text text-transparent">
              Higher Education
            </span>{" "}
            &amp; Campus Learning.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE.smooth }}
            className="body-lg mt-6 max-w-xl"
          >
            A unified institutional LMS designed to manage courses, streamline faculty workflows, and enhance student engagement — all in one secure platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: EASE.smooth }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-navy-900 px-7 py-3.5 text-base font-semibold text-white shadow-navy-glow transition-all hover:bg-navy-800 hover:shadow-elevated"
            >
              Request Institution Demo
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#reach"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              View enterprise plan
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.46 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500"
          >
            {["FERPA & GDPR compliant", "99.9% uptime SLA", "Dedicated onboarding team"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-accent-mint" />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* RIGHT — visual */}
        <div className="flex min-w-0 justify-center lg:justify-end">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}