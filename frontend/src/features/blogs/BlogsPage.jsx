// frontend/src/features/blogs/BlogsPage.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Search, Sparkles } from "lucide-react";

import EduviNavbar from "../landing/components/EduviNavbar";
import EduviFooter from "../landing/components/EduviFooter";
import SubscribeSection from "../landing/sections/SubscribeSection";
import BlogCard from "./components/BlogCard";

const EASE = [0.22, 1, 0.36, 1];

const CATEGORIES = ["All", "Study Tips", "Career", "Technology", "Wellbeing"];

/* 9 sample posts — replace with real data later */
const POSTS = [
  { id: "1", category: "Study Tips",  title: "How to build a study schedule that actually works", excerpt: "Most schedules fail in the first week. Here's the system top students use to stay consistent.", date: "Oct 1, 2026",  readTime: "5 min",  author: "Esther Howard",  authorInitials: "EH" },
  { id: "2", category: "Career",      title: "The skills employers will look for in 2027",           excerpt: "AI literacy is table stakes now. Here's what else is showing up in job listings.",        date: "Sep 28, 2026", readTime: "7 min",  author: "Wade Warren",    authorInitials: "WW" },
  { id: "3", category: "Technology",  title: "Why every student should learn a bit of code",        excerpt: "You don't need to be an engineer. But understanding code changes how you solve problems.", date: "Sep 25, 2026", readTime: "4 min",  author: "Jenny Wilson",   authorInitials: "JW" },
  { id: "4", category: "Wellbeing",   title: "The case for taking real breaks while studying",       excerpt: "Marathon sessions feel productive. Research says they're not. Here's what to do instead.", date: "Sep 22, 2026", readTime: "6 min",  author: "Kristin Watson", authorInitials: "KW" },
  { id: "5", category: "Study Tips",  title: "Active recall beats re-reading. Every time.",          excerpt: "If you're studying by highlighting the textbook, you're wasting your time.",         date: "Sep 19, 2026", readTime: "4 min",  author: "Cameron Fox",    authorInitials: "CF" },
  { id: "6", category: "Technology",  title: "AI study tools: what to use and what to skip",         excerpt: "There are hundreds of AI study apps. Most are useless. These are the ones that help.", date: "Sep 15, 2026", readTime: "8 min",  author: "Marvin McKinney", authorInitials: "MM" },
  { id: "7", category: "Career",      title: "How to write a portfolio that gets you hired",        excerpt: "Hiring managers don't read CVs. They skim. Here's how to make every second count.",  date: "Sep 12, 2026", readTime: "6 min",  author: "Ronald Richards", authorInitials: "RR" },
  { id: "8", category: "Wellbeing",   title: "Study burnout is real. Here's how to spot it early",   excerpt: "The signs show up weeks before you crash. Learn to catch them in time.",             date: "Sep 8, 2026",  readTime: "5 min",  author: "Theresa Webb",   authorInitials: "TW" },
  { id: "9", category: "Study Tips",  title: "The 25-minute rule that changed how I study",         excerpt: "Pomodoro works. But most people do it wrong. Here's the corrected version.",        date: "Sep 5, 2026",  readTime: "3 min",  author: "Robert Fox",     authorInitials: "RF" },
];

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-paper-50">
      <div className="container-wide flex h-12 items-center gap-2 text-xs">
        <Link to="/" className="font-semibold text-slate-400 transition-colors hover:text-navy-950">
          Home
        </Link>
        <span className="text-slate-300">|</span>
        <span className="font-bold text-purple-500">Blogs</span>
      </div>
    </nav>
  );
}

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
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-coral-100 bg-coral-50/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-coral-500">
                <Sparkles size={12} />
                Insights & guides
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl">
                The Learn Smart
                <br />
                Learning Blog
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
                Study tips, career advice, and honest takes on what modern
                students and teachers actually need.
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              {/* HERE IS YOUR IMAGE — blog hero illustration — paste a URL over the src */}
              <img
                src=""
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              {/* Fallback gradient + icon */}
              <div aria-hidden className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-paper-100">
                <svg viewBox="0 0 120 100" className="h-20 w-24 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="20" y="20" width="80" height="60" rx="6" />
                  <path d="M20 40h80M40 20v60" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BlogGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeCat, setActiveCat] = useState("All");

  const filtered = activeCat === "All" ? POSTS : POSTS.filter((p) => p.category === activeCat);

  return (
    <section ref={ref} className="pb-16 pt-10">
      <div className="container-wide">
        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-wrap items-center gap-2"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-coral-500 text-white shadow-coral-glow"
                    : "bg-white text-slate-500 shadow-card hover:text-navy-950"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </motion.div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.05, ease: EASE }}
            >
              <BlogCard post={post} index={i} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-16 text-center text-sm text-slate-500">
            No posts in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        <Breadcrumb />
        <PageHero />
        <BlogGrid />
        <SubscribeSection />
      </main>

      <EduviFooter />
    </div>
  );
}