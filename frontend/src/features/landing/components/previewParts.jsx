import clsx from "clsx";

// Small hand-authored parts used by the ProductPreview. None of these
// fetch data — they render static markup that visually matches the real
// app so the landing hero feels like the product without wiring any
// live hooks. This keeps the landing page deterministic and light.

export function MiniPanel({ className, children }) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-ink-200 bg-white shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MiniProgress({ value, variant = "brand", animated = true }) {
  const BAR = {
    brand: "bg-brand-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
  };
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx(
          "h-full rounded-full",
          BAR[variant] || BAR.brand,
          animated && "landing-progress"
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function MiniSparkline({
  points = [4, 8, 6, 10, 9, 13, 15],
  width = 96,
  height = 28,
  stroke = "rgb(99 102 241)",
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const stepX = width / (points.length - 1 || 1);
  const scaleY = (v) => height - ((v - min) / (max - min || 1)) * height;

  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${i * stepX},${scaleY(v)}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MiniAvatar({ initials, color = "bg-brand-500" }) {
  return (
    <span
      className={clsx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
        color
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function MiniBadge({ tone = "brand", children }) {
  const TONE = {
    brand: "bg-brand-50 text-brand-700",
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-700",
    neutral: "bg-ink-100 text-ink-700",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        TONE[tone] || TONE.brand
      )}
    >
      {children}
    </span>
  );
}

export function MiniNotificationDot({ pulsing = true }) {
  return (
    <span className="relative inline-flex h-2 w-2" aria-hidden="true">
      {pulsing && (
        <span className="landing-pulse absolute inline-flex h-full w-full rounded-full bg-danger-500 opacity-60" />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-500" />
    </span>
  );
}
