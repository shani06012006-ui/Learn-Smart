import { useEffect, useState } from "react";

// The ids of sections in order. Every section already has an id.
const SECTIONS = [
  { id: "hero",         label: "Home" },
  { id: "trust",        label: "Trusted" },
  { id: "features",     label: "Features" },
  { id: "categories",   label: "Categories" },
  { id: "profile",      label: "Profile" },
  { id: "testimonials", label: "Reviews" },
];

export default function SectionIndicator() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = els.indexOf(entry.target);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      // Trigger when a section is roughly in the top third of the viewport
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-6 top-1/2 z-[60] hidden -translate-y-1/2 select-none flex-col items-end gap-4 lg:flex"
    >
      {/* Current number */}
      <div className="flex items-baseline gap-1 text-cream-100">
        <span className="font-mono text-3xl font-bold tabular-nums leading-none">
          {String(active + 1).padStart(2, "0")}
        </span>
        <span className="font-mono text-xs text-muted-400">
          / {String(SECTIONS.length).padStart(2, "0")}
        </span>
      </div>

      {/* Section dots */}
      <div className="flex flex-col items-end gap-2">
        {SECTIONS.map((s, i) => (
          <div key={s.id} className="group flex items-center gap-2">
            <span
              className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${
                i === active ? "text-brand-300" : "text-muted-500"
              }`}
            >
              {s.label}
            </span>
            <span
              className={`block h-px transition-all duration-500 ${
                i === active
                  ? "w-8 bg-gradient-to-r from-brand-400 to-accent-400"
                  : "w-4 bg-white/15"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}