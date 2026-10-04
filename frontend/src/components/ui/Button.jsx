// frontend/src/components/ui/Button.jsx
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const variants = {
  primary:
    "bg-purple-500 text-white shadow-purple-glow hover:bg-purple-600 hover:-translate-y-0.5",
  accent:
    "bg-gradient-to-r from-coral-400 to-coral-500 text-white shadow-coral-glow hover:from-coral-300 hover:to-coral-400",
  secondary:
    "border border-slate-200 bg-white text-navy-950 hover:border-slate-300 hover:bg-slate-50",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-navy-950",
  danger:
    "bg-coral-500 text-white shadow-coral-glow hover:bg-coral-600",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path
            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
            fill="currentColor"
          />
        </svg>
      )}
      {children}
    </button>
  );
}