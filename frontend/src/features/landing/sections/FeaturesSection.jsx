import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  BookOpen, Video, BarChart3, Award, Sparkles, MessageSquare,
} from "lucide-react";

const FEATURES = [
  { icon: BookOpen,     title: "Course Library",            description: "Over 1,000 ready-to-learn classes across every subject and level.", tone: "brand" },
  { icon: Video,        title: "Live Interactive Sessions", description: "Real-time classes with expert teachers, joinable from any device.", tone: "peach" },
  { icon: BarChart3,    title: "Progress Tracking",         description: "Every quiz, every grade, every milestone — visible in one place.", tone: "brand" },
  { icon: Award,        title: "Verified Certificates",     description: "Shareable certificates on completion, recognized by institutions.", tone: "mint"  },
  { icon: Sparkles,     title: "AI Learning Paths",         description: "Personalized study plans that adapt to your pace and strengths.", tone: "peach" },
  { icon: MessageSquare,title: "Discussion Forums",         description: "Ask questions, share insights, and learn alongside your peers.", tone: "brand" },
];

const TONES = {
  brand: { icon: "bg-brand-50 text-brand-600 ring-brand-100", hotspot: "rgba(91,110,245,0.10)" },
  peach: { icon: "bg-accent-50 text-accent-600 ring-accent-100", hotspot: "rgba(249,166,115,0.14)" },
  mint:  { icon: "bg-mint-400/15 text-mint-600 ring-mint-400/30", hotspot: "rgba(125,211,160,0.14)" },
};

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [mouse, setMouse] = useState({ x: 50, y: 50, visible: false });
  const t = TONES[feature.tone];

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      visible: true,
    });
  };
  const onMouseLeave = () => setMouse((m) => ({ ...m, visible: false }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative h-full overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-landing transition-all duration-300 hover:-translate-y-1 hover:shadow-landing-lg"
    >
      {/* Cursor-reactive hotspot */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(220px circle at ${mouse.x}% ${mouse.y}%, ${t.hotspot}, transparent 60%)`,
          opacity: mouse.visible ? 1 : 0,
        }}
      />

      <span className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${t.icon} transition-transform duration-300 group-hover:scale-105`}>
        <feature.icon size={22} strokeWidth={2.2} />
      </span>

      <h3 className="relative text-lg font-semibold text-ink-900">{feature.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-ink-500">
        {feature.description}
      </p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="section-pad relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-600">
            Everything you need
          </p>
          <h2 className="section-heading-gap text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
            We Are Providing Many{" "}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              Features
            </span>{" "}
            You Can Use
          </h2>
          <p className="section-sub text-base leading-relaxed text-ink-500">
            A complete learning platform that brings courses, live sessions, progress, and community into one place.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}