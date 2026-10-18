// frontend/src/features/landing/sections/Panel5FaqNewsletter.jsx
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, CheckCircle2, BookOpen, Users, GraduationCap } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const STATS = [
  { icon: GraduationCap, value: "50,000", label: "Students Trained" },
  { icon: BookOpen, value: "1,200", label: "Courses Available" },
  { icon: Users, value: "98%", label: "Success Rate" },
];

const FAQS = [
  { q: "Is Learn Smart really free to start?", a: "Yes! Students can join classes for free, take AI-generated quizzes, and build streaks. No credit card required." },
  { q: "How does the AI quiz generation work?", a: "Teachers upload any PDF (lesson notes, chapter, worksheet). Our Gemini-powered AI reads the content and creates a 10-question multiple-choice quiz in about 30 seconds." },
  { q: "Is it safe for young kids?", a: "Absolutely. Every account is created by a teacher or admin. Students log in with a simple PIN. No ads, no external links, no tracking." },
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
    <section ref={ref} className="relative w-full overflow-hidden bg-slate-50 py-20 lg:py-28">
      <div className="container-wide">
        
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="grid grid-cols-1 gap-6 rounded-3xl bg-[#0a0f16] p-8 sm:grid-cols-3 sm:p-10"
        >
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="flex flex-col items-center justify-center text-center"
              >
                <Icon size={24} className="text-purple-400 mb-3" />
                <p className="font-display text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {s.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* FAQ & Newsletter */}
        <div className="mt-24 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* FAQ */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="font-display text-3xl font-extrabold leading-tight text-[#0a0f16] sm:text-4xl"
            >
              Frequently Asked Questions
            </motion.h2>
            <div className="mt-8 space-y-4">
              {FAQS.map((faq, i) => {
                const isOpen = openIdx === i;
                return (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 16 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <button
                      onClick={() => setOpenIdx(isOpen ? -1 : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="text-sm font-bold text-[#0a0f16]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        size={16}
                        className={
                          "shrink-0 text-slate-400 transition-transform " +
                          (isOpen ? "rotate-180" : "")
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
                          <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">
                            {faq.a}
                          </p>
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
            className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-xl border border-gray-100 sm:p-12"
          >
            <div className="relative">
              <h3 className="font-display text-2xl font-extrabold leading-tight text-[#0a0f16] sm:text-3xl">
                Stay updated with our newsletter
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Get the latest learning tips, platform updates, and exclusive
                offers delivered straight to your inbox.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-3">
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="h-14 w-full rounded-xl border border-gray-200 bg-slate-50 pl-11 pr-4 text-sm text-[#0a0f16] placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0a0f16] px-6 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {submitted ? (
                    <>
                      <CheckCircle2 size={16} /> Subscribed!
                    </>
                  ) : (
                    "Subscribe Now"
                  )}
                </button>
              </form>

              <p className="mt-4 text-[11px] font-semibold text-slate-400 text-center">
                No spam, unsubscribe anytime.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}