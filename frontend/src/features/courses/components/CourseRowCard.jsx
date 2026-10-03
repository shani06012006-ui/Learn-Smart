// frontend/src/features/courses/components/CourseRowCard.jsx
import { Star, ShoppingBag } from "lucide-react";

/* Placeholder gradient per index so the tile reads as an image before
   you paste a URL. */
const GRADIENTS = [
  "from-[#2b2d42] to-[#8d99ae]",
  "from-[#f4a261] to-[#e76f51]",
  "from-[#a8dadc] to-[#457b9d]",
  "from-[#ffd6a5] to-[#fdffb6]",
  "from-[#caffbf] to-[#9bf6ff]",
  "from-[#bdb2ff] to-[#a0c4ff]",
  "from-[#ffc6ff] to-[#ffadad]",
  "from-[#0f0a2e] to-[#4433b8]",
];

export default function CourseRowCard({ course, index = 0, active = false }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated sm:p-4">
      {/* Image */}
      <div className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${gradient} sm:w-28`}>
        {/* HERE IS YOUR IMAGE — course thumbnail — paste a URL over the src */}
        <img
          src=""
          alt={course.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {/* Fallback silhouette */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 60 60" className="h-8 w-8 text-white/40" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="30" cy="20" r="8" />
            <path d="M12 52c0-10 8-16 18-16s18 6 18 16" />
          </svg>
        </div>
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-sm font-bold text-navy-950 sm:text-base">
          {course.title}
        </h3>
        <div className="mt-1 flex items-center gap-0.5 text-amber-500">
          {[0, 1, 2, 3, 4].map((s) => (
            <Star key={s} size={11} fill="currentColor" />
          ))}
        </div>
        <p className="mt-1.5 text-sm font-bold text-coral-500 sm:text-base">
          ${course.price.toFixed(2)}
        </p>
      </div>

      {/* Cart button — purple when active, outlined otherwise */}
      <button
        type="button"
        aria-label={`Add ${course.title} to cart`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
          active
            ? "bg-purple-500 text-white shadow-purple-glow hover:bg-purple-600"
            : "bg-purple-50 text-purple-500 ring-1 ring-purple-100 hover:bg-purple-100"
        }`}
      >
        <ShoppingBag size={16} />
      </button>
    </div>
  );
}