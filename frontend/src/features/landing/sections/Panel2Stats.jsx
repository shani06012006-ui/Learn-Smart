// frontend/src/features/landing/sections/Panel2Stats.jsx
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Award, BookOpen, Star, Users } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const STATS = [
  { id: "years", icon: Award, value: 10, suffix: "+", label: "Years Experience", tone: "purple" },
  { id: "activities", icon: BookOpen, value: 1000, suffix: "+", label: "Activities", tone: "emerald" },
  { id: "students", icon: Users, value: 8000, suffix: "+", label: "Happy Students", tone: "coral" },
  { id: "rating", icon: Star, value: 4.2, suffix: "/5", label: "Parent Rating", tone: "amber", decimal: true },
];

function Counter({ target, suffix, decimal, inView }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  const display = decimal ? count.toFixed(1) : Math.floor(count).toLocaleString();
  return <>{display}{suffix}</>;
}

const TONE = {
  purple: { bg: "bg-purple-100", text: "text-purple-600", ring: "ring-purple-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", ring: "ring-emerald-200" },
  coral: { bg: "bg-coral-100", text: "text-coral-600", ring: "ring-coral-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-600", ring: "ring-amber-200" },
};

export default function Panel2Stats({ layout = "horizontal" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isHorizontal = layout === "horizontal";

  return (
    <section 
    ref={ref} 
    className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-paper-50" >
        
      {/* ✅ FIXED: container-wide + flex-col justify-center */}
      <div className="container-wide relative flex h-full flex-col justify-center py-10">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-xs font-bold uppercase tracking-widest text-purple-600"
          >
            By the numbers
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl"
          >
            Real impact,{" "}
            <span className="bg-gradient-to-r from-purple-600 to-emerald-500 bg-clip-text text-transparent">
              real numbers.
            </span>
          </motion.h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:mt-14 sm:gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            const t = TONE[s.tone];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.2 + i * 0.1, ease: EASE }}
                className="group rounded-3xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
              >
                <span
                  className={
                    "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition group-hover:scale-110 " +
                    t.bg + " " + t.text + " " + t.ring
                  }
                >
                  <Icon size={22} />
                </span>
                <p className="mt-4 font-display text-3xl font-extrabold leading-none text-navy-950 sm:text-4xl lg:text-5xl">
                  <Counter
                    target={s.value}
                    suffix={s.suffix}
                    decimal={s.decimal}
                    inView={inView}
                  />
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {s.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}