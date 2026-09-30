import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, Move } from "lucide-react";

const TESTIMONIALS = [
  { initials: "AK", name: "Anitha K.", role: "Grade 11 · Science",      quote: "The live classes and progress tracking keep me on track. I finally understand where I'm weak and what to study next.", tone: "brand" },
  { initials: "RS", name: "Rahul S.",  role: "Grade 10 · Mathematics",  quote: "Best learning experience I've had. The AI paths actually help me move faster on topics I already know.",             tone: "peach" },
  { initials: "MN", name: "Meera N.",  role: "Grade 12 · Programming",  quote: "Teachers respond fast, materials are always organized, and I can see all my courses in one place.",                   tone: "mint"  },
];

const TONES = {
  brand: { avatar: "bg-brand-500 text-white",              chip: "bg-brand-50 text-brand-700",  accent: "bg-brand-500" },
  peach: { avatar: "bg-accent-500 text-white",             chip: "bg-accent-50 text-accent-700", accent: "bg-accent-500" },
  mint:  { avatar: "bg-mint-500 text-white",               chip: "bg-mint-400/20 text-mint-600", accent: "bg-mint-500" },
};

function DraggableCard({ data, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const t = TONES[data.tone];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotate: 0 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, rotate: 0 }}
      drag
      dragElastic={0.18}
      dragConstraints={{ left: -80, right: 80, top: -40, bottom: 40 }}
      dragTransition={{ bounceStiffness: 320, bounceDamping: 26 }}
      whileDrag={{ scale: 1.04, zIndex: 20, cursor: "grabbing", boxShadow: "0 24px 48px -12px rgba(28,28,30,0.18)" }}
      className="relative flex h-full w-full cursor-grab flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-landing select-none"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${t.accent}`} />

      {/* Drag hint */}
      <div className="absolute right-4 top-4 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-ink-400 opacity-60">
        <Move size={11} /> drag
      </div>

      <Quote size={40} className="absolute right-16 top-4 text-ink-100" />

      <div className="mb-4 flex items-center gap-0.5 text-amber-500">
        {[0, 1, 2, 3, 4].map((s) => (
          <Star key={s} size={14} fill="currentColor" />
        ))}
      </div>

      <p className="relative flex-1 text-sm leading-relaxed text-ink-700">
        &ldquo;{data.quote}&rdquo;
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-ink-200 pt-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.avatar} text-xs font-bold`}>
          {data.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">{data.name}</p>
          <p className="text-xs text-ink-500">{data.role}</p>
        </div>
        <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold ${t.chip}`}>
          Student
        </span>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="section-pad relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-600">
            Student voices
          </p>
          <h2 className="section-heading-gap text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            What Our Students{" "}
            <span className="bg-gradient-to-r from-accent-500 to-brand-500 bg-clip-text text-transparent">
              Say About Us
            </span>
          </h2>
          <p className="section-sub text-base leading-relaxed text-ink-500">
            Pick them up. Drag them around. Real experiences, real flexibility.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((data, i) => (
            <DraggableCard key={data.name} data={data} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}