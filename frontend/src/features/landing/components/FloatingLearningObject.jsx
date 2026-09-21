import clsx from "clsx";

// A single floating object that orbits the character in the hero (and other
// scenes). Fades/slides in with a small delay, then idles with a subtle
// vertical float. Position is controlled by the parent through className
// (e.g. "left-0 top-10"), which keeps positioning decisions near the layout
// that owns them.
//
// `shape` is a hint used to pick a default background/iconography. Pass
// `children` to render custom content instead.

export default function FloatingLearningObject({
  children,
  className,
  delay = 0,
  duration = 6000,
  shape = "card", // "card" | "chip" | "badge" | "sparkle"
  reveal = true,
}) {
  const SHAPE = {
    card: "rounded-xl bg-white border border-ink-200 shadow-lg p-3",
    chip: "rounded-full bg-white border border-ink-200 shadow-md px-3 py-1.5",
    badge: "rounded-2xl bg-brand-600 text-white shadow-lg p-2.5",
    sparkle: "rounded-full bg-white/80 backdrop-blur shadow-md p-2",
  };

  return (
    <div
      className={clsx(
        "landing-float-object pointer-events-none absolute",
        reveal && "is-revealed",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className={clsx(SHAPE[shape] || SHAPE.card)}>{children}</div>
    </div>
  );
}
