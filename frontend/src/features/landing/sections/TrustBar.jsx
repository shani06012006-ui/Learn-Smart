import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const INSTITUTIONS = [
  "Greenwood High",
  "Northwood Academy",
  "Riverdale Institute",
  "Zaitoon International",
  "St. Xavier College",
  "Sunrise Public School",
];

const EASE = [0.22, 1, 0.36, 1];

export default function TrustBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="trust"
      aria-label="Trusted by institutions"
      className="relative overflow-hidden border-y border-white/[0.06] bg-night-800/40 py-14 backdrop-blur-sm"
    >
      {/* soft top edge glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Eyebrow line with animated underline under "200+" */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-400"
        >
          Trusted by{" "}
          <span className="relative inline-block">
            <span className="text-brand-300">200+</span>
            <motion.span
              aria-hidden
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
              style={{ originX: 0 }}
              className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-brand-400 to-accent-400"
            />
          </span>{" "}
          institutions worldwide
        </motion.p>

        {/* Cascade: names slide in from the right, staggered */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {INSTITUTIONS.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, x: 60, filter: "blur(6px)" }}
              animate={
                inView
                  ? { opacity: 1, x: 0, filter: "blur(0px)" }
                  : {}
              }
              transition={{
                duration: 0.65,
                delay: 0.15 + i * 0.09,
                ease: EASE,
              }}
              whileHover={{
                scale: 1.06,
                color: "rgb(165, 180, 252)",
                transition: { duration: 0.2 },
              }}
              className="select-none text-base font-semibold tracking-tight text-muted-400 opacity-70 sm:text-lg"
            >
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}