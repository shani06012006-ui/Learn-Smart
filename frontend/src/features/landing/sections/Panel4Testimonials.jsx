// frontend/src/features/landing/sections/Panel4Testimonials.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote, Star } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Parent of Class 5",
    avatar: "https://i.pravatar.cc/150?img=1",
    text: "My son used to fight me on homework. Now he asks to do his Learn Smart quizzes every night. The streak system is genius.",
  },
  {
    id: 2,
    name: "Rahul Mehta",
    role: "Parent of Class 3",
    avatar: "https://i.pravatar.cc/150?img=11",
    text: "The AI generated quizzes from his school PDFs are incredible. It's like having a personal tutor available 24/7.",
  },
  {
    id: 3,
    name: "Anita Iyer",
    role: "Teacher, Class 6",
    avatar: "https://i.pravatar.cc/150?img=5",
    text: "I generate a quiz from my lesson PDF in under a minute. My students' engagement went up 3x in one term.",
  },
];

export default function Panel4Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-[#0a0f16] py-20 lg:py-28">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
          >
            Guidance from Learning Experts
          </motion.h2>
        </div>

        {/* Testimonial Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.2 + i * 0.1, ease: EASE }}
              className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/10"
            >
              <Quote size={28} className="text-purple-500/50" />
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                "{t.text}"
              </p>
              
              <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20"
                />
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-[11px] text-slate-400">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={12} className="fill-purple-500 text-purple-500" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}