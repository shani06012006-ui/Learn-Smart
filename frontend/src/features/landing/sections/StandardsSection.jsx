// frontend/src/features/landing/sections/StandardsSection.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  Flame,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
  Zap,
  GraduationCap,
  BookOpen,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const FEATURES = [
  {
    icon: Sparkles,
    tone: "purple",
    title: "AI quiz generation",
    body:
      "Upload any PDF from your class. Our AI turns it into a ready-to-publish multiple-choice quiz in under a minute — no manual question writing.",
    mockup: "ai",
  },
  {
    icon: Flame,
    tone: "amber",
    title: "Gamified streaks",
    body:
      "Students build daily streaks for showing up, earn XP for every quiz completed, and unlock achievement badges. Learning finally feels worth coming back to.",
    mockup: "streak",
  },
  {
    icon: Users,
    tone: "emerald",
    title: "Role-based portals",
    body:
      "Separate dashboards for students, teachers, and admins — each tuned to what they need. One platform, three clean views, zero confusion.",
    mockup: "roles",
  },
];

const TONES = {
  purple: {
    iconBg: "bg-purple-100 text-purple-600",
    gradient: "from-purple-500 to-indigo-600",
  },
  amber: {
    iconBg: "bg-amber-100 text-amber-600",
    gradient: "from-amber-500 to-orange-500",
  },
  emerald: {
    iconBg: "bg-emerald-100 text-emerald-600",
    gradient: "from-emerald-500 to-teal-600",
  },
};

/* ============ Mini mockups per feature ============ */

function AIMockup() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
        <FileText size={18} className="text-rose-500" />
      </div>
      <ArrowRight size={14} className="text-slate-300" />
      <div className="flex flex-1 items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 ring-1 ring-purple-100">
        <Sparkles size={12} className="text-purple-600" />
        <span className="text-[10px] font-bold text-purple-700">
          10 questions ready
        </span>
      </div>
    </div>
  );
}

function StreakMockup() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-amber-100">
      <div className="flex items-center gap-2">
        <span className="animate-pulse-soft flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
          <Flame size={12} className="text-amber-500" />
        </span>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
            Streak
          </p>
          <p className="text-xs font-extrabold text-navy-950">14 days</p>
        </div>
      </div>
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
        +50 XP
      </span>
    </div>
  );
}

function RolesMockup() {
  return (
    <div className="flex gap-1.5">
      <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1.5 ring-1 ring-emerald-100">
        <GraduationCap size={11} className="text-emerald-600" />
        <span className="text-[9px] font-bold text-emerald-700">Student</span>
      </div>
      <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1.5 ring-1 ring-purple-100">
        <BookOpen size={11} className="text-purple-600" />
        <span className="text-[9px] font-bold text-purple-700">Teacher</span>
      </div>
    </div>
  );
}

const MOCKUPS = {
  ai: AIMockup,
  streak: StreakMockup,
  roles: RolesMockup,
};

/* ============ Page ============ */

export default function StandardsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="relative overflow-hidden py-16 md:py-24">
      <div ref={ref} className="container-wide">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11px] font-bold uppercase tracking-widest text-purple-600"
          >
            Built for real classrooms
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl"
          >
            Three features that change{" "}
            <span className="bg-gradient-to-r from-purple-600 to-emerald-500 bg-clip-text text-transparent">
              everything
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg"
          >
            We didn't just build another LMS. We built the one your students will
            actually open every day.
          </motion.p>
        </div>

        {/* Feature cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const tone = TONES[f.tone];
            const Mockup = MOCKUPS[f.mockup];

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.3 + i * 0.1, ease: EASE }}
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Gradient corner accent */}
                <div
                  aria-hidden
                  className={
                    "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity group-hover:opacity-20 " +
                    tone.gradient
                  }
                />

                {/* Icon */}
                <span
                  className={
                    "flex h-12 w-12 items-center justify-center rounded-2xl " +
                    tone.iconBg
                  }
                >
                  <Icon size={22} />
                </span>

                {/* Title */}
                <h3 className="mt-5 font-display text-lg font-extrabold text-navy-950">
                  {f.title}
                </h3>

                {/* Body */}
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {f.body}
                </p>

                {/* Mini mockup */}
                <div className="mt-6 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <Mockup />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Closing line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-12 flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-500"
        >
          <CheckCircle2 size={15} className="text-emerald-500" />
          All included. No credit card. Free for the first 100 students.
        </motion.p>
      </div>
    </section>
  );
}