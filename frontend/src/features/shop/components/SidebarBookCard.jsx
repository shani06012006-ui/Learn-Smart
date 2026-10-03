// frontend/src/features/shop/components/SidebarBookCard.jsx
import { Star } from "lucide-react";

const GRADIENTS = [
  "from-[#2b2d42] to-[#8d99ae]",
  "from-[#f4a261] to-[#e76f51]",
  "from-[#a8dadc] to-[#457b9d]",
];

export default function SidebarBookCard({ book, index = 0 }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-card transition-all hover:shadow-elevated">
      {/* Thumbnail */}
      <div className={`relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${gradient}`}>
        {/* HERE IS YOUR IMAGE — sidebar book thumbnail — paste a URL over the src */}
        <img
          src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=120&q=80"
          alt={book.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <svg viewBox="0 0 30 40" className="h-8 w-6 text-white/50" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="4" y="3" width="22" height="34" rx="2" />
          <path d="M8 3v34" />
        </svg>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-0.5 text-amber-500">
          {[0, 1, 2, 3, 4].map((s) => (
            <Star key={s} size={10} fill="currentColor" />
          ))}
        </div>
        <h4 className="mt-1.5 text-xs font-bold leading-snug text-navy-950 line-clamp-2">
          {book.title}
        </h4>
        <p className="text-[11px] text-slate-500 line-clamp-1">
          by {book.author}
        </p>
        <p className="mt-1 text-xs font-bold text-coral-500">
          ${book.price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}