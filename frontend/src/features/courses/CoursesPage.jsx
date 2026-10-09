// frontend/src/features/courses/CoursesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MotionConfig, motion, useInView } from "framer-motion";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Users, Award } from "lucide-react";

import EduviNavbar from "../landing/components/EduviNavbar";
import EduviFooter from "../landing/components/EduviFooter";
import SubscribeSection from "../landing/sections/SubscribeSection";
import StandardCard from "./components/StandardCard";
import CourseRowCard from "./components/CourseRowCard";

const EASE = [0.22, 1, 0.36, 1];

/* Image that fades in once loaded (no pop-in) and hides itself if the URL fails */
function FadeImg({ src, alt, className = "" }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [src]);

  if (!src || failed) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
        loaded ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}

/* 🖼 Images: paste a full URL straight into each `image: ""` below
   (and the hero `src` further down). Empty = placeholder shows. */

const FILTERS = ["All Courses", "Kindergarten", "High School", "College", "Computer", "Science", "Engineering"];

const STANDARDS = [
  { n: "1", title: "Standard One",   image: "", body: "Standard 1 is a foundation Standard that reflects 7 important concepts...", badge: "bg-coral-500" },
  { n: "2", title: "Standard Two",   image: "", body: "Standard 2 builds on the foundations of Standard 1 and includes requirements...", badge: "bg-navy-950" },
  { n: "3", title: "Standard Three", image: "", body: "Standard 3 of the Aged Care Quality Standards applies to all services delivering personal...", badge: "bg-teal-400", active: true, href: "/courses/standard-3" },
  { n: "4", title: "Standard Four",  image: "", body: "Standard 4 of the Aged Care Quality Standards focuses on services and supports...", badge: "bg-navy-950" },
  { n: "5", title: "Standard Five",  image: "", body: "Standard 5 Learning Resources. Learning Resources ensure that the school has the...", badge: "bg-teal-400" },
  { n: "6", title: "Standard Six",   image: "", body: "Standard 6 requires an organisation to have a system to resolve complaints...", badge: "bg-orange-400" },
  { n: "7", title: "Standard Seven", image: "", body: "Standard 7 Blood Management mandates that leaders of health service organisations...", badge: "bg-coral-600" },
  { n: "8", title: "Standard Eight", image: "", body: "Standard 8 Course from NCERT Solutions help students to understand...", badge: "bg-orange-400" },
  { n: "9", title: "Standard Nine",  image: "", body: "Standard 9 Learning Resources ensure that the school has the...", badge: "bg-coral-500" },
  { n: "O", title: "O-Level",        image: "", body: "Standard 6 requires an organisation to have a system to resolve complaints...", badge: "bg-orange-500" },
  { n: "A", title: "A-Level",        image: "", body: "Standard 6 requires an organisation to have a system to resolve complaints...", badge: "bg-amber-500" },
];

const COURSES = Array.from({ length: 10 }, (_, i) => ({
  title: "The Three Musketeers",
  price: 40.0,
  image: "",            // 🖼 per-course thumbnail
  category: "High School",
  rating: "4.8",
  lessons: 24,
  hours: 12,
  id: i,
}));

const PAGE_SIZE = 6;

/* ── Breadcrumb ─────────────────────────────────────────────────── */
function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-paper-50">
      <div className="container-wide flex h-12 items-center gap-2 text-xs">
        <Link to="/" className="font-semibold text-slate-400 transition-colors hover:text-navy-950">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-purple-500" aria-current="page">Courses</span>
      </div>
    </nav>
  );
}

/* ── Hero ───────────────────────────────────────────────────────── */
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
          <div className="relative z-10 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl">
                Learn Smart Courses
                <br />
                For All Standards
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
                Pick your standard, follow structured lessons, and learn at your own pace.
              </p>
              <a
                href="#standards"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("standards")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-6 inline-flex rounded-full bg-coral-500 px-6 py-3 text-xs font-bold text-white shadow-coral-glow transition-colors hover:bg-coral-600"
              >
                Browse standards
              </a>
            </div>

            {/* IMAGE SPACE — hero photo: paste your URL in src below */}
            <div className="relative">
              <div aria-hidden className="dot-pattern-purple absolute -right-3 -top-3 h-20 w-28 opacity-70" />
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-purple-100 to-paper-100 shadow-card">
                <FadeImg
                  src="https://i.pinimg.com/1200x/c9/dc/69/c9dc696611bebb48fa1e775039aff34e.jpg"
                  alt="Student learning at a desk"
                />
              </div>

              {/* floating stat chips */}
              <div className="absolute -bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-card">
                <Users size={16} className="text-purple-500" />
                <span className="text-xs font-bold text-navy-950">12k+ students</span>
              </div>
              <div className="absolute -top-4 right-6 hidden items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-card sm:flex">
                <Award size={16} className="text-coral-500" />
                <span className="text-xs font-bold text-navy-950">Certified courses</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Filter tabs (sticky, scrolls sideways on mobile) ───────────── */
function FilterTabs({ active, setActive }) {
  return (
    <div className="border-b border-slate-100 bg-white md:sticky md:top-20 md:z-20">
      <div className="container-wide">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-4" role="tablist">
          {FILTERS.map((tab) => {
            const isActive = active === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  isActive ? "bg-coral-500 text-white shadow-coral-glow" : "text-slate-500 hover:bg-slate-50 hover:text-navy-950"
                }`}
              >
                {tab}
              </button>
            );
          })}
          <button
            type="button"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-purple-500 transition-colors hover:bg-purple-50"
          >
            More Courses
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Standards ──────────────────────────────────────────────────── */
function StandardsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="standards" ref={ref} className="scroll-mt-40 pb-16 pt-10">
      <div className="container-wide">
        <h2 className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl">Standard Classes</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a standard to see its subjects and lessons.</p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {STANDARDS.map((card) => (
            <StandardCard key={card.n} card={card} href={card.href} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Other courses (search, sort and pagination all work) ───────── */
function OtherCourses() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const topRef = useRef(null);

  const goTo = (p) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const results = useMemo(() => {
    let list = COURSES.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));
    if (sort === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "oldest") list = [...list].reverse();
    return list;
  }, [query, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <section ref={topRef} className="scroll-mt-36 pb-12">
      <div className="container-wide">
        <h2 className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl">Other Courses For High School</h2>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search class or course"
              aria-label="Search class or course"
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-5 pr-14 text-sm text-navy-950 outline-none transition-colors placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
            <span className="absolute right-1 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-full bg-purple-500 px-4 text-xs font-bold text-white shadow-purple-glow">
              <Search size={13} />
              <span className="hidden sm:inline">Search</span>
            </span>
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort courses"
              className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white pl-5 pr-10 text-sm font-semibold text-navy-950 outline-none transition-colors focus:border-purple-300 sm:w-auto"
            >
              <option value="latest">Sort by: Latest</option>
              <option value="oldest">Sort by: Oldest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {visible.length ? (
          <motion.div
            key={`${current}-${sort}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            {visible.map((c, i) => (
              <CourseRowCard key={c.id} course={c} active={i === 0 && current === 1} />
            ))}
          </motion.div>
        ) : (
          <p className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
            No courses match “{query}”. Try a different name.
          </p>
        )}

        <Pagination page={current} total={totalPages} onChange={goTo} />
      </div>
    </section>
  );
}

/* ── Pagination ─────────────────────────────────────────────────── */
function Pagination({ page, total, onChange }) {
  return (
    <div className="mt-10 flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-2 shadow-card">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 text-white shadow-purple-glow transition-colors hover:bg-purple-600 disabled:bg-transparent disabled:text-slate-300 disabled:shadow-none"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-xs font-semibold text-slate-500">
          Page <span className="text-navy-950">{page}</span> of <span className="text-navy-950">{total}</span>
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page === total}
          onClick={() => onChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 text-white shadow-purple-glow transition-colors hover:bg-purple-600 disabled:bg-transparent disabled:text-slate-300 disabled:shadow-none"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function CoursesPage() {
  const [activeFilter, setActiveFilter] = useState("High School");

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        <Breadcrumb />
        <PageHero />
        <FilterTabs active={activeFilter} setActive={setActiveFilter} />
        <StandardsSection />
        <OtherCourses />
        <SubscribeSection />
      </main>

      <EduviFooter />
    </div>
    </MotionConfig>
  );
}