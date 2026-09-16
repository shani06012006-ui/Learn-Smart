import clsx from "clsx";

const VARIANTS = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
};

export default function Badge({ variant = "neutral", dot = false, className, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-success-500",
            variant === "warning" && "bg-warning-500",
            variant === "danger" && "bg-danger-500",
            variant === "brand" && "bg-brand-500",
            variant === "neutral" && "bg-ink-500"
          )}
        />
      )}
      {children}
    </span>
  );
}
