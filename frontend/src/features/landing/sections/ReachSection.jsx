import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Search, Calendar, ChevronDown, Globe2, Wifi } from "lucide-react";
import { EASE } from "../motion";

const CAMPUSES = [
  { id: "harvard",   name: "Harvard",     city: "Cambridge, US",  x: 24, y: 38, tone: "navy",     students: "21K" },
  { id: "oxford",    name: "Oxford",      city: "Oxford, UK",     x: 46, y: 30, tone: "electric", students: "24K" },
  { id: "nus",       name: "NUS",         city: "Singapore",      x: 76, y: 60, tone: "mint",     students: "38K" },
  { id: "iitb",      name: "IIT Bombay",  city: "Mumbai, India",  x: 67, y: 52, tone: "violet",   students: "11K" },
  { id: "melbourne", name: "Melbourne",   city: "Melbourne, AU",  x: 84, y: 80, tone: "electric", students: "52K" },
  { id: "toronto",   name: "Toronto",     city: "Toronto, CA",    x: 21, y: 30, tone: "navy",     students: "93K" },
  { id: "capetown",  name: "Cape Town",   city: "Cape Town, ZA",  x: 52, y: 78, tone: "mint",     students: "29K" },
];

const TONE = {
  navy:     { dot: "bg-navy-800",      ring: "ring-navy-200",      halo: "bg-navy-700/20" },
  electric: { dot: "bg-electric-500",  ring: "ring-electric-200",  halo: "bg-electric-500/20" },
  mint:     { dot: "bg-accent-mint",   ring: "ring-emerald-200",   halo: "bg-accent-mint/20" },
  violet:   { dot: "bg-accent-violet", ring: "ring-violet-200",    halo: "bg-accent-violet/20" },
};

/* ──────────────────────────────────────────────────────────────────
   Live campus counter — counts up when in view
   ────────────────────────────────────────────────────────────────── */
function LiveCampusCount({ inView }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1600;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(3240 * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return <span className="tabular-nums">{count.toLocaleString("en-US")}</span>;
}

/* ──────────────────────────────────────────────────────────────────
   World map — pins drop from above, arcs draw between them
   ────────────────────────────────────────────────────────────────── */
function WorldMap() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [hovered, setHovered] = useState(null);

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-surface-50 to-navy-50/30 shadow-elevated"
    >
      {/* Faint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* World map SVG */}
      <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbe6ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#bed0ff" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="landGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0e9ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c7d5f5" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Continents */}
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.15 }}
          d="M 130 90 C 170 70 240 60 300 80 C 340 95 350 130 330 160 C 320 190 300 210 280 230 C 260 250 240 280 220 280 C 200 280 190 260 180 240 C 170 220 150 200 140 170 C 130 140 120 110 130 90 Z"
          fill="url(#landGrad)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.2 }}
          d="M 340 40 C 380 30 410 45 400 80 C 390 100 360 105 340 90 C 325 78 320 55 340 40 Z"
          fill="url(#landGrad2)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.25 }}
          d="M 250 300 C 290 290 320 310 320 350 C 320 400 300 440 280 460 C 260 470 245 460 240 430 C 235 400 230 370 240 340 C 245 320 245 305 250 300 Z"
          fill="url(#landGrad)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.3 }}
          d="M 440 100 C 470 85 510 80 545 95 C 565 105 570 125 555 145 C 540 165 520 175 495 175 C 470 175 450 165 440 145 C 430 125 425 110 440 100 Z"
          fill="url(#landGrad)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.35 }}
          d="M 450 200 C 490 185 540 195 570 215 C 590 235 595 270 585 310 C 575 350 555 385 530 400 C 505 415 480 410 465 385 C 450 355 440 320 440 285 C 440 250 440 220 450 200 Z"
          fill="url(#landGrad)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.4 }}
          d="M 580 80 C 650 60 760 70 850 100 C 900 120 920 160 900 200 C 890 230 860 260 830 280 C 800 300 770 300 740 285 C 710 270 690 250 670 235 C 650 220 630 220 615 210 C 600 195 590 175 585 155 C 580 135 575 105 580 80 Z"
          fill="url(#landGrad)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.45 }}
          d="M 640 220 C 665 220 680 250 675 285 C 670 320 655 340 640 335 C 625 330 618 300 622 270 C 625 240 630 225 640 220 Z"
          fill="url(#landGrad)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.5 }}
          d="M 740 300 C 770 295 800 310 805 330 C 810 350 785 365 760 358 C 740 350 730 330 730 315 Z"
          fill="url(#landGrad2)" stroke="#91b0ff" strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.55 }}
          d="M 830 340 C 870 330 910 345 920 380 C 925 410 905 435 875 435 C 845 435 820 415 815 385 C 812 360 815 345 830 340 Z"
          fill="url(#landGrad)" stroke="#91b0ff" strokeWidth="1"
        />

        {/* Connection arcs — draw between HQ campuses, staggered */}
        {CAMPUSES.slice(0, -1).map((c, i) => {
          const next = CAMPUSES[i + 1];
          const x1 = c.x * 10, y1 = c.y * 5;
          const x2 = next.x * 10, y2 = next.y * 5;
          const mx = (x1 + x2) / 2;
          const my = Math.min(y1, y2) - 45;
          return (
            <motion.path
              key={i}
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke="#365df1"
              strokeWidth="0.9"
              strokeDasharray="3 4"
              opacity="0.4"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.4, delay: 1.4 + i * 0.15, ease: EASE.smooth }}
            />
          );
        })}
      </svg>

      {/* Pins — each drops from above with a bounce */}
      {CAMPUSES.map((c, i) => (
        <motion.button
          key={c.id}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          initial={{ opacity: 0, y: -80, scale: 0.4 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{
            duration: 0.75,
            delay: 0.7 + i * 0.12,
            ease: [0.34, 1.56, 0.64, 1], // overshoot bounce
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          {/* Halo pulse behind pin */}
          <span className={`absolute left-1/2 top-1/2 -z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full ${TONE[c.tone].halo} blur-md`} />

          <span className="relative flex h-4 w-4">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${TONE[c.tone].dot} opacity-40`} />
            <span className={`relative inline-flex h-4 w-4 items-center justify-center rounded-full ring-4 ${TONE[c.tone].dot} ${TONE[c.tone].ring}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </span>

          {hovered === i && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 top-6 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-elevated"
            >
              <p className="text-[11px] font-bold text-slate-900">{c.name}</p>
              <p className="text-[9px] text-slate-500">{c.city}</p>
              <p className="mt-1 text-[9px] font-semibold text-navy-800">{c.students} students</p>
            </motion.div>
          )}
        </motion.button>
      ))}

      {/* Rotating globe — top-right corner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 1.8, ease: EASE.overshoot }}
        className="absolute right-4 top-4 hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-card sm:flex"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          <Globe2 size={18} className="text-navy-800" />
        </motion.div>
      </motion.div>

      {/* Network status — bottom-left badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 2, ease: EASE.smooth }}
        className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-card backdrop-blur"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        All campuses online
      </motion.div>

      {/* Live count — bottom-right badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 2.1, ease: EASE.smooth }}
        className="absolute bottom-4 right-4 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-card backdrop-blur"
      >
        <span className="text-navy-800"><LiveCampusCount inView={inView} /></span>
        <span className="text-slate-500"> active campuses</span>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Section wrapper
   ────────────────────────────────────────────────────────────────── */
export default function ReachSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="reach" className="section-pad relative overflow-hidden">
      <div className="container grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Map */}
        <div className="order-2 min-w-0 lg:order-1">
          <WorldMap />
        </div>

        {/* Copy */}
        <div className="order-1 min-w-0 lg:order-2">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE.smooth }}
            className="eyebrow"
          >
            <Globe2 size={12} className="text-navy-800" />
            Global reach
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
            className="h2 mt-5"
          >
            One platform,{" "}
            <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
              every campus.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE.smooth }}
            className="body-lg mt-5 max-w-xl"
          >
            Deploy across physical campuses, hybrid classrooms, and multi-branch
            networks — with region-specific data residency and a single source
            of truth.
          </motion.p>

          {/* Feature ticks */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 space-y-2 text-sm text-slate-600"
          >
            {[
              "Region-specific data residency (US, EU, APAC)",
              "Per-campus branding and policies",
              "Real-time sync across all locations",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-mint" />
                {t}
              </li>
            ))}
          </motion.ul>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE.smooth }}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-card"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl border border-transparent bg-surface-50 px-3.5 py-2.5 text-left transition-all hover:border-slate-200 hover:bg-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
                  <MapPin size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Department / Campus
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    Select campus
                  </span>
                </span>
                <ChevronDown size={14} className="shrink-0 text-slate-400" />
              </button>

              <button
                type="button"
                className="flex items-center gap-3 rounded-xl border border-transparent bg-surface-50 px-3.5 py-2.5 text-left transition-all hover:border-slate-200 hover:bg-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600">
                  <Calendar size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Academic Year
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    2025 – 2026
                  </span>
                </span>
                <ChevronDown size={14} className="shrink-0 text-slate-400" />
              </button>
            </div>

            <button
              type="button"
              className="group mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-semibold text-white shadow-navy-glow transition-all hover:bg-navy-800"
            >
              <Search size={15} className="transition-transform group-hover:scale-110" />
              Find campuses near me
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}