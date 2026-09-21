import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Product", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Learn-Smart", href: "#why" },
];

const STUDENT_LINKS = [
  { label: "My Classes", href: "/student/classes" },
  { label: "Materials", href: "/student/materials" },
  { label: "Quizzes", href: "/student/quizzes" },
  { label: "Live Classes", href: "/student/live-classes" },
];

const TEACHER_LINKS = [
  { label: "Classes", href: "/teacher/classes" },
  { label: "Materials", href: "/teacher/materials" },
  { label: "Announcements", href: "/teacher/announcements" },
  { label: "Live Classes", href: "/teacher/live-classes" },
];

const RESOURCE_LINKS = [
  { label: "Login", href: "/login" },
  { label: "Get Started", href: "/register" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="focus-ring inline-flex items-center gap-2 rounded-md text-ink-900"
            >
              <GraduationCap size={20} className="text-brand-600" />
              <span className="font-semibold">Learn Smart</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
              An AI-assisted learning platform that connects classes,
              materials, quizzes, live sessions, and progress in one place.
            </p>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="For Students" links={STUDENT_LINKS} />
          <FooterColumn title="For Teachers" links={TEACHER_LINKS} />
        </div>

        {/* Lower row */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink-200 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} Learn Smart. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs">
            {RESOURCE_LINKS.map((r) => (
              <Link
                key={r.label}
                to={r.href}
                className="focus-ring text-ink-500 hover:text-ink-900"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-700">
        {title}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith("#") ? (
              <a
                href={l.href}
                className="focus-ring text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                {l.label}
              </a>
            ) : (
              <Link
                to={l.href}
                className="focus-ring text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
