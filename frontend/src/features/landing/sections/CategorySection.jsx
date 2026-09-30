import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, FlaskConical, Calculator, Languages, Code2,
} from "lucide-react";
import ScrambleText from "../components/ScrambleText";

const CATEGORIES = [
  { icon: FlaskConical, name: "Science & Engineering", courses: 120, tone: "brand", copy: "Physics, Chemistry, Biology, Engineering fundamentals" },
  { icon: Calculator,   name: "Mathematics",           courses: 85,  tone: "gold",  copy: "Algebra, Calculus, Statistics, Geometry" },
  { icon: Languages,    name: "Languages",             courses: 60,  tone: "brand", copy: "English, Spanish, French, Mandarin, and more" },
  { icon: Code2,        name: "Programming & Tech",    courses: 150, tone: "gold",  copy: "Python, JavaScript, Web Development, AI/ML" },
];

const TONES = {
  brand: {
    iconBg: "bg-brand-500/15 text-brand-600 ring-brand-400/30",
    glow: "hover:shadow-glow-indigo",
    line: "bg-brand-500",
    chip: "bg-brand-500/15 text-brand-600",
  },
  gold: {
    iconBg: "bg-accent-500/15 text-accent-600 ring-accent-400/30",
    glow: "hover:shadow-glow-peach",
    line: "bg-accent-500",
    chip: "bg-accent-500/15 text-accent-600",
  },
};

// One card. It computes its own distance from the visual center of the
// viewport-x and scales up when it's near the middle.
function Card({ index, total, progress, data }) {
  const { icon: Icon, name, courses, tone, copy } = data;
  const t = TONES[tone];

  // The card's "position along the scroll" — 0 when first, 1 when last
  const start = index / total;
  const end = (index + 1) / total;

  // Scale bumps from 0.94 → 1.02 → 0.94 as the card crosses the middle band
  const scale = useTransform(
    progress,
    [Math.max(0, start - 0.1), (start + end) / 2, Math.min(1, end + 0.1)],
    [0.94, 1.02, 0.94]
  );

  // Slight opacity dip at the very edges
  const opacity = useTransform(
    progress,
    [Math.max(0, start - 0.15), (start + end) / 2, Math.min(1, end + 0.15)],
    [0.55, 1, 0.55]
  );

  // Rotate levels out when centered
  const rotateZ = useTransform(
    progress,
    [Math.max(0, start - 0.1), (start + end) / 2, Math.min(1, end + 0.1)],
    [tone === "brand" ? -4 : 4, 0, tone === "brand" ? -4 : 4]
  );

  return (
    <motion.div
      style={{ scale, opacity, rotate: rotateZ }}
      className="group relative w-[320px] shrink-0 sm:w-[380px]"
    >
      <button
        type="button"
        className={`flex h-full w-full flex-col items-start gap-5 rounded-3xl border border-ink-200 bg-gradient-to-br from-night-700/90 to-night-800/70 p-7 text-left shadow-landing-lg backdrop-blur-sm transition-all duration-300 hover:border-ink-300 ${t.glow}`}
      >
        <div className={`absolute inset-x-0 top-0 h-px ${t.line} opacity-40 transition-opacity group-hover:opacity-100`} />

        <span className="absolute right-5 top-5 text-[64px] font-bold leading-none text-white/[0.03] sm:text-[80px]">
          0{index + 1}
        </span>

        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${t.iconBg}`}>
          <Icon size={26} strokeWidth={2.2} />
        </span>

        <div className="flex-1">
          <h3 className="text-lg font-semibold leading-snug text-ink-900 sm:text-xl">
            {name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            {copy}
          </p>
        </div>

        <div className="flex w-full items-center justify-between border-t border-ink-200 pt-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${t.chip}`}>
            {courses} courses
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-900 opacity-60 transition-opacity group-hover:opacity-100">
            Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>
    </motion.div>
  );
}

export default function CategorySection() {
  const wrapperRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  // Track slides horizontally
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);

  // Header fades near the end
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [1, 1, 1, 0.5]);

  // Progress bar under the header
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const total = CATEGORIES.length;

  return (
    <section
      id="categories"
      ref={wrapperRef}
      className="relative"
      // 180vh = 1.8 screens of pinned scroll
      style={{ height: "180vh" }}
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          style={{ opacity: headerOpacity }}
          className="mx-auto w-full max-w-7xl px-6 pt-16 lg:px-8"
        >
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-600">
                Browse by subject
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
                Choose the{" "}
                <span className="bg-gradient-to-r from-accent-500 to-brand-500 bg-clip-text text-transparent">
                  <ScrambleText text="Category" delay={200} />
                </span>{" "}
                You Want
              </h2>
              <p className="mt-3 max-w-lg text-sm text-ink-600 sm:text-base">
                Scroll to explore — the cards slide as you go.
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                Scroll →
              </span>
              <div className="relative h-1 w-32 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  style={{ scaleX: progressScaleX, originX: 0 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400 to-accent-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Track */}
        <div className="relative flex flex-1 items-center">
          <motion.div
            style={{ x }}
            className="flex gap-6 pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pr-24"
          >
            {CATEGORIES.map((data, i) => (
              <Card
                key={data.name}
                index={i}
                total={total}
                progress={scrollYProgress}
                data={data}
              />
            ))}

            {/* end cap */}
            <div className="flex w-[220px] shrink-0 items-center justify-center">
              <a
                href="#features"
                className="group flex h-40 w-40 flex-col items-center justify-center gap-3 rounded-full border border-ink-200 bg-paper-200/60 text-center backdrop-blur-sm transition-all hover:border-brand-400/40 hover:bg-white/90"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 ring-1 ring-brand-400/30 transition-all group-hover:bg-brand-500 group-hover:text-white group-hover:shadow-glow-indigo">
                  <ArrowRight size={18} />
                </span>
                <span className="text-xs font-semibold text-ink-900">
                  View all subjects
                </span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}