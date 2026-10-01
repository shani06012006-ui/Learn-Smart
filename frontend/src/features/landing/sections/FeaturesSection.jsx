import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Video, BarChart3, Users } from "lucide-react";
import { EASE } from "../motion";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Unified Course Management",
    description: "Author courses, assign grading, and organize curricula easily — across departments and semesters.",
    tone: "navy",
  },
  {
    icon: Video,
    title: "Interactive Live Classrooms",
    description: "Integrated virtual lecture halls with attendance tracking, chat, and recorded archives.",
    tone: "electric",
  },
  {
    icon: BarChart3,
    title: "Automated Analytics",
    description: "Deep real-time reporting on student performance and institutional KPIs.",
    tone: "mint",
  },
  {
    icon: Users,
    title: "Role-Based Portals",
    description: "Tailored experiences for Admins, Professors, Students, and Parents — all from one system.",
    tone: "violet",
  },
];

const TONES = {
  navy:     { chip: "bg-navy-50 text-navy-800 ring-navy-100",         bar: "bg-navy-800" },
  electric: { chip: "bg-electric-500/10 text-electric-700 ring-electric-500/20", bar: "bg-electric-500" },
  mint:     { chip: "bg-accent-mint/15 text-emerald-700 ring-accent-mint/25",   bar: "bg-accent-mint" },
  violet:   { chip: "bg-accent-violet/15 text-violet-700 ring-accent-violet/25", bar: "bg-accent-violet" },
};

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { icon: Icon, title, description, tone } = feature;
  const t = TONES[tone];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: EASE.smooth }}
      className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      {/* top accent bar */}
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar} opacity-70 transition-opacity group-hover:opacity-100`} />

      <span className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${t.chip}`}>
        <Icon size={22} strokeWidth={2.2} />
      </span>

      <h3 className="text-base font-semibold leading-snug text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="section-pad relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div ref={ref} className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE.smooth }}
            className="eyebrow"
          >
            Platform capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
            className="h2 mt-5"
          >
            Engineered for Modern{" "}
            <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
              Academic Excellence.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE.smooth }}
            className="body-lg mt-5"
          >
            Everything an institution needs to deliver, manage, and measure teaching — in one integrated platform.
          </motion.p>
        </div>

        {/* 4-column grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}