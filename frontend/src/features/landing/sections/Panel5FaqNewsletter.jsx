// frontend/src/features/landing/sections/Panel5FaqNewsletter.jsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckCircle2, ChevronDown, GraduationCap, Mail, Users } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

// Sample figures — replace with real numbers.
const STATS = [
  { icon: GraduationCap, value: "50,000", label: "Quizzes taken" },
  { icon: BookOpen, value: "1,200", label: "Classes created" },
  { icon: Users, value: "98%", label: "Parent satisfaction" },
];

const FAQS = [
  {
    q: "Is Learn Smart really free to start?",
    a: "Yes! Students can join classes for free, take AI-generated quizzes, and build streaks. No credit card required.",
  },
  {
    q: "How does the AI quiz generation work?",
    a: "Teachers upload any PDF (lesson notes, chapter, worksheet). Our Gemini-powered AI reads the content and creates a 10-question multiple-choice quiz in about 30 seconds.",
  },
  {
    q: "Is it safe for young kids?",
    a: "Absolutely. Every account is created by a teacher or admin. Students log in with a simple PIN. No ads, no external links, no tracking.",
  },
];

export default function Panel5FaqNewsletter() {
  const [openIdx, setOpenIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // TODO: send `email` to your backend / mailing-list provider.
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
    <section id="faq" className="scroll-mt-4 bg-white py-20 lg:py-28">
      <div className="container-wide">
        {/* Stats band */}
        <ul className="grid gap-8 rounded-3xl bg-ink-800 p-8 sm:grid-cols-3 sm:p-10">
          {STATS.map(({ icon: Icon, value, label }) => (
            <li key={label} className="flex flex-col items-center text-center">
              <Icon size={22} className="mb-3 text-sage-300" />
              <p className="font-display text-4xl font-semibold text-white md:text-5xl">{value}</p>
              <p className="mt-2 text-sm text-white/60">{label}</p>
            </li>
          ))}
        </ul>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* FAQ */}
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 space-y-3">
              {FAQS.map((faq, i) => {
                const isOpen = openIdx === i;
                return (
                  <div key={faq.q} className="rounded-2xl border border-ink-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="text-sm font-bold text-ink-900">{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                          <p className="px-6 pb-5 text-sm leading-relaxed text-ink-500">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Newsletter */}
          <div className="self-start rounded-[2rem] bg-sage-100 p-8 sm:p-12">
            <h3 className="font-display text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">
              Stay updated with our newsletter
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Learning tips, platform updates and new features, straight to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="h-14 w-full rounded-xl border border-ink-100 bg-white pl-11 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-500 focus:ring-4 focus:ring-sage-200"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink-800 px-6 text-sm font-bold text-white transition-colors hover:bg-ink-700"
              >
                {submitted ? (
                  <>
                    <CheckCircle2 size={16} /> Subscribed!
                  </>
                ) : (
                  "Subscribe now"
                )}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-ink-500">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
}