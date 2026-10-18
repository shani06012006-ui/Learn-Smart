// frontend/src/features/landing/sections/Panel3Map.jsx
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Users, Trophy, Flame } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const NODES = [
  { id: 1, x: "22%", y: "35%", label: "Mumbai", students: 1240, tone: "purple" },
  { id: 2, x: "48%", y: "28%", label: "Delhi", students: 890, tone: "emerald" },
  { id: 3, x: "68%", y: "42%", label: "Kolkata", students: 620, tone: "coral" },
  { id: 4, x: "38%", y: "62%", label: "Bangalore", students: 1580, tone: "amber" },
  { id: 5, x: "78%", y: "68%", label: "Chennai", students: 430, tone: "purple" },
  { id: 6, x: "55%", y: "78%", label: "Hyderabad", students: 710, tone: "emerald" },
];

const TONE = {
  purple: { bg: "bg-purple-600", dot: "bg-purple-400" },
  emerald: { bg: "bg-emerald-600", dot: "bg-emerald-400" },
  coral: { bg: "bg-coral-500", dot: "bg-coral-400" },
  amber: { bg: "bg-amber-500", dot: "bg-amber-400" },
};

export default function Panel3Map({ layout = "horizontal" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(null);
  const isHorizontal = layout === "horizontal";

  return (
    <section
    ref={ref} 
    className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-paper-50"
>
      {/* ✅ FIXED: container-wide + flex-col justify-center */}
      <div className="container-wide relative flex h-full flex-col justify-center py-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-xs font-bold uppercase tracking-widest text-purple-600"
            >
              Trusted across India
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl"
            >
              Kids are learning{" "}
              <span className="bg-gradient-to-r from-purple-600 to-emerald-500 bg-clip-text text-transparent">
                everywhere.
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="mt-4 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg"
            >
              From Mumbai to Chennai, 5,000+ students build streaks and master
              new subjects every single day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
              className="mt-6 flex flex-wrap gap-4"
            >
              {[
                { icon: Users, label: "5,470 students", color: "text-purple-600" },
                { icon: Flame, label: "1,240 active streaks", color: "text-amber-600" },
                { icon: Trophy, label: "94% pass rate", color: "text-emerald-600" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-gray-100"
                  >
                    <Icon size={13} className={item.color} />
                    {item.label}
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="relative mx-auto aspect-square w-full max-w-md lg:max-w-lg"
          >
            <div
              aria-hidden
              className="absolute inset-0 rounded-[2rem] bg-white/60 ring-1 ring-gray-100"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(124,58,237,0.15) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <path d="M 22 35 Q 35 50 38 62" stroke="rgba(124,58,237,0.25)" strokeWidth="0.5" fill="none" strokeDasharray="1 1" />
              <path d="M 48 28 Q 58 45 68 42" stroke="rgba(16,185,129,0.25)" strokeWidth="0.5" fill="none" strokeDasharray="1 1" />
              <path d="M 38 62 Q 46 70 55 78" stroke="rgba(245,158,11,0.25)" strokeWidth="0.5" fill="none" strokeDasharray="1 1" />
              <path d="M 68 42 Q 75 55 78 68" stroke="rgba(255,87,34,0.25)" strokeWidth="0.5" fill="none" strokeDasharray="1 1" />
            </svg>

            {NODES.map((n, i) => {
              const t = TONE[n.tone];
              const isHovered = hovered === n.id;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: EASE, type: "spring", stiffness: 200 }}
                  style={{ left: n.x, top: n.y }}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
                    className={"absolute inset-0 rounded-full " + t.dot}
                  />
                  <span
                    className={
                      "relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-full ring-4 ring-white shadow-lg transition hover:scale-125 " +
                      t.bg
                    }
                  >
                    <MapPin size={8} className="text-white" />
                  </span>
                  <motion.div
                    initial={false}
                    animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8, scale: isHovered ? 1 : 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-navy-950 px-3 py-2 text-xs font-bold text-white shadow-xl"
                  >
                    {n.label}
                    <p className="text-[10px] font-semibold text-white/70">
                      {n.students.toLocaleString()} students
                    </p>
                    <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-navy-950" />
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}