import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, BookOpen, Video, Trophy } from "lucide-react";

import Button from "../../../components/ui/Button";
import { useScrollReveal } from "../../../hooks/useScrollReveal";

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

          {/* LEFT SIDE */}
          <div
            className={`landing-reveal ${
              revealed ? "is-visible" : ""
            }`}
          >
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

            {/* Features */}
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

          {/* RIGHT SIDE - STUDENT IMAGE */}
          <div
            className={`landing-reveal landing-reveal-delay-1 ${
              revealed ? "is-visible" : ""
            }`}
          >
            <div className="relative flex justify-center">

              {/* Decorative glow */}
              <div
                aria-hidden="true"
                className="absolute inset-10 rounded-full bg-brand-200/40 blur-3xl"
              />

              <img
              src="/images/student.jpg"
              alt="Student learning"
              className="relative z-10 h-auto w-full max-w-md rounded-3xl object-contain shadow-xl" />

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
