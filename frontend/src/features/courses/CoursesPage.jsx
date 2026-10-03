// frontend/src/features/courses/CoursesPage.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import EduviNavbar from "../landing/components/EduviNavbar";
import EduviFooter from "../landing/components/EduviFooter";
import SubscribeSection from "../landing/sections/SubscribeSection";
import StandardCard from "./components/StandardCard";
import CourseRowCard from "./components/CourseRowCard";

const EASE = [0.22, 1, 0.36, 1];

/* Top filter tabs */
const FILTERS = [
  "All Courses",
  "Kindergarten",
  "High School",
  "College",
  "Computer",
  "Science",
  "Engineering",
];

/* 12 standard cards — matching the reference (1-9, O-Level, A-Level) */
const STANDARDS = [
  { n: "1", title: "Standard One",   body: "Standard 1 is a foundation Standard that reflects 7 important concepts...", badge: "bg-coral-500",   active: false },
  { n: "2", title: "Standard Two",   body: "Standard 2 builds on the foundations of Standard 1 and includes requirements...", badge: "bg-navy-950",    active: false },
  { n: "3", title: "Standard Three", body: "Standard 3 of the Aged Care Quality Standards applies to all services delivering personal...", badge: "bg-teal-400",   active: true, href: "/courses/standard-3"  },
  { n: "4", title: "Standard Four",  body: "Standard 4 of the Aged Care Quality Standards focuses on services and supports...", badge: "bg-navy-950",     active: false },
  { n: "5", title: "Standard Five",  body: "Standard 5 Learning Resources. Learning Resources ensure that the school has the...", badge: "bg-teal-400",    active: false },
  { n: "6", title: "Standard Six",   body: "Standard 6 requires an organisation to have a system to resolve complaints...", badge: "bg-orange-400",    active: false },
  { n: "7", title: "Standard Seven", body: "Standard 7 Blood Management mandates that leaders of health service organisations...", badge: "bg-coral-600",   active: false },
  { n: "8", title: "Standard Eight", body: "Standard 8 Course from NCERT Solutions help students to understand...", badge: "bg-orange-400",      active: false },
  { n: "9", title: "Standard Nine",  body: "Standard 9 Learning Resources ensure that the school has the...", badge: "bg-coral-500",               active: false },
  { n: "O", title: "O- Level",       body: "Standard 6 requires an organisation to have a system to resolve complaints...", badge: "bg-orange-500",   active: false },
  { n: "A", title: "A- Level",       body: "Standard 6 requires an organisation to have a system to resolve complaints...", badge: "bg-amber-500",    active: false },
];

/* Placeholder course row */
const COURSE = { title: "The Three Musketeers", price: 40.0 };
const COURSES = Array(10).fill(COURSE);

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
        <span className="font-bold text-purple-500">Courses</span>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Page hero banner
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
                Eduvi Courses
                <br />
                For All Standards
              </h1>
            </div>

            {/* Right — person at desk photo */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              {/* Purple dot pattern accent */}
              <div aria-hidden className="dot-pattern-purple absolute right-0 top-0 h-16 w-24 opacity-70" />

              {/* HERE IS YOUR IMAGE — hero photo — paste a URL over the src */}
              <img
                src=""
                alt="Student at desk"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Fallback silhouette */}
              <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-paper-100">
                <svg viewBox="0 0 120 120" className="h-24 w-24 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="60" cy="40" r="16" />
                  <path d="M20 100c0-20 18-30 40-30s40 10 40 30" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Filter tabs
   ────────────────────────────────────────────────────────────────── */
function FilterTabs() {
  const [active, setActive] = useState("High School");
  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="container-wide">
        <div className="flex flex-wrap items-center gap-2 py-4" role="tablist">
          {FILTERS.map((tab) => {
            const isActive = active === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-coral-500 text-white shadow-coral-glow"
                    : "text-slate-500 hover:bg-slate-50 hover:text-navy-950"
                }`}
              >
                {tab}
              </button>
            );
          })}
          <button
            type="button"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-purple-500 transition-all hover:bg-purple-50"
          >
            More Courses
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Standard Classes section
   ────────────────────────────────────────────────────────────────── */
function StandardsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="pb-16 pt-10">
      <div className="container-wide">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE }}
          className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl"
        >
          Standard Classes
        </motion.h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {STANDARDS.map((card, i) => (
            <StandardCard key={i} card={card} index={i} inView={inView} href={card.href} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Other Courses section
   ────────────────────────────────────────────────────────────────── */
function OtherCourses() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="pb-16">
      <div className="container-wide">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE }}
          className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl"
        >
          Other Courses For High School
        </motion.h2>

        {/* Search + sort */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Serach Class, Course"
              className="h-11 w-full rounded-full border border-slate-200 bg-white pr-14 pl-5 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
            <button
              type="button"
              aria-label="Search"
              className="absolute right-1 top-1/2 flex h-9 items-center gap-1.5 -translate-y-1/2 rounded-full bg-purple-500 px-4 text-xs font-bold text-white shadow-purple-glow transition-all hover:bg-purple-600"
            >
              <Search size={13} />
              Search
            </button>
          </div>

          <div className="relative">
            <select
              defaultValue="latest"
              className="h-11 appearance-none rounded-full border border-slate-200 bg-white pr-10 pl-5 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-300"
            >
              <option value="latest">Sort by: Latest</option>
              <option value="oldest">Sort by: Oldest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </motion.div>

        {/* 2-column grid of horizontal course cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {COURSES.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.04, ease: EASE }}
            >
              <CourseRowCard course={c} index={i} active={i === 4} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Pagination
   ────────────────────────────────────────────────────────────────── */
function Pagination() {
  return (
    <div className="pb-20">
      <div className="container-wide flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-2 shadow-card">
          <button
            type="button"
            aria-label="Previous page"
            disabled
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-xs font-semibold text-slate-500">
            Page <span className="text-navy-950">1</span> of{" "}
            <span className="text-navy-950">13</span>
          </span>
          <button
            type="button"
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 text-white shadow-purple-glow transition-all hover:bg-purple-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────── */
export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        <Breadcrumb />
        <PageHero />
        <FilterTabs />
        <StandardsSection />
        <OtherCourses />
        <Pagination />
        <SubscribeSection />
      </main>

      <EduviFooter />
    </div>
  );
}