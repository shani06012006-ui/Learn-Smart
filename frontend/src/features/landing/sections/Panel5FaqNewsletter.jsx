// frontend/src/features/landing/sections/Panel5FaqNewsletter.jsx
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Sparkles, CheckCircle2 } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const FAQS = [
  { q: "Is Learn Smart really free to start?", a: "Yes! Students can join classes for free, take AI-generated quizzes, and build streaks. No credit card required." },
  { q: "How does the AI quiz generation work?", a: "Teachers upload any PDF (lesson notes, chapter, worksheet). Our Gemini-powered AI reads the content and creates a 10-question multiple-choice quiz in about 30 seconds." },
  { q: "Is it safe for young kids?", a: "Absolutely. Every account is created by a teacher or admin. Students log in with a simple PIN. No ads, no external links, no tracking." },
  { q: "What are streaks and XP?", a: "Every day a student logs in and completes a quiz, their streak grows. They earn XP points, unlock badges, and can see their progress over time — just like a game." },
];

export default function Panel5FaqNewsletter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [openIdx, setOpenIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-navy-950 py-20"
    >
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      {/* Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      <div className="container-wide relative">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* FAQ */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-xs font-bold uppercase tracking-widest text-purple-400"
            >
              Got questions?
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
            >
              Everything you{" "}
              <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                need to know.
              </span>
            </motion.h2>

            <div className="mt-8 space-y-3">
              {FAQS.map((faq, i) => {
                const isOpen = openIdx === i;
                return (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 16 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm backdrop-blur-xl"
                  >
                    <button
                      onClick={() => setOpenIdx(isOpen ? -1 : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-bold text-white">{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className={
                          "shrink-0 text-slate-400 transition-transform " + (isOpen ? "rotate-180" : "")
                        }
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/90 via-purple-700/90 to-emerald-600/90 p-8 text-white shadow-2xl backdrop-blur-xl"
          >
            <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <Sparkles size={11} /> Weekly updates
              </span>
              <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                Get learning tips, new features, and quiz ideas — every Sunday.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Join 2,400+ parents who stay in the loop. No spam, unsubscribe anytime.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur-sm focus:border-white/40 focus:bg-white/15"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-purple-700 transition hover:bg-slate-50"
                >
                  {submitted ? (
                    <>
                      <CheckCircle2 size={16} /> Subscribed!
                    </>
                  ) : (
                    "Subscribe free"
                  )}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-4 text-[11px] font-semibold text-white/60">
                <span>✓ No spam</span>
                <span>✓ Weekly only</span>
                <span>✓ Unsubscribe anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}