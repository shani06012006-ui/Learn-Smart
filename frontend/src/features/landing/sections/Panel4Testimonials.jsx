// frontend/src/features/landing/sections/Panel4Testimonials.jsx
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const TESTIMONIALS = [
  { id: 1, name: "Priya Sharma", role: "Parent of Class 5 student", avatar: "PS", color: "from-purple-500 to-purple-700", rating: 5, text: "My son used to fight me on homework. Now he asks to do his Learn Smart quizzes every night. The streak system is genius." },
  { id: 2, name: "Rahul Mehta", role: "Parent of Class 3 student", avatar: "RM", color: "from-emerald-500 to-emerald-700", rating: 5, text: "The AI generated quizzes from his school PDFs are incredible. It's like having a personal tutor available 24/7." },
  { id: 3, name: "Anita Iyer", role: "Teacher, Class 6", avatar: "AI", color: "from-coral-500 to-coral-700", rating: 5, text: "I generate a quiz from my lesson PDF in under a minute. My students' engagement went up 3x in one term." },
  { id: 4, name: "Sneha Reddy", role: "Parent of Class 8 student", avatar: "SR", color: "from-amber-500 to-orange-600", rating: 5, text: "The XP and badge system is what sold my daughter. She's racing to Level 10 and doesn't even realize she's studying." },
  { id: 5, name: "Vikram Singh", role: "Parent of Class 2 student", avatar: "VS", color: "from-teal-500 to-teal-700", rating: 4, text: "Simple, safe, and actually makes learning fun. My kid loves the streaks. I love that I can see his progress." },
];

export default function Panel4Testimonials({ layout = "horizontal" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isHorizontal = layout === "horizontal";

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  return (
    <section
  ref={ref}
  className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-paper-50"
>
      {/* ✅ FIXED: container-wide + flex-col justify-center */}
      <div className="container-wide relative flex h-full flex-col justify-center py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-xs font-bold uppercase tracking-widest text-purple-600"
            >
              Loved by families
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl"
            >
              Real parents.{" "}
              <span className="bg-gradient-to-r from-purple-600 to-emerald-500 bg-clip-text text-transparent">
                Real progress.
              </span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="flex gap-2"
          >
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-navy-950 shadow-sm transition hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-navy-950 shadow-sm transition hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="w-[300px] shrink-0 snap-start rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:w-[360px]"
            >
              <Quote size={28} className="text-purple-200" />
              <p className="mt-4 text-sm leading-relaxed text-slate-700">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                <span
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-extrabold text-white " +
                    t.color
                  }
                >
                  {t.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-950">{t.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{t.role}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={11}
                      className={n <= t.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}