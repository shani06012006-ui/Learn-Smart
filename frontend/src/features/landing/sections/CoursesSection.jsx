// frontend/src/features/landing/sections/CoursesSection.jsx
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Calculator, FlaskConical, Globe, Languages, Monitor } from "lucide-react";

// Sample classes for the landing page. Replace with real data / an API call later.
const CLASSES = [
  { icon: Calculator, title: "Fractions & Decimals", grade: "Class 5", subject: "Mathematics", lessons: 12, quizzes: 4 },
  { icon: FlaskConical, title: "Plants & Photosynthesis", grade: "Class 6", subject: "Science", lessons: 10, quizzes: 3 },
  { icon: BookOpen, title: "Grammar Essentials", grade: "Class 4", subject: "English", lessons: 14, quizzes: 5 },
  { icon: Globe, title: "Our Country: Maps & Regions", grade: "Class 5", subject: "Social Studies", lessons: 8, quizzes: 3 },
  { icon: Monitor, title: "Typing & Computer Basics", grade: "Class 3", subject: "Computer Science", lessons: 9, quizzes: 2 },
  { icon: Languages, title: "Hindi Vyakaran", grade: "Class 6", subject: "Languages", lessons: 11, quizzes: 4 },
];

export default function CoursesSection() {
  return (
    <section id="classes" className="scroll-mt-4 bg-white py-20 lg:py-28">
      <div className="container-wide">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-4xl">
              Highlighted Classes
              <br />
              For You
            </h2>
            <p className="mt-3 max-w-md text-base text-ink-500">
              A taste of what your teachers can build. Log in to see your own classes.
            </p>
          </div>
          <Link
            to="/student-login"
            className="inline-flex shrink-0 items-center rounded-full bg-ink-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-700"
          >
            Browse all classes
          </Link>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CLASSES.map(({ icon: Icon, title, grade, subject, lessons, quizzes }) => (
            <li key={title}>
              <Link
                to="/student-login"
                className="group flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-6 transition-colors hover:border-ink-300"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-800 text-sage-300">
                    <Icon size={22} />
                  </span>
                  <span className="rounded-full border border-ink-100 px-3 py-1 text-xs font-semibold text-ink-500">
                    {grade}
                  </span>
                </div>

                <h3 className="mt-6 font-display text-lg font-semibold leading-snug text-ink-900">
                  {title}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-sage-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
                    {subject}
                  </span>
                  <span className="rounded-md bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-500">
                    {lessons} lessons
                  </span>
                  <span className="rounded-md bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-500">
                    {quizzes} quizzes
                  </span>
                </div>

                <span className="mt-auto flex items-center gap-1 pt-6 text-sm font-bold text-ink-800">
                  View class
                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}