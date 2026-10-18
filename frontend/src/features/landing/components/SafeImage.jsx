// frontend/src/features/landing/components/SafeImage.jsx
import { useState } from "react";
import { GraduationCap } from "lucide-react";

/**
 * <img> that never shows a broken-image icon: if the URL fails to load
 * it swaps itself for a tidy dark placeholder with the same className.
 */
export default function SafeImage({ src, alt, className = "", eager = false }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-ink-600 to-ink-800 text-sage-300 ${className}`}
      >
        <GraduationCap className="h-2/5 w-2/5" strokeWidth={1.6} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}