// frontend/src/features/course-details/CourseDetailsPage.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";

import EduviNavbar from "../landing/components/EduviNavbar";
import EduviFooter from "../landing/components/EduviFooter";
import SubscribeSection from "../landing/sections/SubscribeSection";
import CourseRowCard from "../courses/components/CourseRowCard";
import PlaylistItem from "./components/PlaylistItem";

const EASE = [0.22, 1, 0.36, 1];

/* ── Content ─────────────────────────────────────────────────────── */

const PLAYLIST = [
  { title: "Maths - Introduction",                    duration: "1:57" },
  { title: "Maths - for Standard 3 Students",         duration: "5:43" },
  { title: "Maths - for Standard 3 Students | Ep 2",  duration: "8:11" },
  { title: "Maths - for Standard 3 Students | Ep 3",  duration: "6:10" },
  { title: "Maths - for Standard 3 Students | Ep 4",  duration: "10:03" },
  { title: "Maths - for Standard 3 Students | Ep 5",  duration: "7:53" },
];

const COURSE_INFO = [
  { label: "Price",       value: "$49.00",       coral: true },
  { label: "Instructor",  value: "Wade Warren" },
  { label: "Ratings",     value: "5stars",       stars: true },
  { label: "Durations",   value: "10 Days" },
  { label: "Lessons",     value: "30" },
  { label: "Quizzes",     value: "5" },
  { label: "Certificate", value: "Yes" },
  { label: "Language",    value: "English" },
  { label: "Access",      value: "Lifetime" },
];

const COURSE_TEXT = {
  details:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis consectetur adipiscing elit.",
  certification:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis consectetur adipiscing elit.",
  who:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis consectetur adipiscing elit.",
};

const LEARN_BULLETS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
];

const SIMILAR_COURSES = Array(4).fill({ title: "The Three Musketeers", price: 40.0 });

/* ── Component ───────────────────────────────────────────────────── */
export default function CourseDetailsPage() {
  return (
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-paper-50">
          <div className="container-wide flex h-12 items-center gap-2 text-xs">
            <Link to="/" className="font-semibold text-slate-400 transition-colors hover:text-navy-950">
              Home
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/courses" className="font-semibold text-slate-400 transition-colors hover:text-navy-950">
              Courses
            </Link>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-purple-500">Course Details</span>
          </div>
        </nav>

        {/* Top section: video + playlist */}
        <section className="py-8">
          <div className="container-wide grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
            {/* LEFT — Video */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              {/* Video frame */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900">
                {/* HERE IS YOUR IMAGE — course video thumbnail — paste a URL over the src */}
                <img
                  src=""
                  alt="Course video thumbnail"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                {/* Fallback when no image */}
                <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                  <svg viewBox="0 0 120 80" className="h-20 w-32 text-white/20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="10" y="10" width="100" height="60" rx="4" />
                    <path d="M10 30h100M30 10v60" />
                  </svg>
                </div>

                {/* Play button */}
                <button
                  type="button"
                  aria-label="Play video"
                  className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-purple-500 text-white shadow-purple-glow transition-all hover:scale-110 hover:bg-purple-600"
                >
                  <Play size={26} fill="currentColor" />
                </button>
              </div>

              {/* Title below video */}
              <h1 className="mt-5 font-display text-xl font-extrabold text-navy-950 sm:text-2xl md:text-3xl">
                Maths - for Standard 3 Students | Episode 2
              </h1>
            </motion.div>

            {/* RIGHT — Playlist */}
            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card"
            >
              <h2 className="mb-3 font-display text-base font-extrabold text-navy-950">
                Course Playlists
              </h2>
              <div className="space-y-1">
                {PLAYLIST.map((lesson, i) => (
                  <PlaylistItem key={i} lesson={lesson} index={i} active={i === 1} />
                ))}
              </div>
            </motion.aside>
          </div>
        </section>

        {/* Course Details + Info card */}
        <section className="pb-12">
          <div className="container-wide grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
            {/* LEFT — Long text sections */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="min-w-0"
            >
              <h2 className="font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
                Course Details
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {COURSE_TEXT.details}
              </p>

              <h2 className="mt-8 font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
                Certification
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {COURSE_TEXT.certification}
              </p>

              <h2 className="mt-8 font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
                Who this course is for
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {COURSE_TEXT.who}
              </p>

              <h2 className="mt-8 font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
                What you'll learn in this course:
              </h2>
              <ul className="mt-4 space-y-2.5">
                {LEARN_BULLETS.map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral-500" />
                    {line}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* RIGHT — Sticky info card */}
            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="lg:sticky lg:top-24 lg:self-start"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                <ul className="divide-y divide-slate-100">
                  {COURSE_INFO.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between gap-4 px-5 py-3.5"
                    >
                      <span className="text-sm text-slate-500">{row.label}</span>
                      <span
                        className={`text-sm font-bold ${
                          row.coral ? "text-coral-500" : "text-navy-950"
                        }`}
                      >
                        {row.stars ? (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            {[0, 1, 2, 3, 4].map((s) => (
                              <Star key={s} size={13} fill="currentColor" />
                            ))}
                          </span>
                        ) : (
                          row.value
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-100 p-4">
                  <Link
                    to="/pricing"
                    className="inline-flex w-full items-center justify-center rounded-full bg-purple-500 px-6 py-3 text-sm font-bold text-white shadow-purple-glow transition-all hover:bg-purple-600 hover:-translate-y-0.5"
                  >
                    Purchase Course
                  </Link>
                </div>
              </div>
            </motion.aside>
          </div>
        </section>

        {/* Similar Courses */}
        <section className="pb-16">
          <div className="container-wide">
            <h2 className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl">
              Similar Courses
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {SIMILAR_COURSES.map((c, i) => (
                <CourseRowCard key={i} course={c} index={i} active={i === 0} />
              ))}
            </div>
          </div>
        </section>

        <SubscribeSection />
      </main>

      <EduviFooter />
    </div>
  );
}
