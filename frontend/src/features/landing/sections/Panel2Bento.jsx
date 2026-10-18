// frontend/src/features/landing/sections/Panel2Bento.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Sparkles, Flame, Users, Trophy, Star, BookOpen,
  GraduationCap, PlayCircle, Zap, CheckCircle2,
  ArrowRight, FileText, Brain,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const STATS = [
  { value: "10+", label: "Years Experience", icon: Star },
  { value: "1K+", label: "Activities", icon: BookOpen },
  { value: "8K+", label: "Happy Students", icon: Users },
  { value: "4.2/5", label: "Parent Rating", icon: Trophy },
];

function BentoCard({ children, delay = 0, inView, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_rgba(124,58,237,0.15)] " +
        className
      }
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}

function CardAI({ inView }) {
  return (
    <BentoCard inView={inView} delay={0.1} className="lg:col-span-2 lg:row-span-2">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30">
            <Sparkles size={20} />
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">New</span>
        </div>
        <h3 className="mt-5 font-display text-2xl font-extrabold text-white">AI-powered quiz maker</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">Upload any PDF and watch our AI generate a full multiple-choice quiz in under 30 seconds. Perfect for teachers who want to save hours.</p>
        <div className="mt-auto flex items-center gap-3 pt-6">
          <div className="flex h-20 w-16 flex-col items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30">
            <FileText size={20} className="text-rose-400" />
            <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-rose-400">PDF</span>
          </div>
          <motion.div animate={{ x: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-purple-400"><ArrowRight size={20} /></motion.div>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-purple-500/15 p-3 ring-1 ring-purple-500/30">
            <Brain size={18} className="shrink-0 text-purple-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300">10 questions ready</p>
              <p className="text-[10px] text-slate-400">Generated in 28s</p>
            </div>
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

function CardStreak({ inView }) {
  return (
    <BentoCard inView={inView} delay={0.2} className="lg:col-span-1 lg:row-span-2">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"><Flame size={20} /></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Level 5</span>
        </div>
        <h3 className="mt-5 font-display text-2xl font-extrabold text-white">Daily streaks</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">Kids come back because their streak matters. Simple.</p>
        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between">
            <p className="text-4xl font-extrabold leading-none text-white">14<span className="ml-1 text-sm font-bold text-slate-500">days</span></p>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/30">+50 XP</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div initial={{ width: 0 }} animate={inView ? { width: "80%" } : {}} transition={{ duration: 1.2, delay: 0.6, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">4 days to next level</p>
        </div>
      </div>
    </BentoCard>
  );
}

function CardStats({ inView }) {
  return (
    <BentoCard inView={inView} delay={0.3} className="lg:col-span-2">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }} className="text-center">
              <Icon size={16} className="mx-auto text-purple-400" />
              <p className="mt-2 font-display text-2xl font-extrabold text-white">{s.value}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>
    </BentoCard>
  );
}

function CardRoles({ inView }) {
  return (
    <BentoCard inView={inView} delay={0.4} className="lg:col-span-1">
      <div className="flex h-full flex-col">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"><GraduationCap size={20} /></span>
        <h3 className="mt-5 font-display text-lg font-extrabold text-white">Role-based portals</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">One platform. Three perfect views.</p>
        <div className="mt-auto space-y-2 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 ring-1 ring-emerald-500/20">
            <GraduationCap size={12} className="text-emerald-400" /><span className="text-[10px] font-bold text-emerald-300">Student</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-2.5 py-1.5 ring-1 ring-purple-500/20">
            <BookOpen size={12} className="text-purple-400" /><span className="text-[10px] font-bold text-purple-300">Teacher</span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

function CardLive({ inView }) {
  return (
    <BentoCard inView={inView} delay={0.5} className="lg:col-span-1">
      <div className="flex h-full flex-col">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30"><PlayCircle size={20} /></span>
        <h3 className="mt-5 font-display text-lg font-extrabold text-white">Live classes</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">Host sessions or join in seconds.</p>
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span className="text-[10px] font-bold text-white">Live now</span>
            <Users size={10} className="ml-auto text-slate-500" />
            <span className="text-[10px] font-bold text-slate-400">24</span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

export default function Panel2Bento({ layout = "horizontal" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-navy-950 py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
      </div>
      <div className="container-wide relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, ease: EASE }} className="text-xs font-bold uppercase tracking-widest text-purple-400">Everything in one place</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1, ease: EASE }} className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            One platform.{" "}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent">Every learning tool.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2, ease: EASE }} className="mt-4 text-base leading-relaxed text-slate-400">
            From AI-generated quizzes to live sessions and role-based portals — built to make learning feel effortless.
          </motion.p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto]">
          <CardAI inView={inView} />
          <CardStreak inView={inView} />
          <CardStats inView={inView} />
          <CardRoles inView={inView} />
          <CardLive inView={inView} />
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.7, ease: EASE }} className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
          <Zap size={14} className="text-amber-400" />
          <span>All features included. No credit card required to start.</span>
        </motion.div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-paper-50" />
    </section>
  );
}
