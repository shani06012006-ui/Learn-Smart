// frontend/src/features/pricing/PricingPage.jsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";

import EduviNavbar from "../landing/components/EduviNavbar";
import EduviFooter from "../landing/components/EduviFooter";
import SubscribeSection from "../landing/sections/SubscribeSection";

const EASE = [0.22, 1, 0.36, 1];

/* ── Feature grid per pack ────────────────────────────────────────
   value: text to show (e.g. "3" or "")
   included: true → green check + label, false → grey X + muted label */
const PACKS = [
  {
    id: "basic",
    title: "Basic Pack",
    price: 200,
    featured: false,
    features: [
      { label: "HD video lessons & tutorials", value: "3", included: true },
      { label: "Official exam",                value: "1", included: true },
      { label: "Practice questions",           value: "100", included: true },
      { label: "1 Month subscriptions",        value: "", included: true },
      { label: "Free book",                    value: "1", included: true },
      { label: "Practice quizzes & assignments", value: "", included: false },
      { label: "In depth explanations",        value: "", included: false },
      { label: "Personal instructor Assistance", value: "", included: false },
    ],
  },
  {
    id: "standard",
    title: "Standard Pack",
    price: 600,
    featured: true,
    features: [
      { label: "HD video lessons & tutorials", value: "8", included: true },
      { label: "Official exam",                value: "2", included: true },
      { label: "Practice questions",           value: "200", included: true },
      { label: "1 Month subscriptions",        value: "", included: true },
      { label: "Free books",                   value: "3", included: true },
      { label: "Practice quizzes & assignments", value: "", included: true },
      { label: "In depth explanations",        value: "", included: false },
      { label: "Personal instructor Assistance", value: "", included: false },
    ],
  },
  {
    id: "premium",
    title: "Premium Pack",
    price: 1200,
    featured: false,
    features: [
      { label: "HD video lessons & tutorials", value: "15", included: true },
      { label: "Official exam",                value: "3", included: true },
      { label: "Practice questions",           value: "300", included: true },
      { label: "1 Month subscriptions",        value: "", included: true },
      { label: "Free books",                   value: "5", included: true },
      { label: "Practice quizzes & assignments", value: "", included: true },
      { label: "In depth explanations",        value: "", included: true },
      { label: "Personal instructor Assistance", value: "", included: true },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────
   Breadcrumb
   ────────────────────────────────────────────────────────────────── */
function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-paper-50">
      <div className="container-wide flex h-12 items-center gap-2 text-xs">
        <Link to="/" className="font-semibold text-slate-400 transition-colors hover:text-navy-950">
          Home
        </Link>
        <span className="text-slate-300">|</span>
        <span className="font-bold text-purple-500">Pricing</span>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Page hero
   ────────────────────────────────────────────────────────────────── */
function PageHero() {
  return (
    <section className="bg-paper-100 pb-8 pt-6">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-paper-100 to-purple-100/40 px-6 py-10 sm:px-10 sm:py-14"
        >
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            {/* Left — heading */}
            <div>
              <h1 className="font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl">
                Our Pre-ready
                <br />
                Pricing Packages
              </h1>
            </div>

            {/* Right — illustration */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              {/* HERE IS YOUR IMAGE — pricing hero illustration — paste a URL over the src */}
              <img
                src=""
                alt="Pricing illustration"
                className="absolute inset-0 h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Fallback — abstract shapes */}
              <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-full w-full">
                  {/* Calculator */}
                  <div className="absolute left-[8%] top-[30%] h-[55%] w-[26%] rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 shadow-elevated">
                    <div className="mx-auto mt-3 h-3 w-12 rounded bg-white/90" />
                    <div className="mt-2 grid grid-cols-3 gap-1 px-3">
                      {[1,2,3,4,5,6,7,8,9].map((n) => (
                        <div key={n} className="h-3 rounded bg-white/60" />
                      ))}
                    </div>
                  </div>
                  {/* Plant */}
                  <div className="absolute left-[30%] bottom-[10%] h-[35%] w-[10%] rounded-t-md bg-coral-500" />
                  <div className="absolute left-[27%] bottom-[40%] h-[20%] w-[16%] rounded-full bg-emerald-500" />
                  {/* X mark */}
                  <div className="absolute left-[46%] top-[55%] flex h-[18%] w-[12%] items-center justify-center rounded bg-coral-500 text-2xl font-black text-white">×</div>
                  {/* Person on box */}
                  <div className="absolute right-[10%] top-[20%] h-[70%] w-[38%]">
                    <div className="mx-auto h-[80%] w-full rounded-lg bg-gradient-to-br from-amber-500 to-coral-500" />
                    <div className="absolute -top-6 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-amber-700" />
                  </div>
                  {/* Red pill */}
                  <div className="absolute right-[6%] top-[16%] h-6 w-14 rounded-full bg-coral-500 shadow-coral-glow" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Section heading
   ────────────────────────────────────────────────────────────────── */
function SectionHeading() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="container-narrow pt-14 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: EASE }}
        className="h2"
      >
        We create a monthly pricing package
        <br className="hidden sm:block" />
        for all standard students
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
        className="body-lg mx-auto mt-5 max-w-2xl"
      >
        Basically we create this package for those who are really interested and
        get benefited from our courses or books. We want to make a low cost
        package for them. So that they can purchase any courses with the package
        they buy from us. Also will get free books from every packages.
      </motion.p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Pricing card
   ────────────────────────────────────────────────────────────────── */
function PricingCard({ pack, index, inView }) {
  const { title, price, features, featured } = pack;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: 0.2 + index * 0.1, ease: EASE }}
      className={`relative flex flex-col rounded-3xl border-2 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated ${
        featured ? "border-purple-200" : "border-transparent"
      }`}
    >
      {/* Icon */}
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
        <Pencil size={20} />
      </span>

      {/* Title */}
      <h3 className="mt-5 font-display text-xl font-extrabold text-navy-950">
        {title}
      </h3>

      {/* Divider */}
      <div className="mt-5 h-px bg-slate-100" />

      {/* Features */}
      <ul className="mt-5 flex-1 space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                f.included
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-coral-50 text-coral-500"
              }`}
            >
              {f.included ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
            </span>
            <span
              className={`flex-1 ${
                f.included ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {f.value && <span className="font-bold text-navy-950">{f.value} </span>}
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Price */}
      <p className="mt-6 font-display text-3xl font-extrabold text-navy-950">
        <span className="text-xl align-top">$</span>
        {price}
      </p>

      {/* CTA button */}
      <Link
        to="/register"
        className={`mt-5 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-all ${
          featured
            ? "bg-purple-500 text-white shadow-purple-glow hover:bg-purple-600 hover:-translate-y-0.5"
            : "border-2 border-purple-200 bg-white text-purple-500 hover:border-purple-400 hover:bg-purple-50"
        }`}
      >
        Purchase Course
      </Link>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Pricing grid
   ────────────────────────────────────────────────────────────────── */
function PricingGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="pb-20 pt-12">
      <div className="container-wide">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((pack, i) => (
            <PricingCard key={pack.id} pack={pack} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────── */
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        <Breadcrumb />
        <PageHero />
        <SectionHeading />
        <PricingGrid />
        <SubscribeSection />
      </main>

      <EduviFooter />
    </div>
  );
}