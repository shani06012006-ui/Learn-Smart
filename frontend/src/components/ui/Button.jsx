const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-50";

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const variants = {
  primary:
    "bg-brand-500 text-white shadow-glow-blue hover:bg-brand-400 hover:shadow-glow-blue-lg",
  accent:
    "bg-gradient-to-r from-accent-400 to-accent-500 text-night-900 shadow-glow-gold hover:from-accent-300 hover:to-accent-400 hover:shadow-glow-gold-lg",
  secondary:
    "border border-white/10 bg-night-800/60 text-cream-100 backdrop-blur hover:border-brand-400/40 hover:bg-night-700/80 hover:text-brand-300",
  ghost: "text-cream-100 hover:bg-white/5",
  danger:
    "bg-red-500 text-white shadow-[0_0_30px_-8px_rgba(239,68,68,0.6)] hover:bg-red-400",
};

export default function Button({
  children, variant = "primary", size = "md", className = "", type = "button", ...props
}) {
  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}