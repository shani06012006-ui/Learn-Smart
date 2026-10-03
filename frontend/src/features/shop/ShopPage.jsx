// frontend/src/features/shop/ShopPage.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import EduviNavbar from "../landing/components/EduviNavbar";
import EduviFooter from "../landing/components/EduviFooter";
import SubscribeSection from "../landing/sections/SubscribeSection";
import BookCard from "./components/BookCard";
import SidebarBookCard from "./components/SidebarBookCard";

const EASE = [0.22, 1, 0.36, 1];

/* All books use the same placeholder title / author / price,
   matching the reference. */
const BOOK = { title: "The Three Musketeers", author: "Alexandre Dumas", price: 40.0 };
const SIDEBAR_BOOK = { ...BOOK, price: 39.0 };

/* 6 books per grid — just duplicating the placeholder */
const GRID_BOOKS = Array(6).fill(BOOK);
const SIDEBAR_BOOKS = Array(3).fill(SIDEBAR_BOOK);

const TABS = ["All Books", "Kindergarten", "High School", "College"];

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
        <span className="font-bold text-purple-500">Shop</span>
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
                Eduvi Online
                <br />
                Book Shop
              </h1>
            </div>

            {/* Right — book stack illustration */}
            <div className="relative h-32 sm:h-40 md:h-48">
              {/* HERE IS YOUR IMAGE — book stack illustration — paste a URL over the src */}
              <img
                src=""
                alt="Stack of books"
                className="mx-auto h-full w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Fallback: simple book-spine stack so the space isn't empty */}
              <div aria-hidden className="absolute inset-0 -z-10 flex items-end justify-center gap-2 pb-4 opacity-60">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="rounded-t-md bg-gradient-to-b from-coral-400 to-coral-600"
                    style={{ width: 14 + n * 2, height: 40 + n * 18 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Section — reusable for Popular Books + New Arrivals
   ────────────────────────────────────────────────────────────────── */
function BookSection({ title, showTabs = false, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeTab, setActiveTab] = useState("All Books");

  return (
    <section ref={ref} className="pb-16 pt-4">
      <div className="container-wide">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay, ease: EASE }}
          className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl"
        >
          {title}
        </motion.h2>

        {/* Two-column layout: sidebar + grid */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <div>
            <div className="space-y-3">
              {SIDEBAR_BOOKS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: delay + 0.1 + i * 0.08, ease: EASE }}
                >
                  <SidebarBookCard book={b} index={i} />
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: delay + 0.5 }}
              className="mt-5"
            >
              <button
                type="button"
                className="text-xs font-bold uppercase tracking-wider text-purple-500 hover:text-purple-600"
              >
                See More
              </button>
            </motion.div>
          </div>

          {/* Grid area */}
          <div className="min-w-0">
            {/* Tabs + search + sort (only for Popular Books) */}
            {showTabs && (
              <>
                {/* Tabs */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: delay + 0.15, ease: EASE }}
                  className="flex flex-wrap items-center gap-2"
                  role="tablist"
                >
                  {TABS.map((tab) => {
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                          active
                            ? "bg-coral-500 text-white shadow-coral-glow"
                            : "bg-white text-slate-500 shadow-card hover:text-navy-950"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </motion.div>

                {/* Search + Sort */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: delay + 0.25, ease: EASE }}
                  className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  {/* Search */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search Class, Course, Book Name"
                      className="h-11 w-full rounded-full border border-slate-200 bg-white pr-12 pl-5 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                    />
                    <button
                      type="button"
                      aria-label="Search"
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-purple-500 text-white shadow-purple-glow transition-all hover:bg-purple-600"
                    >
                      <Search size={15} />
                    </button>
                  </div>

                  {/* Sort dropdown */}
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
              </>
            )}

            {/* Book grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
              {GRID_BOOKS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: delay + 0.3 + i * 0.06, ease: EASE }}
                >
                  <BookCard book={b} index={i} />
                </motion.div>
              ))}
            </div>
          </div>
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
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-100 bg-white px-3 py-2 shadow-card">
          <button
            type="button"
            aria-label="Previous page"
            disabled
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 text-xs font-semibold text-slate-500">
            Page <span className="text-navy-950">5</span> of{" "}
            <span className="text-navy-950">80</span>
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
export default function ShopPage() {
  return (
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        <Breadcrumb />
        <PageHero />
        <BookSection title="Popular Books" showTabs delay={0} />
        <BookSection title="New Arrivals" delay={0.1} />
        <Pagination />
        <SubscribeSection />
      </main>

      <EduviFooter />
    </div>
  );
}
