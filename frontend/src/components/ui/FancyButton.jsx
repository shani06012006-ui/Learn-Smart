import { motion } from "framer-motion";

export default function FancyButton({ children, onClick, variant = "accent", className = "", type = "button" }) {
  const base =
    "group relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 overflow-hidden";
  const styles =
    variant === "accent"
      ? "bg-accent-500 text-white hover:bg-accent-600 shadow-landing"
      : "border border-ink-200 bg-white text-ink-800 hover:border-accent-300 hover:text-accent-700";

  return (
    <motion.button
      type={type}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}