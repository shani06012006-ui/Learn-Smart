import clsx from "clsx";

// Canonical card primitive. Two variants:
//   - default: static card (bordered, subtle shadow)
//   - interactive: same, plus hover shadow + focus ring for clickable cards
//
// Intentionally small. It wraps the padding/border/shadow that were being
// repeated by hand across the app. If a screen needs a genuinely different
// card shape, it should NOT be forced through this component -- drop back
// to raw Tailwind for one-offs.
export default function Card({
  as: Tag = "div",
  interactive = false,
  padding = "md", // 'sm' | 'md' | 'lg' | 'none'
  className,
  children,
  ...rest
}) {
  const PADDING = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <Tag
      className={clsx(
        "rounded-card border border-ink-300 bg-white shadow-card",
        PADDING[padding] || PADDING.md,
        interactive &&
          "focus-ring cursor-pointer transition-shadow hover:shadow-card-hover",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
