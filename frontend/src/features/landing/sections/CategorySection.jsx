import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, FlaskConical, Calculator, Languages, Code2,
} from "lucide-react";

const CATEGORIES = [
  { icon: FlaskConical, name: "Science & Engineering", courses: 120, tone: "brand", copy: "Physics, Chemistry, Biology, Engineering fundamentals" },
  { icon: Calculator, name: "Mathematics", courses: 85, tone: "gold", copy: "Algebra, Calculus, Statistics, Geometry" },
  { icon: Languages, name: "Languages", courses: 60, tone: "brand", copy: "English, Spanish, French, Mandarin, and more" },
  { icon: Code2, name: "Programming & Tech", courses: 150, tone: "gold", copy: "Python, JavaScript, Web Development, AI/ML" },
];

const TONES = {
  brand: {
    iconBg: "bg-brand-400/15 text-brand-300 ring-brand-400/30",
    glow: "hover:shadow-glow-blue",
    line: "bg-brand-400",
    chip: "bg-brand-400/15 text-brand-300",
  },
  gold: {
    iconBg: "bg-accent-400/15 text-accent-300 ring-accent-400/30",
    glow: "hover:shadow-glow-gold",
    line: "bg-accent-400",
    chip: "bg-accent-400/15 text-accent-300",
  },
};

export default function CategorySection() {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);

  // Progress through the outer wrapper: 0 when it enters viewport, 1 when it leaves
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  // Track slides horizontally. -66% ≈ moves 4 cards wide (~66% of the row)
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66%"]);

  // Subtle: header opacity fades as cards progress
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [1, 1, 1, 0.6]);

  // Progress bar under the header fills as you scroll
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="categories"
      ref={wrapperRef}
      className="relative"
      // 250vh = 1 full viewport of "pin time"
      style={{ height: "250vh" }}
    >
      {/* Sticky viewport — this is what stays pinned */}
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          style={{ opacity: headerOpacity }}
          className="mx-auto w-full max-w-7xl px-6 pt-20 lg:px-8"
        >
          <div className="flex items-end justify-between gap-6">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-300"
              >
                Browse by subject
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl md:text-5xl"
              >
                Choose the{" "}
                <span className="bg-gradient-to-r from-accent-300 to-brand-300 bg-clip-text text-transparent">
                  Category
                </span>{" "}
                You Want
              </motion.h2>
              <p className="mt-4 max-w-lg text-sm text-muted-300 sm:text-base">
                Scroll to explore — the cards slide as you go.
              </p>
            </div>

            {/* Progress pill */}
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-400">
                Scroll →
              </span>
              <div className="relative h-1 w-32 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  style={{ scaleX: progressScaleX, originX: 0 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400 to-accent-400"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Horizontal track ───────────────────────────────── */}
        <div className="relative flex flex-1 items-center">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex gap-6 pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pr-24"
          >
            {CATEGORIES.map(({ icon: Icon, name, courses, tone, copy }, i) => {
              const t = TONES[tone];
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 40, scale: 0.94 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group relative w-[320px] shrink-0 sm:w-[380px]"
                >
                  <button
                    type="button"
                    className={`flex h-full w-full flex-col items-start gap-5 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-night-700/90 to-night-800/70 p-7 text-left shadow-landing-lg backdrop-blur-sm transition-all duration-300 hover:border-white/[0.15] ${t.glow}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-px ${t.line} opacity-40 transition-opacity group-hover:opacity-100`} />

                    {/* Big number in the corner */}
                    <span className="absolute right-5 top-5 text-[64px] font-bold leading-none text-white/[0.04] sm:text-[80px]">
                      0{i + 1}
                    </span>

                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${t.iconBg}`}>
                      <Icon size={26} strokeWidth={2.2} />
                    </span>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold leading-snug text-cream-100 sm:text-xl">
                        {name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-400">
                        {copy}
                      </p>
                    </div>

                    <div className="flex w-full items-center justify-between border-t border-white/[0.08] pt-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${t.chip}`}>
                        {courses} courses
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-cream-100 opacity-60 transition-opacity group-hover:opacity-100">
                        Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                </motion.div>
              );
            })}

            {/* end cap — a "view all" tile */}
            <div className="flex w-[220px] shrink-0 items-center justify-center">
              <a
                href="#features"
                className="group flex h-40 w-40 flex-col items-center justify-center gap-3 rounded-full border border-white/[0.08] bg-night-800/40 text-center backdrop-blur-sm transition-all hover:border-brand-400/40 hover:bg-night-700/60"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-400/15 text-brand-300 ring-1 ring-brand-400/30 transition-all group-hover:bg-brand-400 group-hover:text-white group-hover:shadow-glow-blue">
                  <ArrowRight size={18} />
                </span>
                <span className="text-xs font-semibold text-cream-100">
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