import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Users, MessageCircle, Hash, ArrowRight, Globe2, Rss, Sparkles, Star,
  BookOpen, Award, Zap,
} from "lucide-react";
import { EASE } from "../motion";

/* Avatars — each flies in from a different direction */
const AVATARS = [
  { initials: "AI", top: "10%", left: "16%", tone: "from-navy-700 to-navy-900",       from: { x: -100, y: -60 }, delay: 0.15 },
  { initials: "RS", top: "22%", left: "72%", tone: "from-electric-500 to-electric-700", from: { x: 100, y: -40 },  delay: 0.25 },
  { initials: "MN", top: "64%", left: "8%",  tone: "from-accent-mint to-emerald-600",  from: { x: -100, y: 60 },   delay: 0.35 },
  { initials: "KP", top: "78%", left: "76%", tone: "from-accent-violet to-violet-700", from: { x: 100, y: 60 },    delay: 0.45 },
  { initials: "JD", top: "44%", left: "42%", tone: "from-accent-coral to-rose-600",    from: { x: 0, y: -80 },     delay: 0.55 },
];

/* Chat bubbles drop from above */
const CHAT_TAGS = [
  { text: "Join us! 🎉",       top: "2%",  left: "44%", delay: 1.0, tone: "navy" },
  { text: "Welcome!",          top: "30%", left: "80%", delay: 1.15, tone: "electric" },
  { text: "Assignment due",    top: "86%", left: "46%", delay: 1.3,  tone: "mint" },
  { text: "Nice work!",        top: "52%", left: "86%", delay: 1.45, tone: "coral" },
];

/* Corner node icons */
const NODE_ICONS = [
  { icon: Globe2,        top: "6%",  left: "76%", delay: 0.7,  tone: "electric" },
  { icon: MessageCircle, top: "82%", left: "14%", delay: 0.8,  tone: "navy" },
  { icon: Hash,          top: "20%", left: "2%",  delay: 0.9,  tone: "violet" },
  { icon: Star,          top: "68%", left: "66%", delay: 1.0,  tone: "amber" },
];

/* Live activity feed items */
const ACTIVITY = [
  { icon: BookOpen, text: "Aisha joined Physics · Ch. 4",   time: "2m",   tone: "text-navy-800" },
  { icon: Award,    text: "Rahul earned Python Basics",      time: "12m",  tone: "text-amber-600" },
  { icon: Zap,      text: "Live class: 142 students joined",  time: "34m",  tone: "text-electric-600" },
  { icon: Users,    text: "New study group: Calculus II",    time: "1h",   tone: "text-emerald-600" },
  { icon: MessageCircle, text: "3 new replies in #design",  time: "2h",   tone: "text-violet-600" },
];

/* ──────────────────────────────────────────────────────────────────
   Node graph visual
   ────────────────────────────────────────────────────────────────── */
function CommunityVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="relative w-full">
      {/* Main graph */}
      <div className="relative mx-auto aspect-square w-full max-w-md">
        {/* Soft ambient panel */}
        <div
          aria-hidden
          className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-navy-50/80 via-white to-electric-500/5 blur-xl"
        />

        {/* Connection lines */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#365df1" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {AVATARS.map((a, i) => {
            const x = (parseFloat(a.left) / 100) * 400 + 28;
            const y = (parseFloat(a.top) / 100) * 400 + 28;
            return (
              <motion.line
                key={i}
                x1="200"
                y1="200"
                x2={x}
                y2={y}
                stroke="url(#lineGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 0.7 } : {}}
                transition={{ duration: 0.9, delay: 0.7 + a.delay, ease: EASE.smooth }}
              />
            );
          })}
        </svg>

        {/* Central hub */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.7, ease: EASE.overshoot }}
          className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-gradient-to-br from-navy-800 to-navy-950 shadow-elevated-lg"
        >
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/20" />
          <div className="absolute -inset-3 rounded-3xl ring-1 ring-navy-200/40" />
          <Users size={36} className="text-white" strokeWidth={2} />
          <motion.span
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.9, ease: EASE.overshoot }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-mint text-[10px] font-bold text-white ring-4 ring-white"
          >
            12
          </motion.span>
        </motion.div>

        {/* Avatars fly in */}
        {AVATARS.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: a.from.x, y: a.from.y, scale: 0.4 }}
            animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.75, delay: a.delay + 0.3, ease: EASE.overshoot }}
            className="absolute z-10"
            style={{ top: a.top, left: a.left }}
          >
            <div className="relative">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${a.tone} text-sm font-bold text-white shadow-elevated ring-4 ring-white`}>
                {a.initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent-mint" />
            </div>
          </motion.div>
        ))}

        {/* Chat bubbles drop in */}
        {CHAT_TAGS.map((tag, i) => {
          const t = {
            navy:     "bg-navy-900 text-white",
            electric: "bg-electric-500 text-white",
            mint:     "bg-emerald-600 text-white",
            coral:    "bg-accent-coral text-white",
          }[tag.tone];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -40, scale: 0.85 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.65, delay: tag.delay, ease: EASE.overshoot }}
              className="absolute z-30 animate-float"
              style={{ top: tag.top, left: tag.left, animationDelay: `${tag.delay}s` }}
            >
              <div className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-elevated ${t}`}>
                <Sparkles size={10} />
                {tag.text}
              </div>
            </motion.div>
          );
        })}

        {/* Corner node icons */}
        {NODE_ICONS.map((n, i) => {
          const Icon = n.icon;
          const t = {
            navy:     "bg-navy-50 text-navy-800 ring-navy-100",
            electric: "bg-electric-500/10 text-electric-600 ring-electric-500/20",
            violet:   "bg-accent-violet/15 text-violet-700 ring-violet-200",
            amber:    "bg-amber-100 text-amber-700 ring-amber-200",
          }[n.tone];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.55, delay: n.delay + 0.3, ease: EASE.overshoot }}
              className="absolute z-20"
              style={{ top: n.top, left: n.left }}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 shadow-card ${t}`}>
                <Icon size={16} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live activity feed below */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 1.6, ease: EASE.smooth }}
        className="mx-auto mt-6 max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Live campus activity
            </span>
          </div>
          <span className="text-[10px] text-slate-400">updating</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {ACTIVITY.slice(0, 4).map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 1.8 + i * 0.12, ease: EASE.smooth }}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <Icon size={14} className={a.tone} />
                <span className="flex-1 truncate text-xs text-slate-600">{a.text}</span>
                <span className="text-[10px] text-slate-400">{a.time}</span>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Section wrapper
   ────────────────────────────────────────────────────────────────── */
export default function CommunitySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="community" className="section-pad relative overflow-hidden">
      <div className="container grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* COPY */}
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE.smooth }}
            className="eyebrow"
          >
            <Users size={12} className="text-navy-800" />
            Campus hub
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
            className="h2 mt-5"
          >
            Where your campus{" "}
            <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
              actually talks.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE.smooth }}
            className="body-lg mt-5 max-w-xl"
          >
            Student clubs, peer study groups, course discussions, and campus
            announcements — all in one moderated hub that faculty and admins
            can see, shape, and grow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35, ease: EASE.smooth }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="#community"
              className="group inline-flex items-center gap-2 rounded-full bg-navy-900 px-7 py-3.5 text-base font-semibold text-white shadow-navy-glow transition-all hover:bg-navy-800"
            >
              Explore Campus Hub
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#community"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <Rss size={16} className="text-accent-coral" />
              See clubs & groups
            </a>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE.smooth }}
            className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-slate-200 pt-6"
          >
            {[
              { n: "2,340", l: "Active clubs" },
              { n: "18K+",  l: "Peer groups" },
              { n: "1.2M",  l: "Posts / year" },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1, ease: EASE.smooth }}
              >
                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {s.n}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {s.l}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* VISUAL */}
        <div className="flex min-w-0 justify-center lg:justify-end">
          <CommunityVisual />
        </div>
      </div>
    </section>
  );
}