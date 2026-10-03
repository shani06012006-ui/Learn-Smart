import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ChevronRight, Mail, CheckCircle2, MessageCircle, Sparkles, HelpCircle,
} from "lucide-react";
import { EASE } from "../motion";

const FAQS = [
  {
    q: "How does SIS/ERP integration work?",
    a: "EduCore connects to Banner, Colleague, PowerSchool, Skyward, and custom systems through native adapters, REST APIs, and SAML/SSO. Typical integration takes 2–4 weeks with our onboarding team.",
  },
  {
    q: "Is EduCore FERPA and GDPR compliant?",
    a: "Yes. EduCore is FERPA, GDPR, and SOC 2 Type II compliant. Data is encrypted in transit (TLS 1.3) and at rest (AES-256). We undergo annual third-party audits and can provide our full compliance report on request.",
  },
  {
    q: "What onboarding support is included?",
    a: "Every institutional customer gets a dedicated onboarding lead, data migration assistance, faculty training sessions, and a 90-day hyper-care period with priority support.",
  },
  {
    q: "How does pricing work for large institutions?",
    a: "Pricing is per-active-user, tiered by institution size. Enterprise customers get volume discounts, custom SLA terms, and can choose between SaaS, private cloud, or on-premise deployment.",
  },
  {
    q: "Can we migrate from our current LMS?",
    a: "Yes. Our migration toolkit supports bulk import of courses, grades, users, and historical records from Moodle, Canvas, Blackboard, and D2L. Most migrations complete in 3–6 weeks with zero downtime.",
  },
];

/* ──────────────────────────────────────────────────────────────────
   Accordion item — numbered, staggered, glow on active
   ────────────────────────────────────────────────────────────────── */
function FaqItem({ faq, index, openIndex, setOpenIndex, inView }) {
  const isOpen = openIndex === index;
  const num = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.08, ease: EASE.smooth }}
      className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
        isOpen
          ? "border-navy-200 shadow-elevated"
          : "border-slate-200 shadow-card hover:border-slate-300"
      }`}
    >
      {/* Left gradient bar — grows to full height when open */}
      <motion.span
        animate={{
          scaleY: isOpen ? 1 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: EASE.smooth }}
        style={{ originY: 0 }}
        className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-navy-800 to-electric-500"
      />

      {/* Soft glow on active */}
      {isOpen && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-navy-100/40 via-transparent to-electric-100/40"
        />
      )}

      <button
        type="button"
        onClick={() => setOpenIndex(isOpen ? -1 : index)}
        className="relative flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        {/* Number badge */}
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-colors ${
            isOpen
              ? "bg-navy-800 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
          }`}
        >
          {num}
        </span>

        <span
          className={`flex-1 text-sm font-semibold transition-colors sm:text-base ${
            isOpen ? "text-navy-800" : "text-slate-900"
          }`}
        >
          {faq.q}
        </span>

        {/* Rotating chevron */}
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3, ease: EASE.smooth }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
            isOpen ? "bg-navy-100 text-navy-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          <ChevronRight size={14} />
        </motion.span>
      </button>

      {/* Answer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE.smooth }}
            className="relative overflow-hidden"
          >
            <p className="px-5 pb-5 pl-[72px] text-sm leading-relaxed text-slate-600">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────── */
export default function FaqSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [openIndex, setOpenIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3500);
  };

  return (
    <section id="faq" className="section-pad relative overflow-hidden">
      <div ref={ref} className="container grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
        {/* LEFT — copy + lead form */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE.smooth }}
            className="eyebrow"
          >
            <HelpCircle size={12} className="text-navy-800" />
            Common questions
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
            className="h2 mt-5"
          >
            Questions,{" "}
            <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
              answered.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE.smooth }}
            className="body-lg mt-5 max-w-md"
          >
            The five things every institution asks before onboarding — and our honest answers.
          </motion.p>

          {/* Email form */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35, ease: EASE.smooth }}
            onSubmit={handleSubmit}
            className="mt-8 max-w-md"
          >
            <label
              htmlFor="faq-email"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              Get a tailored walkthrough
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="faq-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 transition-all focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
                />
              </div>
              <button
                type="submit"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-navy-900 px-6 text-sm font-semibold text-white shadow-navy-glow transition-all hover:bg-navy-800"
              >
                {submitted ? (
                  <>
                    <CheckCircle2 size={16} /> Sent
                  </>
                ) : (
                  <>
                    Send
                    <ChevronRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              No spam. One reply from a real person, usually within a business day.
            </p>
          </motion.form>

          {/* Still have questions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
              <MessageCircle size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Still have questions?
              </p>
              <a
                href="#"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-navy-800 hover:underline"
              >
                Book a 30-minute demo call
                <ChevronRight size={12} />
              </a>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Accordion */}
        <div className="space-y-3 lg:col-span-7">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              index={i}
              openIndex={openIndex}
              setOpenIndex={setOpenIndex}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}