// frontend/src/features/landing/components/EduviFooter.jsx
import { Link } from "react-router-dom";

/* ── Column data ─────────────────────────────────────────────────── */
const COLUMNS = [
  {
    title: "Courses",
    links: [
      { label: "Classroom courses", href: "#courses" },
      { label: "Virtual classroom courses", href: "#courses" },
      { label: "E-learning courses", href: "#courses" },
      { label: "Video Courses", href: "#courses" },
      { label: "Offline Courses", href: "#courses" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Learners", href: "#community" },
      { label: "Partners", href: "#community" },
      { label: "Developers", href: "#community" },
      { label: "Transactions", href: "#community" },
      { label: "Blog", href: "#community" },
      { label: "Teaching Center", href: "#community" },
    ],
  },
  {
    title: "Quick links",
    links: [
      { label: "Home", href: "#hero" },
      { label: "Professional Education", href: "#features" },
      { label: "Courses", href: "#courses" },
      { label: "Admissions", href: "#admissions" },
      { label: "Testimonial", href: "#testimonials" },
      { label: "Programs", href: "#programs" },
    ],
  },
  {
    title: "More",
    links: [
      { label: "Press", href: "#press" },
      { label: "Investors", href: "#investors" },
      { label: "Terms", href: "#terms" },
      { label: "Privacy", href: "#privacy" },
      { label: "Help", href: "#help" },
      { label: "Contact", href: "#contact" },
    ],
  },
];

/* Social icons — inline SVG so no lucide-react brand icons needed */
const SOCIALS = [
  {
    id: "facebook",
    href: "#facebook",
    label: "Facebook",
    path: "M9.5 21v-8H7V10h2.5V8c0-2 1.3-3.5 3.6-3.5 1 0 1.9.1 2.1.1v2.4h-1.4c-1.1 0-1.3.5-1.3 1.3V10h2.7l-.4 3h-2.3v8h-2Z",
  },
  {
    id: "twitter",
    href: "#twitter",
    label: "Twitter",
    path: "M20 8.3c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.8-.6.4-1.3.7-2 .8-.6-.6-1.5-1-2.4-1-2 0-3.6 1.6-3.6 3.6 0 .3 0 .6.1.8-3-.1-5.6-1.6-7.4-3.7-.3.5-.5 1.1-.5 1.8 0 1.3.6 2.4 1.6 3-.6 0-1.1-.2-1.6-.5v.1c0 1.8 1.2 3.2 2.9 3.5-.3.1-.6.1-1 .1-.2 0-.5 0-.7-.1.5 1.5 1.8 2.5 3.4 2.6-1.2.9-2.8 1.5-4.4 1.5H4c1.6 1 3.5 1.6 5.5 1.6 6.6 0 10.2-5.5 10.2-10.2v-.5c.7-.5 1.3-1.1 1.8-1.9Z",
  },
  {
    id: "linkedin",
    href: "#linkedin",
    label: "LinkedIn",
    path: "M6.5 8.5v10H4v-10h2.5Zm.2-3.4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM20 12.4V18.5h-2.5v-5.5c0-1.4-.5-2.3-1.7-2.3-1 0-1.5.6-1.8 1.3 0 .2-.1.5-.1.8v5.7H11.4s0-9.3 0-10H14v1.4c.3-.6 1-1.5 2.6-1.5 1.9 0 3.4 1.2 3.4 4Z",
  },
];

function EduviLogo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Eduvi home">
      {/* Logo mark — replace with your own if desired */}
      {/* HERE IS YOUR IMAGE — footer logo mark — paste a URL over the gradient */}
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 shadow-coral-glow">
        <span className="text-sm font-black leading-none text-white">M</span>
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-navy-950">
        Eduvi
      </span>
    </Link>
  );
}

export default function EduviFooter() {
  return (
    <footer className="border-t border-slate-200 bg-paper-100">
      <div className="container-wide py-14 lg:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <EduviLogo />

            <p className="mt-5 max-w-xs text-xs leading-relaxed text-slate-500">
              Eduvi is a registered trademark of Eduvi.co
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-card ring-1 ring-slate-100 transition-all hover:text-coral-500 hover:shadow-elevated"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-400">
              © {new Date().getFullYear()} Eduvi.co
            </p>
          </div>

          {/* Columns 2–5 */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-extrabold text-navy-950">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs leading-relaxed text-slate-500 transition-colors hover:text-coral-500"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}