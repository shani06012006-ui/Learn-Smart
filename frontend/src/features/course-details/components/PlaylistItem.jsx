// frontend/src/features/course-details/components/PlaylistItem.jsx
import { PlayCircle } from "lucide-react";

const GRADIENTS = [
  "from-[#2b2d42] to-[#8d99ae]",
  "from-[#f4a261] to-[#e76f51]",
  "from-[#a8dadc] to-[#457b9d]",
  "from-[#ffd6a5] to-[#fdffb6]",
  "from-[#caffbf] to-[#9bf6ff]",
  "from-[#bdb2ff] to-[#a0c4ff]",
];

export default function PlaylistItem({ lesson, index = 0, active = false }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <button
      type="button"
      className={`group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all ${
        active
          ? "bg-purple-50 ring-1 ring-purple-200"
          : "hover:bg-slate-50"
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${gradient}`}
      >
        {/* HERE IS YOUR IMAGE — playlist thumbnail — paste a URL over the src */}
        <img
          src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=200&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {/* Play icon overlay */}
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayCircle size={16} className="text-white" />
        </span>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-bold ${
            active ? "text-purple-600" : "text-navy-950"
          }`}
        >
          {lesson.title}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">{lesson.duration}</p>
      </div>
    </button>
  );
}