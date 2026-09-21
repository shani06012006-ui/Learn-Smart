import clsx from "clsx";

import { useScrollReveal } from "../../../hooks/useScrollReveal";

// A spacious scene wrapper for the landing page. Gives each major section
// its own reveal state and consistent vertical rhythm, so scenes feel like
// distinct moments instead of stacked cards.
//
// `full` makes the section occupy at least 80% of the viewport on desktop,
// which is what gives the page its "one idea per viewport" pacing.
//
// `tone` picks the background: "plain" | "muted" | "brand".
export default function LearningScene({
  id,
  eyebrow,
  title,
  subtitle,
  tone = "plain",
  full = false,
  className,
  children,
}) {
  const { ref, revealed } = useScrollReveal({ threshold: 0.1 });

  const TONE = {
    plain: "bg-white",
    muted: "bg-ink-100/40",
    brand: "bg-brand-50/40",
  };

  return (
    <section
      id={id}
      ref={ref}
      className={clsx(
        "relative border-t border-ink-200 py-24 md:py-32",
        full && "lg:min-h-[80vh] lg:flex lg:items-center",
        TONE[tone] || TONE.plain,
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        {(eyebrow || title || subtitle) && (
          <header
            className={clsx(
              "mx-auto max-w-2xl",
              revealed ? "landing-reveal is-visible" : "landing-reveal"
            )}
          >
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-base leading-relaxed text-ink-500 md:text-lg">
                {subtitle}
              </p>
            )}
          </header>
        )}

        <div className="mt-14 md:mt-16">{children}</div>
      </div>
    </section>
  );
}

export function useSceneReveal() {
  return useScrollReveal({ threshold: 0.12 });
}
