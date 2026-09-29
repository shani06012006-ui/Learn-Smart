import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// A soft blue→gold wipe that plays between route changes.
// Detects the location change and layers two panels that sweep across.
export default function PageTransition() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const [first, setFirst] = useState(true);

  useEffect(() => {
    // Skip on initial mount
    if (first) {
      setFirst(false);
      return;
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[300] overflow-hidden">
          {/* Panel 1 — blue */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-400"
          />
          {/* Panel 2 — gold, delayed */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            exit={{ x: "100%" }}
            transition={{
              duration: 0.85,
              delay: 0.08,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="absolute inset-0 bg-gradient-to-r from-accent-400 to-accent-300 mix-blend-screen"
          />
        </div>
      )}
    </AnimatePresence>
  );
}