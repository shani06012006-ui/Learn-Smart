// frontend/src/features/student/login/HootOwl.jsx
import { useEffect, useId, useRef, useState } from "react";
import { motion, useAnimationControls, useMotionValue, useSpring } from "framer-motion";

/*
  Hoot — the Learn Smart owl (he wears the graduation cap from the logo).

  mood:  "idle" | "typing" | "thinking" | "oops" | "happy"
  hop:   increase this number to make him hop once (used for every key tap)
  calm:  true = no movement (faces still change so he stays expressive)
*/

const SPARKLES = [
  { x: 28, y: 70, delay: 0 },
  { x: 214, y: 84, delay: 0.25 },
  { x: 36, y: 188, delay: 0.5 },
  { x: 208, y: 190, delay: 0.75 },
];
const STAR = "M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9Z";
const FILL_BOX = { transformBox: "fill-box" };

export default function HootOwl({ mood = "idle", hop = 0, calm = false, className = "" }) {
  const svgRef = useRef(null);
  const body = useAnimationControls();
  const gradId = useId().replace(/:/g, "");
  const [blink, setBlink] = useState(false);

  // Where the pupils look (springy so they glide)
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(4);
  const pupilX = useSpring(lookX, { stiffness: 180, damping: 18 });
  const pupilY = useSpring(lookY, { stiffness: 180, damping: 18 });

  // Eyes follow the pointer; look up while "thinking"
  useEffect(() => {
    if (calm) {
      lookX.set(0);
      lookY.set(4);
      return undefined;
    }
    if (mood === "thinking") {
      lookX.set(0);
      lookY.set(-8);
      return undefined;
    }
    lookX.set(0);
    lookY.set(4);
    const onMove = (e) => {
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.4);
      const dist = Math.hypot(dx, dy) || 1;
      const strength = Math.min(1, dist / 220);
      lookX.set((dx / dist) * 9 * strength);
      lookY.set((dy / dist) * 8 * strength);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mood, calm, lookX, lookY]);

  // Random blinking
  useEffect(() => {
    if (calm) return undefined;
    let t1;
    let t2;
    const loop = () => {
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => {
          setBlink(false);
          loop();
        }, 130);
      }, 2200 + Math.random() * 3000);
    };
    loop();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [calm]);

  // Whole-body mood animation
  useEffect(() => {
    if (calm) {
      body.start({ x: 0, y: 0, rotate: 0, transition: { duration: 0 } });
    } else if (mood === "happy") {
      body.start({ y: [0, -28, 0, -20, 0], rotate: 0, transition: { duration: 1.2 } });
    } else if (mood === "oops") {
      body.start({ x: [0, -9, 9, -7, 7, 0], rotate: 0, transition: { duration: 0.55 } });
    } else if (mood === "thinking") {
      body.start({ rotate: [-3, 3, -3], transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" } });
    } else {
      body.start({ x: 0, y: 0, rotate: 0, transition: { duration: 0.25 } });
    }
  }, [mood, calm, body]);

  // One little hop per key tap
  useEffect(() => {
    if (hop > 0 && !calm && mood === "typing") {
      body.start({ y: [0, -14, 0], transition: { duration: 0.3 } });
    }
  }, [hop]); // eslint-disable-line react-hooks/exhaustive-deps

  const happy = mood === "happy";
  const flap = happy && !calm;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 240 290"
      role="img"
      aria-label="Hoot the owl, your learning buddy"
      className={`overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a284ff" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      {/* shadow + book stack he stands on */}
      <ellipse cx="120" cy="288" rx="82" ry="6" fill="rgba(40,20,120,0.22)" />
      <rect x="40" y="268" width="152" height="20" rx="5" fill="#4dabf7" />
      <rect x="40" y="268" width="152" height="6" rx="3" fill="#74c0fc" />
      <rect x="52" y="249" width="128" height="20" rx="5" fill="#ff8787" transform="rotate(-2 116 259)" />
      <rect x="52" y="249" width="128" height="6" rx="3" fill="#ffa8a8" transform="rotate(-2 116 259)" />
      <rect x="68" y="231" width="100" height="19" rx="5" fill="#51cf66" transform="rotate(1.5 118 240)" />
      <rect x="68" y="231" width="100" height="6" rx="3" fill="#8ce99a" transform="rotate(1.5 118 240)" />

      {/* Hoot */}
      <motion.g animate={body} style={{ ...FILL_BOX, transformOrigin: "50% 100%" }}>
        {/* feet */}
        <ellipse cx="98" cy="232" rx="17" ry="8" fill="#ff9f1c" />
        <ellipse cx="142" cy="232" rx="17" ry="8" fill="#ff9f1c" />

        {/* wings */}
        <motion.path
          d="M52 128 C28 140 26 192 50 206 C64 196 68 160 62 128Z"
          fill="#5b21b6"
          style={{ ...FILL_BOX, transformOrigin: "100% 0%" }}
          animate={{ rotate: flap ? [0, -32, 0, -32, 0] : 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        <motion.path
          d="M188 128 C212 140 214 192 190 206 C176 196 172 160 178 128Z"
          fill="#5b21b6"
          style={{ ...FILL_BOX, transformOrigin: "0% 0%" }}
          animate={{ rotate: flap ? [0, 32, 0, 32, 0] : 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* body + belly */}
        <ellipse cx="120" cy="144" rx="76" ry="90" fill={`url(#${gradId})`} />
        <ellipse cx="120" cy="180" rx="48" ry="50" fill="#efe8ff" />
        <g fill="none" stroke="#d3c3ff" strokeWidth="4" strokeLinecap="round">
          <path d="M98 170 q8 9 16 0" />
          <path d="M126 170 q8 9 16 0" />
          <path d="M84 194 q8 9 16 0" />
          <path d="M112 194 q8 9 16 0" />
          <path d="M140 194 q8 9 16 0" />
          <path d="M98 216 q8 9 16 0" />
          <path d="M126 216 q8 9 16 0" />
        </g>

        {/* face */}
        <circle cx="90" cy="112" r="36" fill="#b9a3ff" />
        <circle cx="150" cy="112" r="36" fill="#b9a3ff" />

        {happy ? (
          <g fill="none" stroke="#160f45" strokeWidth="7" strokeLinecap="round">
            <path d="M68 118 q22 -28 44 0" />
            <path d="M128 118 q22 -28 44 0" />
          </g>
        ) : (
          <motion.g
            animate={{ scaleY: blink ? 0.1 : 1 }}
            transition={{ duration: 0.08 }}
            style={{ ...FILL_BOX, transformOrigin: "50% 50%" }}
          >
            <circle cx="90" cy="112" r="29" fill="#fff" />
            <circle cx="150" cy="112" r="29" fill="#fff" />
            <motion.g style={{ x: pupilX, y: pupilY }}>
              <circle cx="90" cy="112" r="13" fill="#160f45" />
              <circle cx="150" cy="112" r="13" fill="#160f45" />
              <circle cx="94" cy="107" r="4.5" fill="#fff" />
              <circle cx="154" cy="107" r="4.5" fill="#fff" />
            </motion.g>
          </motion.g>
        )}

        {/* cheeks */}
        <circle cx="62" cy="146" r="9" fill="#ff9ecb" opacity="0.7" />
        <circle cx="178" cy="146" r="9" fill="#ff9ecb" opacity="0.7" />

        {/* beak */}
        <path d="M120 128 L104 152 Q120 164 136 152Z" fill="#ff9f1c" />
        {happy && <path d="M108 153 Q120 170 132 153Z" fill="#e8590c" />}

        {/* graduation cap (from the logo) */}
        <path d="M90 56 v18 q30 14 60 0 v-18 q-30 12 -60 0Z" fill="#2a1d7f" />
        <path d="M120 14 L190 40 L120 66 L50 40Z" fill="#160f45" />
        <circle cx="120" cy="40" r="5" fill="#ff9f1c" />
        <path d="M120 40 L184 42 L184 84" fill="none" stroke="#ff9f1c" strokeWidth="4" strokeLinecap="round" />
        <path d="M177 84 h14 l4 20 h-22Z" fill="#ff9f1c" />

        {/* worried sweat drop */}
        {mood === "oops" && (
          <motion.path
            d="M200 96 q9 14 0 22 q-9 -8 0 -22Z"
            fill="#8ad4ff"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          />
        )}
      </motion.g>

      {/* celebration sparkles */}
      {flap &&
        SPARKLES.map((s) => (
          <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y})`}>
            <motion.path
              d={STAR}
              fill="#ffd43b"
              style={{ ...FILL_BOX, transformOrigin: "center" }}
              animate={{ scale: [0, 1.4, 0], rotate: [0, 90, 180] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: s.delay }}
            />
          </g>
        ))}
    </svg>
  );
}