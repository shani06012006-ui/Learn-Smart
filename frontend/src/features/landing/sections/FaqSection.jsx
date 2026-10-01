import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronRight, Mail, CheckCircle2, MessageCircle } from "lucide-react";
import { EASE } from "../motion";

const FAQS = [
  {
    q: "How does SIS/ERP integration work?",
    a: "EduCore provides native integrations for the major SIS platforms (Banner, Colleague, PowerSchool, Skyward) plus a REST API and SAML/SSO for custom systems. Typical integration takes 2–4 weeks with our onboarding team.",
  },
  {
    q: "Is EduCore FERPA / GDPR compliant?",
    a: "Yes. EduCore is fully FERPA, GDPR, and SOC 2 Type II compliant. Data is encrypted in transit (TLS 1.3) and at rest (AES-256). We undergo annual third-party audits and can provide our compliance report on request.",
  },
  {
    q: "What onboarding support is provided?",
    a: "Every institutional customer is assigned a dedicated onboarding lead. We provide data migration, faculty training, student orientation materials, and a 90-day hyper-care period with priority support.",
  },
  {
    q: "How does pricing work for large institutions?",
    a: "Pricing is per-active-user, tiered by institution size. Enterprise customers get volume discounts, custom SLA terms, and can opt for on-premise or private-cloud deployment.",
  },
  {
    q: "Can we migrate from our current LMS?",
    a: "Yes. Our migration toolkit supports bulk import of courses, grades, users, and historical records from Moodle, Canvas, Blackboard, and D2L. Most migrations complete in 3–6 weeks with zero downtime.",
  },
];

function FaqItem({ faq, index, openIndex, setOpenIndex }) {
  const isOpen = openIndex === index;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: EASE.smooth }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-elevated"
    >
      <button
        type="button"
        onClick={() => setOpenIndex(isOpen ? -1 : index)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 sm:text-base">
          {faq.q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.25, ease: EASE.smooth }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
        >
          <ChevronRight size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE.smooth }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

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
    }, 3000);
  };

  return (
    <section id="faq" className="section-pad relative">
      <div ref={ref} className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* LEFT — lead form */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE.smooth }}
            className="eyebrow"
          >
            Get in touch
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE.smooth }}
            className="h2 mt-5"
          >
            Have Questions About{" "}
            <span className="bg-gradient-to-r from-navy-800 to-electric-500 bg-clip-text text-transparent">
              Onboarding EduCore?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE.smooth }}
            className="body-lg mt-5 max-w-md"
          >
            Send us an inquiry and our campus deployment team will reach out within 24 hours.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE.smooth }}
            onSubmit={handleSubmit}
            className="mt-8 max-w-md"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="focus-ring h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-navy-400"
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
                    Submit
                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              No spam. We respond within one business day.
            </p>
          </motion.form>

          {/* Alternate contact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
              <MessageCircle size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Prefer to talk to someone?
              </p>
              <a
                href="#"
                className="text-xs font-medium text-navy-800 underline-offset-2 hover:underline"
              >
                Book a 30-minute demo call →
              </a>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — FAQ accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              index={i}
              openIndex={openIndex}
              setOpenIndex={setOpenIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}