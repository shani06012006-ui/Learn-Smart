// frontend/src/features/landing/sections/SubscribeSection.jsx
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/* 5 scattered avatars around the panel — each uses an image URL.
   Replace each src with your own image link. */
const AVATARS = [
  {
    id: "a1",
    top: "18%",
    left: "6%",
    size: 48,
    ring: "ring-coral-200",
    delay: 0.5,
    // HERE IS YOUR IMAGE — avatar 1 — paste a URL below
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
  },
  {
    id: "a2",
    top: "72%",
    left: "12%",
    size: 56,
    ring: "ring-purple-300",
    delay: 0.65,
    // HERE IS YOUR IMAGE — avatar 2 — paste a URL below
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
  },
  {
    id: "a3",
    top: "12%",
    left: "86%",
    size: 52,
    ring: "ring-teal-400/60",
    delay: 0.8,
    // HERE IS YOUR IMAGE — avatar 3 — paste a URL below
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
  },
  {
    id: "a4",
    top: "68%",
    left: "82%",
    size: 60,
    ring: "ring-coral-200",
    delay: 0.95,
    // HERE IS YOUR IMAGE — avatar 4 — paste a URL below
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  },
  {
    id: "a5",
    top: "42%",
    left: "92%",
    size: 44,
    ring: "ring-purple-300",
    delay: 1.1,
    // HERE IS YOUR IMAGE — avatar 5 — paste a URL below
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80",
  },
];

export default function SubscribeSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <section id="subscribe" className="section-pad relative overflow-hidden">
      <div ref={ref} className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 px-6 py-14 sm:px-10 sm:py-16 md:px-14 md:py-20"
        >
          {/* Soft glows */}
          <div aria-hidden className="pointer-events-none absolute -left-40 -top-20 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-40 -bottom-20 h-96 w-96 rounded-full bg-coral-500/10 blur-3xl" />

          {/* Scattered avatars */}
          {AVATARS.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: a.delay, ease: EASE }}
              style={{
                top: a.top,
                left: a.left,
                width: a.size,
                height: a.size,
              }}
              className="absolute z-10 hidden sm:block"
            >
              <div
                className={`h-full w-full overflow-hidden rounded-full ring-4 ring-white/20 shadow-elevated`}
              >
                {/* HERE IS YOUR IMAGE — avatar in subscribe band — paste a URL over the src */}
                <img
                  src={a.src}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </motion.div>
          ))}

          {/* Centered content */}
          <div className="relative z-20 mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
              className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
            >
              Subscribe For Get Update
              <br className="hidden sm:block" /> Every New Courses
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
              className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-base"
            >
              20k+ students daily learn with Eduvi. Subscribe for new courses.
            </motion.p>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
              onSubmit={onSubmit}
              className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter your email"
                className="h-12 flex-1 rounded-full border border-white/10 bg-white/10 px-5 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-sm transition-all focus:border-purple-400 focus:bg-white/15"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-purple-500 px-7 text-sm font-bold text-white shadow-purple-glow transition-all hover:bg-purple-400 hover:-translate-y-0.5"
              >
                {submitted ? (
                  <>
                    <CheckCircle2 size={16} /> Subscribed
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
