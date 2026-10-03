// frontend/src/features/courses/components/StandardCard.jsx
import { motion } from "framer-motion";
import { EASE } from "../../landing/motion";

export default function StandardCard({ card, index = 0, inView = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.15 + index * 0.04, ease: EASE.smooth }}
      className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-5 py-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      {/* Number badge */}
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-black text-white shadow-soft ${card.badge}`}
      >
        {card.n}
      </span>

      {/* Title */}
      <h3 className="mt-4 font-display text-base font-extrabold text-navy-950 sm:text-lg">
        {card.title}
      </h3>

      {/* Body */}
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 sm:text-sm">
        {card.body}
      </p>

      {/* Class Details button */}
      <button
        type="button"
        className={`mt-5 inline-flex items-center justify-center rounded-full border-2 px-4 py-2 text-[11px] font-bold transition-all sm:text-xs ${
          card.active
            ? "border-purple-500 bg-purple-500 text-white shadow-purple-glow hover:bg-purple-600"
            : "border-purple-200 bg-white text-purple-600 hover:border-purple-400 hover:bg-purple-50"
        }`}
      >
        Class Details
      </button>
    </motion.div>
  );
}