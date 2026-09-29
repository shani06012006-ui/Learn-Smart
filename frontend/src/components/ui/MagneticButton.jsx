import { useRef, useState } from "react";

export default function MagneticButton({
  children,
  onClick,
  variant = "accent",
  className = "",
  strength = 0.35,
}) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    setOffset({ x: x * strength, y: y * strength });
  };

  const onLeave = () => setOffset({ x: 0, y: 0 });

  const base =
    "group relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus:outline-none overflow-hidden";
  const styles =
    variant === "accent"
      ? "bg-accent-500 text-white hover:bg-accent-600 shadow-landing"
      : "border border-ink-200 bg-white text-ink-800 hover:border-accent-300 hover:text-accent-700";

  return (
    <button
      ref={ref}
      data-magnetic
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={`${base} ${styles} ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}