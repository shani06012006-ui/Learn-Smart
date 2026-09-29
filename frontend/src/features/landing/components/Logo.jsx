import { GraduationCap } from "lucide-react";

export function LogoMark({ size = 40, className = "" }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-teal ${className}`}
    >
      <GraduationCap
        className="text-night-900"
        strokeWidth={2.5}
        size={Math.round(size * 0.55)}
      />
    </div>
  );
}

export function LogoWord({ className = "" }) {
  return (
    <span className={`font-bold tracking-tight text-cream-100 ${className}`}>
      Learn<span className="text-brand-400">Smart</span>
    </span>
  );
}

export function LogoFull({ size = 40, wordClass = "text-2xl", className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <LogoWord className={wordClass} />
    </div>
  );
}