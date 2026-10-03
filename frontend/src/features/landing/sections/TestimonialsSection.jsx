import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Star, ChevronLeft, ChevronRight, Quote, ArrowRight, BadgeCheck,
} from "lucide-react";
import { EASE } from "../motion";

const TESTIMONIALS = [
  {
    quote:
      "We replaced four legacy tools in one semester. Faculty adoption jumped from 42% to 91% in the first term.",
    name: "Dr. Elena Rostova",
    role: "Dean of Academics",
    institution: "Northwood University",
    initials: "ER",
    tone: "navy",
    rotate: -3,
  },
  {
    quote:
      "Onboarding 4,200 students in under two weeks. The platform held 99.9% uptime through exam season.",
    name: "Prof. Marcus Chen",
    role: "Chief Information Officer",
    institution: "Riverdale Institute",
    initials: "MC",
    tone: "electric",
    rotate: 2,
  },
  {
    quote:
      "The analytics dashboard gives us visibility we never had. We spot at-risk students weeks earlier now.",
    name: "Dr. Fatima Aliyev",
    role: "Head of Student Success",
    institution: "Greenwood College",
    initials: "FA",
    tone: "mint",
    rotate: -2,
  },
  {
    quote:
      "Our hybrid programs run seamlessly. Remote and on-campus students share the same experience.",
    name: "Prof. Priya Sharma",
    role: "Director of Digital Learning",
    institution: "NUS",
    initials: "PS",
    tone: "violet",
    rotate: 3,
  },
];

const TONE = {
  navy: {
    avatar: "from-navy-700 to-navy-900",
    bar: "bg-navy-800",
    chip: "bg-navy-50 text-navy-800",
  },
  electric: {
    avatar: "from-electric-500 to-electric-700",
    bar: "bg-electric-500",
    chip: "bg-electric-500/10 text-electric-600",
  },
  mint: {
    avatar: "from-accent-mint to-emerald-600",
    bar: "bg-accent-mint",
    chip: "bg-accent-mint/15 text-emerald-600",
  },
  violet: {
    avatar: "from-accent-violet to-violet-700",
    bar: "bg-accent-violet",
    chip: "bg-accent-violet/15 text-violet-700",
  },
};

/* ──────────────────────────────────────────────────────────────────
   Draggable testimonial card with cursor tilt
   ────────────────────────────────────────────────────────────────── */
function DraggableCard({ data, index, inView }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const { quote, name, role, institution, initials, tone, rotate } = data;
  const t = TONE[tone];

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({ rx: (y - 0.5) * -6, ry: (x - 0.5) * 6 });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 60, rotate: 0, scale: 0.9 }}
      animate={
        inView
          ? { opacity: 1, y: 0, rotate, scale: 1 }
          : {}
      }
      transition={{
        duration: 0.85,
        delay: 0.3 + index * 0.12,
        ease: EASE.overshoot,
      }}
      whileHover={{ y: -8, rotate: 0, scale: 1.03 }}
      whileDrag={{ scale: 1.06, zIndex: 30, cursor: "grabbing" }}
      drag
      dragElastic={0.15}
      dragConstraints={{ left: -80, right: 80, top: -40, bottom: 40 }}
      dragTransition={{ bounceStiffness: 320, bounceDamping: 26 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1000 }}
      className="group relative flex w-[300px] shrink-0 cursor-grab snap-start flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-card select-none sm:w-[340px]"
    >
      {/* Colored top bar */}
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar} opacity-70`} />

      {/* Cursor tilt wrapper */}
      <motion.div
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={{ duration: 0.25, ease: EASE.smooth }}
        style={{ transformStyle: "preserve-3d" }}
        className="flex h-full flex-col"
      >
        {/* Decorative quote */}
        <Quote size={40} className="absolute right-5 top-5 text-slate-100" />

        {/* Stars */}
        <div className="mb-4 flex items-center gap-0.5 text-amber-500">
          {[0, 1, 2, 3, 4].map((s) => (
            <Star key={s} size={14} fill="currentColor" />
          ))}
        </div>

        {/* Quote */}
        <p className="relative flex-1 text-sm leading-relaxed text-slate-700">
          &ldquo;{quote}&rdquo;
        </p>

        {/* Author */}
        <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.avatar} text-sm font-bold text-white`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              {name}
              <BadgeCheck size={13} className="text-electric-500" />
            </p>
            <p className="text-xs text-slate-500">{role}</p>
            <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.chip}`}>
              {institution}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────── */
export default function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const track = useRef(null);

  const scroll = (dir) => {
    if (!track.current) return;
    track.current.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section id="testimonials" className="section-pad relative overflow-hidden">
      <div className="container">
        {/* Heading + arrows */}
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div ref={ref} className="max-w-2xl">
            {/* Live stat tag */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE.smooth }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
            >
              <span className="flex items-center gap-0.5 text-amber-500">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} size={11} fill="currentColor" />
                ))}
              </span>
              <span className="font-bold text-slate-900">16,000+</span> reviews · <span className="font-bold text-slate-900">4.9/5</span> average
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
              className="h2 mt-5"
            >
              Trusted by deans, professors,{" "}
              <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
                and students.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE.smooth }}
              className="body-lg mt-4"
            >
              Real feedback from institutions running EduCore in production.
            </motion.p>
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
              onClick={() => scroll(-1)}
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-card"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-white shadow-navy-glow transition-all hover:bg-navy-800"
            >
              <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* Horizontal track — cards fan out */}
        <div
          ref={track}
          className="mt-12 flex gap-5 overflow-x-auto pb-6 pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        >
          {TESTIMONIALS.map((t, i) => (
            <DraggableCard key={t.name} data={t} index={i} inView={inView} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE.smooth }}
          className="mt-6 flex justify-center"
        >
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-navy-400 hover:text-navy-800"
          >
            Join 150+ institutions
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}