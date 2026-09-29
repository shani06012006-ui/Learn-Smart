import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BookOpen, Video, BarChart3, Award, Sparkles, MessageSquare,
} from "lucide-react";
import TiltCard from "../components/TiltCard";

const FEATURES = [
  { icon: BookOpen, title: "Course Library", description: "Over 1,000 ready-to-learn classes across every subject and level.", tone: "brand" },
  { icon: Video, title: "Live Interactive Sessions", description: "Real-time classes with expert teachers, joinable from any device.", tone: "gold" },
  { icon: BarChart3, title: "Progress Tracking", description: "Every quiz, every grade, every milestone — visible in one place.", tone: "brand" },
  { icon: Award, title: "Verified Certificates", description: "Shareable certificates on completion, recognized by institutions.", tone: "gold" },
  { icon: Sparkles, title: "AI Learning Paths", description: "Personalized study plans that adapt to your pace and strengths.", tone: "brand" },
  { icon: MessageSquare, title: "Discussion Forums", description: "Ask questions, share insights, and learn alongside your peers.", tone: "gold" },
];

const TONES = {
  brand: {
    icon: "bg-brand-400/15 text-brand-300 ring-brand-400/30",
    hover: "group-hover:bg-brand-400 group-hover:text-white group-hover:shadow-glow-blue",
    line: "bg-brand-400",
  },
  gold: {
    icon: "bg-accent-400/15 text-accent-300 ring-accent-400/30",
    hover: "group-hover:bg-accent-400 group-hover:text-night-900 group-hover:shadow-glow-gold",
    line: "bg-accent-400",
  },
};

const EASE = [0.22, 1, 0.36, 1];

// Text mask reveal: each word rises from a clip mask
function MaskReveal({ text, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.1em" }}
        >
          <motion.span
            initial={{ y: "110%" }}
            animate={inView ? { y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

function FeatureCard({ feature, index, baseDelay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const { icon: Icon, title, description, tone } = feature;
  const t = TONES[tone];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay: baseDelay + index * 0.08,
        ease: EASE,
      }}
    >
      <TiltCard className="group h-full">
        <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-night-700/80 to-night-800/60 p-6 shadow-landing backdrop-blur-sm transition-all duration-300 hover:border-white/[0.15]">
          <div className={`absolute inset-x-0 top-0 h-px ${t.line} opacity-40 transition-opacity group-hover:opacity-100`} />

          {/* Icon — arrives slightly after the card, with a tiny overshoot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{
              duration: 0.5,
              delay: baseDelay + index * 0.08 + 0.15,
              ease: [0.34, 1.56, 0.64, 1], // overshoot
            }}
            className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${t.icon} transition-all duration-300 ${t.hover}`}
          >
            <Icon size={22} strokeWidth={2.2} />
          </motion.div>

          <h3 className="text-lg font-semibold text-cream-100">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-300">
            {description}
          </p>
        </div>
      </TiltCard>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-300"
          >
            Everything you need
          </motion.p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl md:text-5xl">
            <MaskReveal text="We Are Providing" delay={0.1} />{" "}
            <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">
              <MaskReveal text="Many Features" delay={0.25} />
            </span>{" "}
            <MaskReveal text="You Can Use" delay={0.4} />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            className="mt-4 text-base leading-relaxed text-muted-300"
          >
            A complete learning platform that brings courses, live sessions, progress, and community into one place.
          </motion.p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={i}
              baseDelay={0.3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}