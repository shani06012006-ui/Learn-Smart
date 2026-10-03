// frontend/src/features/landing/sections/StandardsSection.jsx
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/* 3 tabs */
const TABS = ["Kindergarten", "High School", "College"];

/* 8 cards — colors + copy match the reference */
const CARDS = [
  {
    n: 1,
    title: "Standard One",
    body: "Standard 1 is a foundation Standard that reflects 7 important concepts…",
    badge: "bg-coral-500",
    active: false,
  },
  {
    n: 2,
    title: "Standard Two",
    body: "Standard 2 builds on the foundations of Standard 1 and includes requirements…",
    badge: "bg-navy-950",
    active: false,
  },
  {
    n: 3,
    title: "Standard Three",
    body: "Standard 3 of the Aged Care Quality Standards applies to all services delivering personal…",
    badge: "bg-teal-400",
    active: true,
  },
  {
    n: 4,
    title: "Standard Four",
    body: "Standard 4 of the Aged Care Quality Standards focuses on services and supports…",
    badge: "bg-navy-950",
    active: false,
  },
  {
    n: 5,
    title: "Standard Five",
    body: "Standard 5 Learning Resources. Learning Resources ensure that the school has the…",
    badge: "bg-teal-400",
    active: false,
  },
  {
    n: 6,
    title: "Standard Six",
    body: "Standard 6 requires an organisation to have a system to resolve complaints…",
    badge: "bg-orange-400",
    active: false,
  },
  {
    n: 7,
    title: "Standard Seven",
    body: "Standard 7 Blood Management mandates that leaders of health service organisations…",
    badge: "bg-coral-600",
    active: false,
  },
  {
    n: 8,
    title: "Standard Eight",
    body: "Standard 8 Course from NCERT Solutions help students to understand…",
    badge: "bg-orange-400",
    active: false,
  },
];

/* Small detail card — the 8 cards are all this shape */
function StandardCard({ card, index, inView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.3 + index * 0.05, ease: EASE }}
      className="group relative flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-5 py-7 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      {/* Number badge */}
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white shadow-soft ${card.badge}`}
      >
        {card.n}
      </span>

      {/* Title */}
      <h3 className="mt-5 font-display text-lg font-extrabold text-navy-950">
        {card.title}
      </h3>

      {/* Body */}
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
        {card.body}
      </p>

      {/* Class Details button — outlined normally, filled for the active card */}
      <button
        type="button"
        className={`mt-6 inline-flex items-center justify-center rounded-full border-2 px-5 py-2 text-xs font-bold transition-all ${
          card.active
            ? "border-purple-500 bg-purple-500 text-white shadow-purple-glow hover:bg-purple-600"
            : "border-purple-200 bg-white text-purple-600 hover:border-purple-400 hover:bg-purple-50"
        }`}
      >
        Class Details
      </button>
    </motion.div>
  );
}

export default function StandardsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeTab, setActiveTab] = useState("High School");

  return (
    <section id="standards" className="section-pad relative overflow-hidden">
      <div ref={ref} className="container-wide">
        {/* Heading */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="h2"
          >
            Qualified lessons for students
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="body-lg mx-auto mt-5 max-w-2xl"
          >
            A lesson or class is a structured period of time where learning is
            intended to occur. It involves one or more students being taught by
            a teacher or instructor.
          </motion.p>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
          className="mt-8 flex items-center justify-center gap-1"
          role="tablist"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={`-translate-y-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-coral-500 text-white shadow-coral-glow -translate-y-0.5"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </motion.div>

        {/* 8-card grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => (
            <StandardCard key={card.n} card={card} index={i} inView={inView} />
          ))}
        </div>

        {/* Visit More Classes button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.9, ease: EASE }}
          className="mt-12 flex justify-center"
        >
          <a href="#courses" className="btn-purple">
            Visit More Classes
          </a>
        </motion.div>
      </div>
    </section>
  );
}