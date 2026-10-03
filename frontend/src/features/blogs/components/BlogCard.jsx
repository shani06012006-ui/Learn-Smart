// frontend/src/features/blogs/components/BlogCard.jsx
import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";

const GRADIENTS = [
  "from-[#2b2d42] to-[#8d99ae]",
  "from-[#7c3aed] to-[#5b21b6]",
  "from-[#f4a261] to-[#e76f51]",
  "from-[#a8dadc] to-[#457b9d]",
  "from-[#ffd6a5] to-[#fdffb6]",
  "from-[#bdb2ff] to-[#a0c4ff]",
  "from-[#caffbf] to-[#9bf6ff]",
  "from-[#ffc6ff] to-[#ffadad]",
];

export default function BlogCard({ post, index = 0 }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
      {/* Cover image */}
      <Link to={`/blogs/${post.id}`} className="block">
        <div className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br ${gradient}`}>
          {/* HERE IS YOUR IMAGE — blog cover — paste a URL over the src */}
          <img
            src=""
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          {/* Category chip */}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy-950 backdrop-blur">
            {post.category}
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>{post.date}</span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {post.readTime}
          </span>
        </div>

        <h3 className="mt-3 font-display text-base font-extrabold leading-snug text-navy-950 sm:text-lg">
          <Link to={`/blogs/${post.id}`} className="transition-colors hover:text-purple-500">
            {post.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {post.excerpt}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[10px] font-bold text-white`}>
              {post.authorInitials}
            </div>
            <span className="text-xs font-semibold text-slate-600">{post.author}</span>
          </div>
          <Link
            to={`/blogs/${post.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-500 transition-transform hover:translate-x-0.5"
          >
            Read
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}