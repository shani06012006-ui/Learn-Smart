// frontend/src/features/landing/components/EduviFooter.jsx
import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

/* Every link here points at a real in-page section or an existing route. */
const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Subjects", href: "#subjects" },
      { label: "For teachers", href: "#teachers" },
      { label: "Learning experts", href: "#experts" },
      { label: "Classes", href: "#classes" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create an account", to: "/register" },
      { label: "Student login", to: "/student-login" },
      { label: "Teacher login", to: "/login" },
    ],
  },
];

/* Social icons — inline SVG so no lucide brand icons are needed.
   Replace the "#" hrefs with your real profile URLs. */
const SOCIALS = [
  {
    id: "facebook",
    href: "#",
    label: "Facebook",
    path: "M9.5 21v-8H7V10h2.5V8c0-2 1.3-3.5 3.6-3.5 1 0 1.9.1 2.1.1v2.4h-1.4c-1.1 0-1.3.5-1.3 1.3V10h2.7l-.4 3h-2.3v8h-2Z",
  },
  {
    id: "twitter",
    href: "#",
    label: "Twitter",
    path: "M20 8.3c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.8-.6.4-1.3.7-2 .8-.6-.6-1.5-1-2.4-1-2 0-3.6 1.6-3.6 3.6 0 .3 0 .6.1.8-3-.1-5.6-1.6-7.4-3.7-.3.5-.5 1.1-.5 1.8 0 1.3.6 2.4 1.6 3-.6 0-1.1-.2-1.6-.5v.1c0 1.8 1.2 3.2 2.9 3.5-.3.1-.6.1-1 .1-.2 0-.5 0-.7-.1.5 1.5 1.8 2.5 3.4 2.6-1.2.9-2.8 1.5-4.4 1.5H4c1.6 1 3.5 1.6 5.5 1.6 6.6 0 10.2-5.5 10.2-10.2v-.5c.7-.5 1.3-1.1 1.8-1.9Z",
  },
  {
    id: "linkedin",
    href: "#",
    label: "LinkedIn",
    path: "M6.5 8.5v10H4v-10h2.5Zm.2-3.4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM20 12.4V18.5h-2.5v-5.5c0-1.4-.5-2.3-1.7-2.3-1 0-1.5.6-1.8 1.3 0 .2-.1.5-.1.8v5.7H11.4s0-9.3 0-10H14v1.4c.3-.6 1-1.5 2.6-1.5 1.9 0 3.4 1.2 3.4 4Z",
  },
];

const YEAR = new Date().getFullYear();
const linkClass = "text-sm text-white/65 transition-colors hover:text-white";

export default function EduviFooter() {
  return (
    <footer className="p-3 pt-0 sm:p-4 sm:pt-0">
      <div className="rounded-[2rem] bg-ink-800 sm:rounded-[2.5rem]">
        <div className="container-wide py-14 lg:py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <BrandMark />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
                AI-powered quizzes, grading and live classes — made for
                teachers and students.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.id}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-sage-400 hover:text-ink-950"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-display text-sm font-semibold text-white">{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link to={l.to} className={linkClass}>
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className={linkClass}>
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:justify-between">
            <p>© {YEAR} Learn Smart.co. All rights reserved.</p>
            <p>Learn Smart is a registered trademark of Learn Smart.co</p>
          </div>
        </div>
      </div>
    </footer>
  );
}