// frontend/src/features/landing/sections/HeroSection.jsx
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence
} from "framer-motion";
import {
  ChevronDown, Sparkles, Flame, CheckCircle2, ArrowRight,
  ShieldCheck, Rocket, Check, X
} from "lucide-react";
import confetti from "canvas-confetti";

const EASE = [0.22, 1, 0.36, 1];

/* ──────────────────────────────────────────────────────────────────
   Word-by-Word Text Reveal
   ────────────────────────────────────────────────────────────────── */
const TextReveal = ({ text, className }) => {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

/* ──────────────────────────────────────────────────────────────────
   Interactive Quiz Widget
   ────────────────────────────────────────────────────────────────── */
function QuizWidget() {
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [showXp, setShowXp] = useState(false);

  const handleAnswer = (isCorrect) => {
    if (answered) return;
    setCorrect(isCorrect);
    setAnswered(true);

    if (isCorrect) {
      setShowXp(true);
      // Fire Confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8, x: 0.7 },
        colors: ["#10b981", "#8b5cf6", "#f59e0b"],
        disableForReducedMotion: true,
      });
      setTimeout(() => setShowXp(false), 2000);
    }
  };

  return (
    <div className="relative">
      {/* Floating XP Animation */}
      <AnimatePresence>
        {showXp && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -60, scale: 1.2 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-10 z-50 -translate-x-1/2 text-lg font-black text-emerald-500 drop-shadow-md"
          >
            +50 XP
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-3">
        <p className="text-sm font-extrabold text-navy-950 mb-3">What is 7 x 8?</p>
        <div className="space-y-2">
          <button
            onClick={() => handleAnswer(false)}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all ${
              answered && !correct ? "border-rose-500 bg-rose-50 text-rose-800" :
              "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
              answered && !correct ? "bg-rose-600 text-white" : "bg-slate-100"
            }`}>A</span>
            <span className="font-semibold">54</span>
            {answered && !correct && <X size={14} className="ml-auto text-rose-600" />}
          </button>

          <button
            onClick={() => handleAnswer(true)}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all ${
              answered && correct ? "border-emerald-500 bg-emerald-50 text-emerald-800" :
              "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
              answered && correct ? "bg-emerald-600 text-white" : "bg-slate-100"
            }`}>B</span>
            <span className="font-semibold">56</span>
            {answered && correct && <Check size={14} className="ml-auto text-emerald-600" />}
          </button>
        </div>
        
        {answered && (
          <button
            onClick={() => { setAnswered(false); setCorrect(false); }}
            className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-purple-600 transition"
          >
            Reset Quiz
          </button>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Main Hero Component
   ────────────────────────────────────────────────────────────────── */
export default function HeroSection() {
  const containerRef = useRef(null);

  // 1. Scroll Parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const orbsY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // 2. 3D Cursor Tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 20); // Rotate up to 20deg
    mouseY.set(y * -20);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28 perspective-1000"
    >
      {/* ── 1. Ambient Background (Parallax) ── */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden transform-gpu will-change-transform"
      >
        <div className="absolute inset-0 bg-paper-50" />
        <div className="absolute -left-[10%] -top-[20%] h-[700px] w-[700px] rounded-full bg-emerald-400/20 mix-blend-multiply blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-purple-400/20 mix-blend-multiply blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/10 blur-[100px]" />
        
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: "radial-gradient(#7c6fdd 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
      </motion.div>

      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* ── LEFT — Copy & CTAs ── */}
          <motion.div style={{ opacity }} className="min-w-0 lg:col-span-6 xl:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 shadow-sm"
            >
              <Sparkles size={14} className="text-purple-500" />
              The #1 AI Learning Platform for Kids
            </motion.div>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-950 sm:text-5xl lg:text-6xl">
              <TextReveal text="Turn any lesson into a" />
              <span className="relative inline-block text-purple-600 mt-2">
                <TextReveal text="game they love." />
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1, ease: EASE }}
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 origin-left bg-emerald-200/60"
                />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
            >
              Help your child build a daily learning habit. Our AI transforms boring PDFs 
              into interactive quizzes, rewarding them with streaks and badges. Safe, engaging, and trusted by thousands of parents.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/student-login"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_30px_rgb(109,40,217,0.3)] transition-all hover:bg-purple-700 hover:shadow-[0_8px_30px_rgb(109,40,217,0.5)]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
                  Start Learning Free
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  I'm a Teacher
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT — 3D Tilt Visual & Widgets ── */}
          <div className="relative min-w-0 lg:col-span-6 xl:col-span-6 perspective-1000">
            
            <motion.div
              style={{ opacity }}
              className="relative mx-auto aspect-[4/5] w-full max-w-sm md:max-w-md lg:max-w-lg"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Organic background shape */}
              <div className="absolute inset-4 rounded-[3rem] bg-gradient-to-tr from-emerald-200/60 to-purple-200/60 opacity-80" />

              {/* Kid Photo with 3D Tilt */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
                style={{ rotateX: springY, rotateY: springX, transformStyle: "preserve-3d" }}
                className="absolute inset-x-0 bottom-0 top-8 overflow-hidden rounded-[3rem] shadow-2xl transform-gpu will-change-transform"
              >
                {/* PASTE YOUR IMAGE URL HERE 👇 */}
                <img
                  src="https://i.pinimg.com/1200x/85/e8/08/85e80878dbd55569c3f4e4e479b2e9a9.jpg"
                  alt="Happy student learning"
                  className="h-full w-full object-cover object-top"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </motion.div>

              {/* ── Glassmorphism Widget ── */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
                style={{ translateZ: 50 }} // Pops out in 3D
                className="absolute -bottom-6 -right-4 z-30 w-64 animate-float rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl sm:-right-8"
              >
                {/* Streak Header */}
                <div className="flex items-center justify-between border-b border-slate-100/50 pb-3">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    >
                      <Flame size={16} className="text-amber-500" />
                    </motion.span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Streak</p>
                      <p className="text-sm font-extrabold text-navy-950">5 Days</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">+50 XP</span>
                </div>

                {/* Interactive Quiz */}
                <QuizWidget />
              </motion.div>

              {/* Floating Badges */}
              <motion.div
                style={{ translateZ: 80 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
                className="absolute left-0 top-[6%] z-20 animate-float-slow rounded-full border border-emerald-200 bg-emerald-100/90 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-lg backdrop-blur-md"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} /> 100% Safe Learning
                </span>
              </motion.div>

              <motion.div
                style={{ translateZ: 80 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
                className="absolute right-[72%] top-[14%] z-20 animate-float rounded-full border border-purple-200 bg-purple-100/90 px-3 py-1.5 text-xs font-bold text-purple-800 shadow-lg backdrop-blur-md"
              >
                <span className="flex items-center gap-1.5">
                  <Rocket size={14} /> AI-Powered Quizzes
                </span>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}