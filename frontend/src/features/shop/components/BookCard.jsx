// frontend/src/features/shop/components/BookCard.jsx
import { Star } from "lucide-react";

/* Cover background gradients — one per index so the grid looks alive
   even before you paste image URLs. */
const COVER_GRADIENTS = [
  "from-[#2b2d42] to-[#8d99ae]",
  "from-[#f4a261] to-[#e76f51]",
  "from-[#e9ecef] to-[#adb5bd]",
  "from-[#a8dadc] to-[#457b9d]",
  "from-[#caffbf] to-[#9bf6ff]",
  "from-[#ffd6a5] to-[#fdffb6]",
  "from-[#bdb2ff] to-[#a0c4ff]",
  "from-[#ffc6ff] to-[#ffadad]",
  "from-[#0f0a2e] to-[#4433b8]",
  "from-[#ff8fab] to-[#fb6f92]",
  "from-[#cdb4db] to-[#ffc8dd]",
  "from-[#5e60ce] to-[#5390d9]",
];

export default function BookCard({ book, index = 0 }) {
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];

  return (
    <div className="group flex flex-col">
      {/* Cover tile */}
      <div
        className={`relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated`}
      >
        {/* Book cover image — paste your URL below */}
        {/* HERE IS YOUR IMAGE — book cover — paste a URL over the src */}
        <img
          src=""
          alt={book.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        {/* Fallback: a subtle spine + book silhouette so the tile
            reads as a book even when no image is set. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 140" className="h-1/2 w-1/2 text-white/40" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="12" y="10" width="76" height="120" rx="4" />
            <path d="M20 10v120" />
            <path d="M30 30h40M30 45h40M30 60h30" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Title + author + price + rating */}
      <div className="mt-4">
        <h3 className="font-display text-sm font-bold leading-snug text-navy-950 sm:text-base">
          {book.title}
        </h3>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-coral-500 sm:text-base">
            ${book.price.toFixed(2)}
          </span>
          <span className="flex items-center gap-0.5 text-amber-500">
            {[0, 1, 2, 3, 4].map((s) => (
              <Star key={s} size={11} fill="currentColor" />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}