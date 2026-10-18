// frontend/src/features/landing/sections/Panel2Bento.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calculator, FlaskConical, Globe, Monitor, Palette } from "lucide-react";

// Sample counts — replace with real numbers (or fetch from your API) when ready.
const SUBJECTS = [
  { icon: Calculator, title: "Mathematics", count: "48 quizzes ready" },
  { icon: FlaskConical, title: "Science", count: "36 quizzes ready" },
  { icon: BookOpen, title: "English", count: "41 quizzes ready" },
  { icon: Globe, title: "Social Studies", count: "29 quizzes ready" },
  { icon: Monitor, title: "Computer Science", count: "22 quizzes ready" },
  { icon: Palette, title: "Art & Creativity", count: "17 quizzes ready" },
];

export default function Panel2Bento() {
  // The dark "selected" card follows hover / keyboard focus, like the reference
  const [active, setActive] = useState(0);

  return (
    <section id="subjects" className="scroll-mt-4 bg-white py-20 lg:py-28">
      <div className="container-wide grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {/* Heading block */}
        <div className="pb-6 sm:col-span-2 lg:pb-10 lg:pr-10">
          <h2 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-4xl">
            Explore Your Learning Path And Discover Opportunities
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-500">
            Pick a subject to find quizzes, notes and live classes made by your
            own teachers, matched to your grade and your pace.
          </p>
        </div>

        {SUBJECTS.map((s, i) => {
          const Icon = s.icon;
          const on = active === i;
          return (
            <Link
              key={s.title}
              to="/student-login"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`group flex min-h-[170px] flex-col justify-between rounded-3xl border p-6 transition-colors duration-200 ${
                on
                  ? "border-ink-800 bg-ink-800 text-white"
                  : "border-ink-100 bg-white text-ink-900"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                  on ? "bg-sage-400 text-ink-950" : "bg-ink-50 text-ink-700"
                }`}
              >
                <Icon size={20} />
              </span>
              <div>
                <h3
                  className={`font-display text-lg font-semibold ${on ? "text-white" : "text-ink-900"}`}
                >
                  {s.title}
                </h3>
                <p
                  className={`mt-1 flex items-center justify-between text-xs ${
                    on ? "text-white/70" : "text-ink-500"
                  }`}
                >
                  {s.count}
                  <ArrowRight
                    size={14}
                    className={`transition-transform ${on ? "translate-x-0" : "-translate-x-1 opacity-60"}`}
                  />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}