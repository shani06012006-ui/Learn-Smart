// frontend/src/features/landing/components/BrandMark.jsx
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

/**
 * Light wordmark used on the dark hero + footer.
 * (The PNG logo has dark navy lettering, so it disappears on dark panels.)
 */
export default function BrandMark({ tone = "light", className = "" }) {
  const text = tone === "light" ? "text-white" : "text-ink-900";
  return (
    <Link
      to="/"
      aria-label="Learn Smart home"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-400 text-ink-950">
        <GraduationCap size={20} strokeWidth={2.2} />
      </span>
      <span className={`font-display text-lg font-bold tracking-tight ${text}`}>
        Learn Smart
      </span>
    </Link>
  );
}