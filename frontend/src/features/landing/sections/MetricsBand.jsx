import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Building2, Users, ShieldCheck, Star } from "lucide-react";
import { EASE } from "../motion";

const METRICS = [
  { icon: Building2,  value: 150,  suffix: "+",    label: "Partner Universities & Colleges",  isFloat: false },
  { icon: Users,      value: 500,  suffix: "K+",   label: "Active Students & Faculty",         isFloat: false },
  { icon: ShieldCheck,value: 99.9, suffix: "%",    label: "Platform Uptime & SLA Guarantee",   isFloat: true  },
  { icon: Star,       value: 4.9,  suffix: " / 5", label: "Institutional Satisfaction Score",  isFloat: true  },
];

function AnimatedNumber({ target, isFloat, inView }) {
  const [display, setDisplay] = useState(isFloat ? "0.0" : "0");
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();
    const duration = 1600;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      setDisplay(isFloat ? value.toFixed(1) : String(Math.round(value)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(isFloat ? target.toFixed(1) : String(target));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, isFloat]);

  return <span className="tabular-nums">{display}</span>;
}

export default function MetricsBand() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      aria-label="EduCore by the numbers"
      className="relative overflow-hidden bg-metrics-band text-white"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
          {METRICS.map(({ icon: Icon, value, suffix, label, isFloat }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE.smooth }}
              className="text-center sm:text-left"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Icon size={16} className="text-electric-300" />
              </span>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                <AnimatedNumber target={value} isFloat={isFloat} inView={inView} />
                <span className="ml-1 text-white/70">{suffix}</span>
              </p>
              <p className="mt-1.5 text-xs font-medium leading-snug text-white/75 sm:text-sm">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}