import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

export default function IntroOverlay({ onDone }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShow(false);
      onDone?.();
      return;
    }
    const t = setTimeout(() => {
      setShow(false);
      onDone?.();
    }, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, delay: 0.5 } }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-night-950"
        >
          {/* neon nebula */}
          <div className="absolute -top-24 -left-24 h-96 w-96 animate-blob rounded-full bg-brand-500/20 blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 animate-blob rounded-full bg-accent-500/15 blur-[120px] [animation-delay:4s]" />

          {/* animated grid */}
          <div
            className="absolute inset-0 animate-grid-flow opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(46,230,200,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(46,230,200,0.06) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <motion.div
                layoutId="brand-logo"
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-blue-lg"
              >
                <GraduationCap size={32} className="text-night-900" strokeWidth={2.5} />
              </motion.div>
              <motion.div
                layoutId="brand-word"
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              >
                <span className="text-3xl font-bold tracking-tight text-cream-100">
                  Learn<span className="text-brand-400">Smart</span>
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-end gap-2 text-3xl font-semibold text-cream-100"
            >
              Hi
              <motion.span
                animate={{ rotate: [0, 25, -12, 25, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                style={{ originX: 0.7, originY: 0.9, display: "inline-block" }}
              >
                👋
              </motion.span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-muted-400"
            >
              Welcome to your learning journey
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}