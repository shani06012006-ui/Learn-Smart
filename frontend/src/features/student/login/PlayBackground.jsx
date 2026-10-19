// frontend/src/features/student/login/PlayBackground.jsx
import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import "./playBackground.css";

/* ── Scene data ───────────────────────────────────────────────── */

const BLOCKS = [
  { ch: "A", bg: "#ff8787", edge: "#e06666", x: "7%",  y: "16%", size: 58, r: [-9, 6],  dur: 6.5, delay: 0, desktopOnly: true },
  { ch: "B", bg: "#74c0fc", edge: "#4dabf7", x: "15%", y: "56%", size: 52, r: [7, -8],  dur: 7.5, delay: 1.2 },
  { ch: "C", bg: "#ffe066", edge: "#e6c200", x: "91%", y: "34%", size: 56, r: [-6, 9],  dur: 6,   delay: 0.6 },
  { ch: "1", bg: "#8ce99a", edge: "#5fcf74", x: "86%", y: "60%", size: 50, r: [8, -6],  dur: 7,   delay: 2 },
  { ch: "2", bg: "#faa2c1", edge: "#e980a6", x: "3%",  y: "40%", size: 48, r: [-7, 8],  dur: 8,   delay: 0.3 },
  { ch: "3", bg: "#ffc078", edge: "#f0a040", x: "24%", y: "8%",  size: 46, r: [6, -9],  dur: 6.8, delay: 1.7, desktopOnly: true },
  { ch: "+", bg: "#b197fc", edge: "#8f73ee", x: "38%", y: "5%",  size: 46, r: [-8, 7],  dur: 7.2, delay: 0.9, desktopOnly: true },
];

const STARS = [
  [8, 6, 14, 0], [19, 22, 10, 1.1], [33, 12, 12, 2.2], [47, 5, 9, 0.5], [58, 20, 12, 1.7],
  [66, 8, 10, 2.8], [78, 24, 9, 0.9], [96, 12, 12, 1.4], [40, 30, 8, 2.4], [12, 33, 9, 3.1],
];

const CLOUDS = [
  { top: "9%",  left: "10%", w: 190, dur: 150, delay: -40, o: 0.95 },
  { top: "20%", left: "50%", w: 130, dur: 110, delay: -70, o: 0.85 },
  { top: "31%", left: "28%", w: 220, dur: 190, delay: -120, o: 0.8 },
  { top: "14%", left: "78%", w: 150, dur: 130, delay: -15, o: 0.9 },
  { top: "40%", left: "62%", w: 110, dur: 100, delay: -55, o: 0.7 },
];

const star4 = "M0 -10 Q0 0 10 0 Q0 0 0 10 Q0 0 -10 0 Q0 0 0 -10Z";

/* ── Small SVG pieces ─────────────────────────────────────────── */

function Cloud({ w }) {
  return (
    <svg viewBox="0 0 200 90" width={w} fill="#fff" aria-hidden="true">
      <ellipse cx="60" cy="58" rx="46" ry="26" />
      <ellipse cx="105" cy="40" rx="44" ry="32" />
      <ellipse cx="148" cy="60" rx="42" ry="24" />
      <rect x="40" y="56" width="130" height="28" rx="14" />
    </svg>
  );
}

function Sun() {
  return (
    <div className="absolute right-[5%] top-[6%] h-[120px] w-[120px] sm:h-[150px] sm:w-[150px]">
      <svg
        viewBox="-110 -110 220 220"
        className="pb-spin absolute inset-[-40%] h-[180%] w-[180%]"
        style={{ animationDuration: "90s" }}
        fill="#ffe066"
        opacity="0.55"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <polygon key={i} points="-7,-62 7,-62 0,-104" transform={`rotate(${i * 30})`} />
        ))}
      </svg>
      <div className="absolute inset-[18%] rounded-full bg-[#ffd43b] shadow-[0_0_70px_28px_rgba(255,212,59,0.55)]" />
      <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-[#fff3a0] to-[#ffc107] opacity-90" />
    </div>
  );
}

function Planet() {
  return (
    <svg viewBox="0 0 90 70" width="72" aria-hidden="true">
      <ellipse cx="45" cy="38" rx="42" ry="9" fill="none" stroke="#ffd8a8" strokeWidth="5" transform="rotate(-14 45 38)" />
      <circle cx="45" cy="35" r="22" fill="#ff922b" />
      <circle cx="38" cy="28" r="5" fill="#ffa94d" />
      <circle cx="54" cy="42" r="4" fill="#f76707" />
      <path d="M5 46 Q45 60 85 28" fill="none" stroke="#ffd8a8" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Pencil() {
  return (
    <svg viewBox="0 0 28 110" width="26" aria-hidden="true">
      <rect x="3" y="14" width="22" height="70" rx="3" fill="#ffd43b" />
      <rect x="3" y="14" width="22" height="10" fill="#ff8787" />
      <rect x="3" y="24" width="22" height="4" fill="#ced4da" />
      <polygon points="3,84 25,84 14,108" fill="#ffe8cc" />
      <polygon points="10,98 18,98 14,108" fill="#343a40" />
    </svg>
  );
}

function SchoolHouse() {
  return (
    <svg viewBox="0 -14 120 126" width="124" aria-hidden="true">
      <line x1="60" y1="12" x2="60" y2="-10" stroke="#495057" strokeWidth="2" />
      <polygon points="60,-10 78,-4 60,2" fill="#ff6b6b" />
      <rect x="10" y="50" width="100" height="58" rx="4" fill="#fff3dc" />
      <polygon points="0,54 60,12 120,54" fill="#ff7a59" />
      <rect x="50" y="70" width="20" height="38" rx="3" fill="#7c3aed" />
      <rect x="22" y="64" width="20" height="20" rx="3" fill="#8ec5ff" />
      <rect x="78" y="64" width="20" height="20" rx="3" fill="#8ec5ff" />
      <circle cx="60" cy="40" r="7" fill="#fff3dc" />
    </svg>
  );
}

function Tree({ h = 64 }) {
  return (
    <svg viewBox="0 0 40 64" height={h} aria-hidden="true">
      <rect x="17" y="34" width="6" height="30" rx="2" fill="#a0674b" />
      <circle cx="20" cy="22" r="19" fill="#2fa56f" />
      <circle cx="13" cy="26" r="9" fill="#3cbb82" />
    </svg>
  );
}

/* ── Scene ────────────────────────────────────────────────────── */

export default function PlayBackground({ calm = false }) {
  // Pointer position, -0.5 … 0.5, drives a gentle parallax between depth layers
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 20 });
  const sy = useSpring(my, { stiffness: 55, damping: 20 });

  useEffect(() => {
    if (calm) {
      mx.set(0);
      my.set(0);
      return undefined;
    }
    const onMove = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [calm, mx, my]);

  const farX = useTransform(sx, (v) => v * -16);
  const farY = useTransform(sy, (v) => v * -10);
  const midX = useTransform(sx, (v) => v * -38);
  const midY = useTransform(sy, (v) => v * -24);
  const nearX = useTransform(sx, (v) => v * -64);
  const nearY = useTransform(sy, (v) => v * -12);

  return (
    <div aria-hidden="true" className={`pb-root ${calm ? "pb-calm" : ""}`}>
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #6fa3ff 0%, #9d8cff 42%, #f2a6d4 74%, #ffd0a8 100%)",
        }}
      />

      {/* FAR: stars, sun, clouds */}
      <motion.div className="absolute -inset-6" style={{ x: farX, y: farY }}>
        {STARS.map(([x, y, s, d], i) => (
          <svg
            key={i}
            viewBox="-12 -12 24 24"
            width={s * 1.6}
            className="pb-twinkle absolute fill-white"
            style={{ left: `${x}%`, top: `${y}%`, animationDuration: `${3 + (i % 3)}s`, animationDelay: `${d}s` }}
          >
            <path d={star4} />
          </svg>
        ))}

        <Sun />

        {CLOUDS.map((c, i) => (
          <div
            key={i}
            className="pb-drift absolute"
            style={{
              top: c.top,
              left: c.left,
              opacity: c.o,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            }}
          >
            <Cloud w={c.w} />
          </div>
        ))}
      </motion.div>

      {/* MID: alphabet blocks + friends */}
      <motion.div className="absolute -inset-6" style={{ x: midX, y: midY }}>
        {BLOCKS.map((b) => (
          <div
            key={b.ch}
            className={`pb-bob absolute ${b.desktopOnly ? "hidden sm:block" : ""}`}
            style={{
              left: b.x,
              top: b.y,
              "--r0": `${b.r[0]}deg`,
              "--r1": `${b.r[1]}deg`,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            }}
          >
            <div
              className="flex items-center justify-center rounded-2xl font-kid font-semibold text-navy-950"
              style={{
                width: b.size,
                height: b.size,
                fontSize: b.size * 0.56,
                background: b.bg,
                boxShadow: `0 6px 0 ${b.edge}, 0 14px 24px -10px rgba(40,20,120,.35)`,
              }}
            >
              {b.ch}
            </div>
          </div>
        ))}

        <div className="pb-bob absolute left-[34%] top-[20%] hidden lg:block" style={{ "--r0": "-12deg", "--r1": "8deg", animationDuration: "9s" }}>
          <Planet />
        </div>
        <div className="pb-bob absolute left-[80%] top-[70%] hidden lg:block" style={{ "--r0": "20deg", "--r1": "34deg", animationDuration: "8s", animationDelay: "1s" }}>
          <Pencil />
        </div>
      </motion.div>

      {/* NEAR: hills, school, trees */}
      <motion.div className="absolute -inset-6" style={{ x: nearX, y: nearY }}>
        <svg
          className="pb-sway absolute bottom-0 left-[-6%] h-[36vh] w-[112%]"
          style={{ animationDuration: "26s" }}
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0 150 C 220 70, 470 70, 720 128 S 1210 200, 1440 110 V320 H0Z" fill="#a6efc2" />
        </svg>
        <svg
          className="pb-sway absolute bottom-0 left-[-6%] h-[28vh] w-[112%]"
          style={{ animationDuration: "34s", animationDirection: "reverse" }}
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0 120 C 260 200, 520 40, 800 110 S 1250 180, 1440 90 V320 H0Z" fill="#74da9f" />
        </svg>

        <div className="absolute bottom-[19vh] left-[7%] hidden md:block">
          <SchoolHouse />
        </div>

        <svg
          className="absolute bottom-0 left-[-6%] h-[18vh] w-[112%]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0 170 C 300 90, 600 250, 900 160 S 1300 90, 1440 150 V320 H0Z" fill="#4cc78a" />
        </svg>

        <div className="absolute bottom-[8vh] left-[22%] hidden sm:block"><Tree h={70} /></div>
        <div className="absolute bottom-[10vh] left-[26%] hidden sm:block"><Tree h={52} /></div>
        <div className="absolute bottom-[7vh] right-[12%]"><Tree h={74} /></div>
        <div className="absolute bottom-[9vh] right-[17%] hidden sm:block"><Tree h={50} /></div>
      </motion.div>
    </div>
  );
}