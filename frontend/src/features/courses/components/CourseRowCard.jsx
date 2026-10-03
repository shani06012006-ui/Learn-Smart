// frontend/src/features/courses/components/CourseRowCard.jsx
import { useEffect, useRef, useState } from "react";
import { Star, Clock, PlayCircle } from "lucide-react";

function FadeImg({ src, alt, className = "" }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [src]);

  if (!src || failed) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ${
        loaded ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}

export default function CourseRowCard({ course, active = false }) {
  return (
    <article
      className={`group flex items-center gap-4 rounded-3xl border p-3 transition-[box-shadow,border-color,background-color] duration-300 ${
        active
          ? "border-purple-200 bg-purple-50/50 shadow-purple-glow"
          : "border-slate-100 bg-white hover:border-purple-200 hover:shadow-card"
      }`}
    >
      {/* IMAGE SPACE — set `image` on the course */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-paper-100 sm:h-28 sm:w-32">
        <FadeImg src={course.image} alt={course.title} className="group-hover:scale-105" />
      </div>

      <div className="min-w-0 flex-1">
        {course.category && (
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-500">
            {course.category}
          </span>
        )}
        <h3 className="mt-1.5 truncate font-display text-sm font-extrabold text-navy-950 sm:text-base">
          {course.title}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Star size={12} className="fill-orange-400 text-orange-400" />
            {course.rating ?? "4.8"}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle size={12} />
            {course.lessons ?? 24} lessons
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {course.hours ?? 12}h
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 pr-2">
        <span className="font-display text-base font-extrabold text-navy-950">${course.price.toFixed(2)}</span>
        <button
          type="button"
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            active
              ? "bg-coral-500 text-white shadow-coral-glow"
              : "bg-paper-100 text-purple-500 hover:bg-purple-500 hover:text-white"
          }`}
        >
          Enroll
        </button>
      </div>
    </article>
  );
}