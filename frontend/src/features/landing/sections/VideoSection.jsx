// frontend/src/features/landing/sections/VideoSection.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Volume2, Radio, PlayCircle, PhoneOff, Mic } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/* 3 pill cards below the video */
const PILLS = [
  {
    label: "Audio Classes",
    tone: "coral",
    icon: Volume2,
  },
  {
    label: "Live Classes",
    tone: "purple",
    icon: Radio,
  },
  {
    label: "Recorded Class",
    tone: "teal",
    icon: PlayCircle,
  },
];

const TONE = {
  coral:  { chip: "bg-coral-50 text-coral-500",    border: "border-coral-100" },
  purple: { chip: "bg-purple-50 text-purple-500",  border: "border-purple-100" },
  teal:   { chip: "bg-teal-400/15 text-teal-500",  border: "border-teal-400/25" },
};

export default function VideoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="video" className="section-pad relative overflow-hidden">
      <div ref={ref} className="container-narrow">
        {/* Heading + body + button */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="h2"
          >
            High quality video, audio{" "}
            <br className="hidden sm:block" />
            & live classes
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="body-lg mx-auto mt-5 max-w-2xl"
          >
            High-definition video is video of higher resolution and quality than
            standard-definition. While there is no standardized meaning for
            high-definition, generally any video image with considerably more
            than 480 vertical scan lines or 576 vertical lines is considered
            high-definition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="mt-7"
          >
            <a href="#courses" className="btn-purple">
              Visit Courses
            </a>
          </motion.div>
        </div>

        {/* Video frame + dotted pattern */}
        <div className="relative mt-14">
          {/* Dotted accent — top-right of the video block */}
          <div
            aria-hidden
            className="dot-pattern-purple absolute -right-4 -top-6 z-10 hidden h-20 w-24 md:block"
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="relative rounded-[2rem] border border-slate-100 bg-white p-3 shadow-elevated sm:p-4"
          >
            {/* Video area */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.5rem] bg-slate-100">
              {/* Whiteboard teacher photo — replace with your own URL */}
              {/* HERE IS YOUR IMAGE — teacher at whiteboard — paste a URL below */}
              <img
                src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=1200&q=80"
                alt="Teacher at whiteboard"
                className="h-full w-full object-cover"
              />

              {/* Subtle overlay so floating controls read */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

              {/* PiP kid — bottom-left corner */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
                className="absolute bottom-4 left-4 hidden overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-elevated sm:block"
                style={{ width: 140, aspectRatio: "3/4" }}
              >
                {/* HERE IS YOUR IMAGE — kid in PiP — paste a URL below */}
                <img
                  src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&q=80"
                  alt="Student joining class"
                  className="h-full w-full object-cover"
                />
              </motion.div>

              {/* Floating controls — hang up (coral) + mic (purple) */}
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
                <motion.button
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.8, ease: EASE }}
                  type="button"
                  aria-label="End call"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-500 text-white shadow-coral-glow transition-all hover:bg-coral-600"
                >
                  <PhoneOff size={18} />
                </motion.button>
              </div>

              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.9, ease: EASE }}
                type="button"
                aria-label="Toggle mic"
                className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white shadow-purple-glow transition-all hover:bg-purple-600"
              >
                <Mic size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* 3 pill cards below the video */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLS.map((pill, i) => {
            const Icon = pill.icon;
            const t = TONE[pill.tone];
            return (
              <motion.div
                key={pill.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.9 + i * 0.1, ease: EASE }}
                className={`flex items-center gap-3 rounded-2xl border ${t.border} bg-white px-5 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.chip}`}>
                  <Icon size={18} />
                </span>
                <span className="font-display text-sm font-bold text-navy-950 sm:text-base">
                  {pill.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
