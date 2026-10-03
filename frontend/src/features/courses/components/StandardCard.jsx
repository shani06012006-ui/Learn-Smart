// frontend/src/features/courses/components/StandardCard.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

/* Image that fades in once loaded (no pop-in) and hides itself if the URL fails */
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

export default function StandardCard({ card, href }) {
  const body = (
    <>
      {/* IMAGE SPACE — set `image` on the card in STANDARDS */}
      <div className="relative">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-purple-100 to-paper-100">
          <FadeImg src={card.image} alt={card.title} className="group-hover:scale-105" />
        </div>
        <span
          className={`absolute -bottom-5 left-5 flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-extrabold text-white ring-4 ring-white ${card.badge}`}
        >
          {card.n}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-8">
        <h3 className="font-display text-base font-extrabold text-navy-950">{card.title}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">{card.body}</p>

        <span
          className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${
            card.active ? "text-purple-500" : "text-slate-400"
          }`}
        >
          {card.active ? "View course" : "Coming soon"}
          {card.active && <ArrowUpRight size={13} />}
        </span>
      </div>
    </>
  );

  const base =
    "group flex h-full flex-col overflow-hidden rounded-3xl border bg-white transition-shadow duration-300";
  const state = card.active
    ? "border-purple-200 shadow-card hover:shadow-purple-glow"
    : "border-slate-100";

  return href ? (
    <Link
      to={href}
      className={`${base} ${state} focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${base} ${state}`}>{body}</div>
  );
}