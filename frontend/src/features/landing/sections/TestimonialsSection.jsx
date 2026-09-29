import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    initials: "AK",
    name: "Anitha K.",
    role: "Grade 11 · Science",
    quote:
      "The live classes and progress tracking keep me on track. I finally understand where I'm weak and what to study next.",
    tone: "brand",
  },
  {
    initials: "RS",
    name: "Rahul S.",
    role: "Grade 10 · Mathematics",
    quote:
      "Best learning experience I've had. The AI paths actually help me move faster on topics I already know.",
    tone: "gold",
  },
  {
    initials: "MN",
    name: "Meera N.",
    role: "Grade 12 · Programming",
    quote:
      "Teachers respond fast, materials are always organized, and I can see all my courses in one place.",
    tone: "gold",
  },
];

const TONES = {
  brand: {
    avatar: "from-brand-400 to-brand-600 text-white",
    line: "bg-brand-400",
  },
  gold: {
    avatar: "from-accent-400 to-accent-500 text-night-900",
    line: "bg-accent-400",
  },
};

const EASE = [0.34, 1.56, 0.64, 1]; // overshoot — cards "deal"

// Fan-out positions: card 0 lands left + tilted, 1 center, 2 right
const FAN = [
  { x: -60, y: 20, rotate: -6, delay: 0.1 },
  { x: 0,   y: 0,  rotate: 0,  delay: 0.0 },
  { x: 60,  y: 20, rotate: 6,  delay: 0.2 },
];

function Card({ data, fan, inView, index }) {
  const t = TONES[data.tone];
  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 40, rotate: 0, scale: 0.85 }}
      animate={
        inView
          ? {
              opacity: 1,
              x: fan.x,
              y: fan.y,
              rotate: fan.rotate,
              scale: 1,
            }
          : {}
      }
      transition={{
        duration: 0.9,
        delay: 0.15 + fan.delay + index * 0.05,
        ease: EASE,
      }}
      whileHover={{ y: fan.y - 10, rotate: 0, scale: 1.03, zIndex: 10 }}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-night-700/90 to-night-800/70 p-6 shadow-landing-lg backdrop-blur-sm transition-colors hover:border-white/[0.15]"
    >
      <div className={`absolute inset-x-0 top-0 h-px ${t.line} opacity-40`} />
      <Quote size={40} className="absolute right-4 top-4 text-white/[0.03]" />

      <div className="mb-4 flex items-center gap-0.5 text-accent-400">
        {[0, 1, 2, 3, 4].map((s) => (
          <Star key={s} size={14} fill="currentColor" />
        ))}
      </div>

      <p className="relative flex-1 text-sm leading-relaxed text-muted-300">
        &ldquo;{data.quote}&rdquo;
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.avatar} text-xs font-bold`}>
          {data.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-cream-100">{data.name}</p>
          <p className="text-xs text-muted-400">{data.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="section-pad relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-300"
          >
            Student voices
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="section-heading-gap text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl"
          >
            What Our Students{" "}
            <span className="bg-gradient-to-r from-accent-300 to-brand-300 bg-clip-text text-transparent">
              Say About Us
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="section-sub text-base leading-relaxed text-muted-300"
          >
            Real experiences from learners across institutions.
          </motion.p>
        </div>

        {/* Card fan — 3 cards in a grid, each animated to fan position */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((data, i) => (
            <Card
              key={data.name}
              data={data}
              fan={FAN[i]}
              inView={inView}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}