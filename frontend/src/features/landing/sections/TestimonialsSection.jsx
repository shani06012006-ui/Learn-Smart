import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { EASE } from "../motion";

const TESTIMONIALS = [
  {
    quote:
      "EduCore replaced four separate systems across our institution. Grading, attendance, and analytics now live in one place — and faculty actually enjoy using it.",
    name: "Dr. Elena Rostova",
    role: "Dean of Academics, Northwood University",
    initials: "ER",
    tone: "navy",
  },
  {
    quote:
      "Onboarding 4,200 students in under two weeks. The deployment team was exceptional, and the platform has held 99.9% uptime through exam season.",
    name: "Prof. Marcus Chen",
    role: "Chief Information Officer, Riverdale Institute",
    initials: "MC",
    tone: "electric",
  },
  {
    quote:
      "The analytics dashboard gives us visibility we never had. We can spot at-risk students weeks earlier and intervene before it matters.",
    name: "Dr. Fatima Aliyev",
    role: "Head of Student Success, Greenwood College",
    initials: "FA",
    tone: "mint",
  },
  {
    quote:
      "Our hybrid programs run seamlessly on EduCore. Remote and on-campus students share the same experience — no compromises on either side.",
    name: "Prof. Priya Sharma",
    role: "Director of Digital Learning, NUS",
    initials: "PS",
    tone: "violet",
  },
];

const TONE = {
  navy: "from-navy-700 to-navy-900",
  electric: "from-electric-500 to-electric-700",
  mint: "from-accent-mint to-emerald-600",
  violet: "from-accent-violet to-violet-700",
};

export default function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const scrollerRef = useRef(null);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section id="testimonials" className="section-pad relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading + arrows */}
        <div ref={ref} className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE.smooth }}
              className="eyebrow"
            >
              Institutional trust
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
              className="h2 mt-5"
            >
              Trusted by Deans, Educators,{" "}
              <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
                and Students Worldwide.
              </span>
            </motion.h2>
          </div>

          {/* Arrows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden shrink-0 items-center gap-2 sm:flex"
          >
            <button
              type="button"
              onClick={() => scrollBy("prev")}
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-card"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy("next")}
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-white shadow-navy-glow transition-all hover:bg-navy-800"
            >
              <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* Horizontal scroller */}
        <div
          ref={scrollerRef}
          className="mt-12 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: EASE.smooth }}
              className="group relative flex w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated sm:w-[380px]"
            >
              <Quote
                size={40}
                className="absolute right-5 top-5 text-slate-100"
              />

              {/* Stars */}
              <div className="mb-4 flex items-center gap-0.5 text-amber-500">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} size={14} fill="currentColor" />
                ))}
              </div>

              <p className="relative flex-1 text-sm leading-relaxed text-slate-700">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${TONE[t.tone]} text-sm font-bold text-white`}>
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}