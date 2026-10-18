// frontend/src/features/landing/sections/Panel1Hero.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FileText, CheckCircle2, PlayCircle, Star } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

export default function Panel1Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0f16] py-20 lg:py-0">
      {/* Background glow & subtle grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/3 rounded-full bg-purple-600/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      <div className="container-wide relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — Copy */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Unlock Your Next
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Learning Move</span>
                <span className="absolute bottom-2 left-0 -z-0 h-3 w-full bg-purple-600/40 blur-[2px]" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="mt-6 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base"
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit
              tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo. We crush
              the barriers to gaining a degree.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/student-login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0a0f16] transition-all hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Find Your Course
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
              >
                I'm a Teacher
              </Link>
            </motion.div>

            {/* Avatars row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0a0f16] bg-slate-700"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="student"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs font-semibold text-slate-400">
                Join <strong className="text-white">40,000+</strong> learners
                worldwide
              </div>
            </motion.div>
          </div>

          {/* RIGHT — Image & Floating Icons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="relative mx-auto w-full max-w-md lg:max-w-lg"
          >
            {/* The main image */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[3rem] rounded-tl-[8rem] bg-slate-800 shadow-2xl">
              {/* PASTE YOUR IMAGE URL HERE */}
              <img src="https://i.pinimg.com/1200x/0c/60/5f/0c605f5725146674637fe3342783ecf4.jpg" 
              alt="Student" 
              className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16]/40 to-transparent" />
            </div>

            {/* Floating Icons (referencing the illustration style) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-6 top-12 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-md"
            >
              <FileText size={24} />
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-4 top-1/4 flex h-14 w-14 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/20 text-purple-300 shadow-xl backdrop-blur-md"
            >
              <Sparkles size={24} />
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -left-2 bottom-24 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-emerald-400 shadow-xl backdrop-blur-md"
            >
              <CheckCircle2 size={28} />
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -right-6 bottom-12 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-md"
            >
              <PlayCircle size={20} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}