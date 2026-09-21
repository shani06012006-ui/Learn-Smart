import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, BookOpen, Video, Trophy } from "lucide-react";

import Button from "../../../components/ui/Button";
import { useScrollReveal } from "../../../hooks/useScrollReveal";

// ============================================================================
// HERO IMAGE
// ============================================================================
// Set the path to your image below.
//
// Put the file in:   C:\dev\Learn-Smart\frontend\public\images\student.jpg
// Then reference it:  "/images/student.jpg"
//
// Rules for the URL:
//   - Any file inside `frontend/public/` is served at the site root.
//     So `frontend/public/images/student.jpg` →  "/images/student.jpg"
//   - Filenames are case-sensitive on some servers. Match them exactly.
//   - Recommended: PNG with transparent background, ~800×1000px, character
//     centered, feet not clipped. JPG works too but will show a white or
//     opaque rectangle behind the character.
const HERO_IMAGE_SRC = "/images/student.jpg";
const HERO_IMAGE_ALT = "Student learning";

// If your image has a transparent background (PNG), keep this `false` so
// no rounded corners or shadow are drawn behind the character. If it's a
// JPG or a framed illustration, set it to `true` for the rounded card look.
const HERO_IMAGE_FRAMED = true;

export default function HeroSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      id="hero"
      ref={ref}
      className="relative overflow-hidden pt-16 md:pt-24"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="landing-grid absolute inset-0 opacity-[0.35]" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT SIDE — copy */}
          <div className={`landing-reveal ${revealed ? "is-visible" : ""}`}>
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-700 shadow-sm backdrop-blur">
              <span className="flex h-1.5 w-1.5 rounded-full bg-success-500" />
              AI-Powered · Personalized · Interactive · Connected
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Learn Smarter.
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                Learn Your Way.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
              Classes, materials, quizzes, live sessions, and progress — all
              in one AI-powered platform.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button size="lg">
                  Start Learning
                  <ArrowRight size={16} />
                </Button>
              </Link>

              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Explore for Teachers
                </Button>
              </Link>
            </div>

            {/* Feature row */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand-500" />
                AI-assisted insights
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={14} className="text-brand-500" />
                Centralized materials
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy size={14} className="text-brand-500" />
                Progress tracking
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Video size={14} className="text-brand-500" />
                Live classes
              </span>
            </div>
          </div>

          {/* RIGHT SIDE — hero image */}
          <div
            className={`landing-reveal landing-reveal-delay-1 ${
              revealed ? "is-visible" : ""
            }`}
          >
            <div className="relative flex justify-center">
              {/* Decorative glow behind the image */}
              <div
                aria-hidden="true"
                className="absolute inset-10 rounded-full bg-brand-200/40 blur-3xl"
              />

              {/* Student image.
                  - If transparent PNG: HERO_IMAGE_FRAMED = false → no rounded
                    corners or shadow drawn; the character floats.
                  - If JPG or framed illustration: HERO_IMAGE_FRAMED = true →
                    rounded corners + soft shadow. */}
              <img
                src={HERO_IMAGE_SRC}
                alt={HERO_IMAGE_ALT}
                loading="lazy"
                decoding="async"
                className={
                  "relative z-10 h-auto w-full max-w-md object-contain " +
                  (HERO_IMAGE_FRAMED ? "rounded-3xl shadow-xl" : "")
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
