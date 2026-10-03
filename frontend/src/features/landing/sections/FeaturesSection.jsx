import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  BookOpen, Video, BarChart3, Award, Sparkles, MessageSquare, ArrowRight,
} from "lucide-react";
import { EASE } from "../motion";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Unified Course Management",
    description:
      "Author, version, and approve curricula. Assign grading rules and delegate to department heads — all from one console.",
    tone: "navy",
  },
  {
    icon: Video,
    title: "Interactive Live Classrooms",
    description:
      "Built-in lecture halls with attendance tracking, chat, recording, and post-class transcripts. No third-party plugins required.",
    tone: "electric",
  },
  {
    icon: BarChart3,
    title: "Automated Analytics",
    description:
      "Real-time dashboards across cohorts, departments, and academic years. Spot at-risk students weeks earlier.",
    tone: "mint",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description:
      "Blockchain-anchored credentials that students can share with employers and institutions can verify instantly.",
    tone: "amber",
  },
  {
    icon: Sparkles,
    title: "AI Learning Paths",
    description:
      "Adaptive study plans that respond to each student's pace, catching gaps before they compound.",
    tone: "violet",
  },
  {
    icon: MessageSquare,
    title: "Community Forums",
    description:
      "Threaded discussions, peer study groups, and campus announcements — moderated by faculty, searchable forever.",
    tone: "navy",
  },
];

const TONES = {
  navy:     { chip: "bg-navy-50 text-navy-800 ring-navy-100",      hover: "group-hover:bg-navy-800 group-hover:text-white group-hover:shadow-navy-glow",     bar: "bg-navy-800" },
  electric: { chip: "bg-electric-500/10 text-electric-600 ring-electric-500/20", hover: "group-hover:bg-electric-500 group-hover:text-white group-hover:shadow-glow-blue", bar: "bg-electric-500" },
  mint:     { chip: "bg-accent-mint/15 text-emerald-600 ring-accent-mint/25",    hover: "group-hover:bg-accent-mint group-hover:text-white group-hover:shadow-glow-mint", bar: "bg-accent-mint" },
  amber:    { chip: "bg-amber-100 text-amber-700 ring-amber-200",  hover: "group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-glow-amber",   bar: "bg-amber-500" },
  violet:   { chip: "bg-accent-violet/15 text-violet-700 ring-accent-violet/25", hover: "group-hover:bg-accent-violet group-hover:text-white group-hover:shadow-glow-violet", bar: "bg-accent-violet" },
};

/* Feature card — rises in, icon rotates, hotspot follows cursor */
function FeatureCard({ feature, index, baseDelay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [mouse, setMouse] = useState({ x: 50, y: 50, visible: false });
  const { icon: Icon, title, description, tone } = feature;
  const t = TONES[tone];

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      visible: true,
    });
  };
  const onLeave = () => setMouse((m) => ({ ...m, visible: false }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: baseDelay + index * 0.08, ease: EASE.smooth }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      {/* Cursor-following hotspot */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(260px circle at ${mouse.x}% ${mouse.y}%, ${tone === "navy" ? "rgba(26,42,113,0.06)" : tone === "electric" ? "rgba(14,165,233,0.08)" : tone === "mint" ? "rgba(52,211,153,0.08)" : tone === "amber" ? "rgba(245,158,11,0.08)" : "rgba(167,139,250,0.08)"}, transparent 60%)`,
          opacity: mouse.visible ? 1 : 0,
        }}
      />

      {/* Top accent bar */}
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar} opacity-70 transition-opacity group-hover:opacity-100`} />

      {/* Icon — rotates as it lands */}
      <motion.span
        initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
        animate={inView ? { opacity: 1, rotate: 0, scale: 1 } : {}}
        transition={{
          duration: 0.55,
          delay: baseDelay + index * 0.08 + 0.15,
          ease: EASE.overshoot,
        }}
        className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${t.chip} transition-all duration-300 ${t.hover}`}
      >
        <Icon size={22} strokeWidth={2.2} />
      </motion.span>

      <h3 className="relative text-lg font-semibold text-slate-900">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

      {/* Learn more — slides right on hover */}
      <div className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-800">
        Learn more
        <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="section-pad relative">
      <div className="container">
        <div ref={ref} className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE.smooth }}
            className="eyebrow mx-auto"
          >
            Platform capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
            className="h2 mt-5"
          >
            Everything a modern institution{" "}
            <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
              actually needs.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE.smooth }}
            className="body-lg mt-5"
          >
            Six core modules that replace the patchwork of tools most campuses juggle today.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} baseDelay={0.3} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE.smooth }}
          className="mt-14 flex justify-center"
        >
          <a
            href="#reach"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-navy-400 hover:text-navy-800"
          >
            See how it deploys
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}