import { motion } from "framer-motion";
import { EASE, DURATION } from "../motion";

export default function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = DURATION.reveal,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      // -50px margin means reveal begins before the element is fully in view
      // → sections overlap, no "dead scroll" between them
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration, delay, ease: EASE.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}