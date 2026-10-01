// frontend/src/features/landing/sections/CommunitySection.jsx
// Self-contained: react-router-dom + lucide-react + standard Tailwind only.
// No framer-motion, no custom tokens, no scroll-trigger (so text can never stay hidden).
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Sparkles } from "lucide-react";

// x / y = % position inside the visual panel. The hub sits at 50 / 50.
const PEERS = [
  { initials: "AK", x: 15, y: 20, grad: "from-blue-500 to-blue-700",       bubble: "Assignment due tomorrow!", tag: "#Announcements", tagTone: "bg-amber-100 text-amber-700", dur: 5.2, delay: 0 },
  { initials: "RS", x: 85, y: 18, grad: "from-violet-500 to-violet-700",   bubble: "Study group active",       tag: "#Forum",         tagTone: "bg-blue-100 text-blue-700",   dur: 6.0, delay: 0.8 },
  { initials: "MN", x: 10, y: 68, grad: "from-emerald-500 to-emerald-700", bubble: "New post in Python",       tag: "#Discussion",    tagTone: "bg-violet-100 text-violet-700", dur: 5.6, delay: 1.6 },
  { initials: "KP", x: 89, y: 70, grad: "from-rose-500 to-rose-700",       bubble: "Quiz starts at 4 PM",      tag: "#Clubs",         tagTone: "bg-rose-100 text-rose-700",   dur: 6.4, delay: 0.4 },
  { initials: "LW", x: 52, y: 83, grad: "from-sky-500 to-sky-700",         bubble: "Notes shared in Biology",  tag: "#Announcements", tagTone: "bg-amber-100 text-amber-700", dur: 5.8, delay: 1.2 },
];

const BUBBLE_T = 0.5; // how far along the line each bubble sits (0 = hub, 1 = avatar)

function CommunityVisual() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative aspect-[5/4] w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-xl">
      {/* faint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(37,99,235,0.12) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* connection lines: same % coordinates as the nodes, so they always meet */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {PEERS.map((p, i) => (
          <line
            key={p.initials}
            x1="50" y1="50" x2={p.x} y2={p.y}
            stroke={hovered === i ? "#2563eb" : "#93b4f5"}
            strokeWidth={hovered === i ? 2 : 1.4}
            strokeDasharray="6 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="comm-dash"
            style={{ transition: "stroke 200ms, stroke-width 200ms" }}
          />
        ))}
      </svg>

      {/* floating activity bubbles, sitting on the lines */}
      {PEERS.map((p, i) => {
        const bx = 50 + (p.x - 50) * BUBBLE_T;
        const by = 50 + (p.y - 50) * BUBBLE_T;
        return (
          <div
            key={`b-${p.initials}`}
            className="absolute z-20"
            style={{ left: `${bx}%`, top: `${by}%`, transform: "translate(-50%, -50%)" }}
          >
            <div
              className={`comm-float flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-lg transition-colors sm:text-xs ${
                hovered === i ? "border-blue-400" : "border-slate-200"
              }`}
              style={{ animationDuration: `${p.dur + 0.6}s`, animationDelay: `${p.delay + 0.5}s` }}
            >
              <Sparkles size={11} className="shrink-0 text-blue-600" />
              {p.bubble}
            </div>
          </div>
        );
      })}

      {/* peer avatars + channel tags */}
      {PEERS.map((p, i) => (
        <div
          key={p.initials}
          className="absolute z-10"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="comm-float flex flex-col items-center" style={{ animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}>
            <span className="relative">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-lg ring-4 ring-white transition-transform hover:scale-110 sm:h-14 sm:w-14 ${p.grad}`}
              >
                {p.initials}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <span className={`mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm sm:text-[11px] ${p.tagTone}`}>
              {p.tag}
            </span>
          </div>
        </div>
      ))}

      {/* central hub: the active student */}
      <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
        <div className="comm-float flex flex-col items-center" style={{ animationDuration: "7s" }}>
          <span className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 motion-reduce:animate-none" />
            <span className="absolute -inset-3 rounded-full border border-blue-200" />
            <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#0b1f4d] to-blue-700 text-white shadow-2xl ring-4 ring-white">
              <Users size={36} />
            </span>
            <span className="absolute -right-1 top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white ring-4 ring-white">
              12
            </span>
          </span>
          <span className="mt-3 rounded-full bg-[#0b1f4d] px-3 py-1 text-[11px] font-semibold text-white shadow-md">
            You · Active now
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CommunitySection() {
  return (
    <section id="community" className="relative scroll-mt-16 overflow-hidden py-20 md:py-28">
      {/* Float + dash animations (disabled for reduced-motion) */}
      <style>{`
        @keyframes commFloat { 0%,100% { translate: 0 0; } 50% { translate: 0 -9px; } }
        @keyframes commDash  { to { stroke-dashoffset: -24; } }
        .comm-float { animation: commFloat 6s ease-in-out infinite; }
        .comm-dash  { animation: commDash 2.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .comm-float, .comm-dash { animation: none; } }
      `}</style>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        {/* LEFT: text + CTA (static, always visible) */}
        <div className="min-w-0">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl xl:text-5xl">
            Foster Active Student{" "}
            <span className="bg-gradient-to-r from-[#0b1f4d] to-blue-500 bg-clip-text text-transparent">
              Communities &amp; Collaboration.
            </span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Connect student clubs, peer study groups, discussion forums, and campus announcements in a single central hub.
          </p>
          <Link
            to="/register"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-[#0b1f4d] px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Explore Campus Hub
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* RIGHT: node network */}
        <div className="min-w-0">
          <CommunityVisual />
        </div>
      </div>
    </section>
  );
}