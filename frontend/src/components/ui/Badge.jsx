// frontend/src/components/ui/Badge.jsx
const VARIANTS = {
  brand:   "bg-purple-50 text-purple-600 ring-1 ring-purple-100",
  success: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  danger:  "bg-coral-50 text-coral-600 ring-1 ring-coral-100",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const DOTS = {
  brand:   "bg-purple-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-coral-500",
  neutral: "bg-slate-400",
};

export default function Badge({ children, variant = "neutral", dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        VARIANTS[variant] || VARIANTS.neutral
      }`}
    >
      {dot && (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            DOTS[variant] || DOTS.neutral
          }`}
        />
      )}
      {children}
    </span>
  );
}