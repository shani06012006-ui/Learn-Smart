// frontend/src/features/landing/sections/DarkCtaSection.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/* Small floating app tiles around the man (reference shows a Windows
   tile, an Excel-like tile, and one more). We approximate with simple
   inline SVGs so no external assets are needed. */
const FLOATING_ICONS = [
  {
    id: "windows",
    top: "8%",
    left: "10%",
    rotate: -6,
    delay: 0.7,
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M3 5.5 10.5 4.5v7H3v-6Zm8.5-1.2L21 3v8.5h-9.5V4.3ZM3 12.5h7.5v7L3 18.5v-6Zm8.5 0H21V21l-9.5-1.3v-7.2Z" />
      </svg>
    ),
    color: "text-[#0078D4]",
    bg: "bg-white",
  },
  {
    id: "excel",
    top: "42%",
    left: "4%",
    rotate: 4,
    delay: 0.85,
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M14 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9h-6V3Zm3.5 9.5h-3v2h3v-2Zm-4.5 0H10v2h3v-2Zm-4.5 0H6v2h2.5v-2Zm9 3.5h-3v2h3v-2Zm-4.5 0H10v2h3v-2Zm-4.5 0H6v2h2.5v-2Z" />
      </svg>
    ),
    color: "text-[#1D6F42]",
    bg: "bg-white",
  },
  {
    id: "pen",
    top: "14%",
    left: "82%",
    rotate: 8,
    delay: 1.0,
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m12 19 7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586" strokeLinecap="round" />
      </svg>
    ),
    color: "text-coral-500",
    bg: "bg-white",
  },
  {
    id: "shield",
    top: "70%",
    left: "86%",
    rotate: -4,
    delay: 1.15,
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-purple-500",
    bg: "bg-white",
  },
];

export default function DarkCtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="dark-cta" className="section-pad relative overflow-hidden">
      <div ref={ref} className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-[2.5rem] bg-dark-panel px-6 py-12 sm:px-10 md:px-14 md:py-16"
        >
          {/* Subtle glow at edges */}
          <div aria-hidden className="pointer-events-none absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-coral-500/10 blur-3xl" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* ── LEFT — copy ──────────────────────────────────── */}
            <div className="min-w-0">
              {/* Eyebrow pill */}
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                className="inline-flex items-center rounded-full bg-purple-500/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-200 ring-1 ring-purple-400/30"
              >
                College Level
              </motion.span>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
                className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
              >
                Don't waste time in{" "}
                <span className="text-coral-400">COVID-19 pandemic</span>.
                Develop your skills.
              </motion.h2>

              {/* Body */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base"
              >
                High-definition video is video of higher resolution and quality
                than standard-definition. While there is no standardized meaning
                for high-definition, generally any video.
              </motion.p>

              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.35, ease: EASE }}
                className="mt-8"
              >
                <a
                  href="#register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-500 px-7 py-3.5 text-sm font-bold text-white shadow-purple-glow transition-all hover:bg-purple-400 hover:-translate-y-0.5"
                >
                  Registration Now
                </a>
              </motion.div>
            </div>

            {/* ── RIGHT — man at desk + floating icons + dotted accent ── */}
            <div className="relative min-w-0">
              {/* Dotted purple pattern behind */}
              <div
                aria-hidden
                className="dot-pattern-purple absolute -top-4 left-1/4 hidden h-24 w-32 sm:block"
              />

              {/* Photo — replace with your URL */}
              {/* HERE IS YOUR IMAGE — man at desk — paste a URL below */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
                className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-3xl"
              >
                <img
                  src="https://i.pinimg.com/736x/d9/de/14/d9de14a39bdb9366463e63d475241c3e.jpg"
                  alt="Developer at desk"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </motion.div>

              {/* Floating icon tiles */}
              {FLOATING_ICONS.map((icon) => (
                <motion.div
                  key={icon.id}
                  initial={{ opacity: 0, scale: 0.5, rotate: icon.rotate - 20 }}
                  animate={{ opacity: 1, scale: 1, rotate: icon.rotate }}
                  transition={{ duration: 0.55, delay: icon.delay, ease: EASE }}
                  style={{ top: icon.top, left: icon.left }}
                  className="absolute z-20 hidden sm:block"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${icon.bg} ${icon.color} shadow-elevated ring-1 ring-slate-100 animate-float`}
                    style={{ animationDelay: `${icon.delay}s` }}
                  >
                    {icon.svg}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
