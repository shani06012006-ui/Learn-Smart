import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Building2, Users, ShieldCheck, Star, Activity } from "lucide-react";
import { EASE } from "../motion";

const METRICS = [
  { icon: Building2,   value: 150,  suffix: "+",    label: "Partner universities",     sub: "Across 42 countries",       isFloat: false, accent: "bg-electric-400" },
  { icon: Users,       value: 500,  suffix: "K+",   label: "Students & faculty",       sub: "Active monthly users",      isFloat: false, accent: "bg-accent-mint" },
  { icon: ShieldCheck, value: 99.9, suffix: "%",    label: "Uptime SLA guarantee",     sub: "Independently monitored",   isFloat: true,  accent: "bg-white" },
  { icon: Star,        value: 4.9,  suffix: " / 5", label: "Institutional satisfaction",sub: "Based on 8,400+ reviews",   isFloat: true,  accent: "bg-accent-violet" },
];

/* Animated count-up with smooth easing */
function AnimatedNumber({ target, isFloat, inView }) {
  const [display, setDisplay] = useState(isFloat ? "0.0" : "0");
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();
    const duration = 1800;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // Cubic ease-out — fast start, gentle settle
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

function MetricCard({ metric, index, inView }) {
  const { icon: Icon, value, suffix, label, sub, isFloat, accent } = metric;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE.smooth }}
      className="group text-center sm:text-left"
    >
      {/* Icon chip */}
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
        <Icon size={17} className="text-electric-300" />
      </span>

      {/* Number */}
      <p className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        <AnimatedNumber target={value} isFloat={isFloat} inView={inView} />
        <span className="ml-1 text-2xl text-white/70 sm:text-3xl">{suffix}</span>
      </p>

      {/* Gradient underline — animates from left */}
      <motion.span
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4 + index * 0.12, ease: EASE.smooth }}
        style={{ originX: 0 }}
        className={`mt-3 block h-0.5 w-14 ${accent} rounded-full mx-auto sm:mx-0`}
      />

      {/* Label + sub */}
      <p className="mt-3 text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-white/55">{sub}</p>
    </motion.div>
  );
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
      {/* Fine grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Soft glow orbs */}
      <div aria-hidden className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-electric-400/15 blur-3xl" />
      <div aria-hidden className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />

      {/* Live badge — top-right corner */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.6, ease: EASE.smooth }}
        className="absolute right-6 top-6 hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/75 backdrop-blur sm:flex lg:right-10 lg:top-8"
      >
        <Activity size={11} className="text-emerald-300" />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
        Live metrics
      </motion.div>

      <div className="container relative py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-6">
          {METRICS.map((m, i) => (
            <MetricCard key={m.label} metric={m} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}