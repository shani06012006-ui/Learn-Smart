// frontend/src/features/auth/components/AuthLayout.jsx
import { Link } from "react-router-dom";

/**
 * Split-panel auth shell.
 *   LEFT  — light grey panel with logo, heading, illustration, carousel dots
 *   RIGHT — white panel with vertical divider, form content (children)
 *
 * Matches the Learn Smart reference design.
 */
export default function AuthLayout({ heading, illustrationSrc, children }) {
  return (
    <div className="min-h-screen bg-white font-sans text-navy-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,45%)_minmax(0,55%)]">
        {/* ── LEFT panel ─────────────────────────────────────────── */}
        <aside className="relative hidden flex-col justify-between bg-[#f5f5f7] px-12 py-10 lg:flex xl:px-16 xl:py-12">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2">
            <img
              src="/learn-smart-logo.png"
              alt="Learn Smart"
              className="h-20 w-auto object-contain"
            />
            </Link>

          {/* Heading + illustration */}
          <div className="my-auto max-w-md">
            <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-navy-950 xl:text-4xl">
              {heading}
            </h1>

            <div className="relative mt-10">
              {/* HERE IS YOUR IMAGE — auth illustration — paste a URL over the src */}
              {illustrationSrc && (
                <img
                  src={illustrationSrc}
                  alt=""
                  className="relative mx-auto h-auto w-full max-w-sm object-contain"
                  onError={(e) => {
                    // If image fails to load, hide it so the SVG fallback shows
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              {/* SVG fallback — shown when no illustrationSrc is provided */}
              {!illustrationSrc && (
                <svg viewBox="0 0 400 300" className="mx-auto h-auto w-full max-w-sm" aria-hidden>
                  {/* Coral frame */}
                  <rect x="120" y="20" width="200" height="180" rx="16" fill="#ff5722" transform="rotate(4 220 110)" />
                  {/* White document */}
                  <rect x="135" y="35" width="170" height="155" rx="12" fill="#fff" transform="rotate(-2 220 110)" />
                  {/* Document lines */}
                  <rect x="155" y="60" width="100" height="6" rx="3" fill="#e2e8f0" />
                  <rect x="155" y="78" width="130" height="6" rx="3" fill="#e2e8f0" />
                  <rect x="155" y="96" width="80" height="6" rx="3" fill="#e2e8f0" />
                  {/* Checkboxes */}
                  <rect x="155" y="115" width="12" height="12" rx="3" stroke="#7c3aed" fill="none" strokeWidth="2" />
                  <rect x="155" y="135" width="12" height="12" rx="3" stroke="#7c3aed" fill="none" strokeWidth="2" />
                  <rect x="155" y="155" width="12" height="12" rx="3" stroke="#7c3aed" fill="none" strokeWidth="2" />
                  {/* Purple check */}
                  <path d="M 200 150 L 215 165 L 245 130" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  {/* Person body */}
                  <circle cx="200" cy="220" r="18" fill="#f4a261" />
                  <path d="M 165 280 Q 200 250 235 280 Z" fill="#ff5722" />
                  {/* Laptop */}
                  <rect x="185" y="255" width="55" height="35" rx="4" fill="#160f45" />
                  <rect x="190" y="260" width="45" height="25" rx="2" fill="#7c3aed" />
                  {/* Plant */}
                  <ellipse cx="80" cy="260" rx="14" ry="22" fill="#7c3aed" />
                  <ellipse cx="65" cy="240" rx="10" ry="16" fill="#7c3aed" />
                  <ellipse cx="95" cy="245" rx="10" ry="16" fill="#7c3aed" />
                  <rect x="65" y="272" width="30" height="20" rx="4" fill="#ff5722" />
                  {/* Coffee cup */}
                  <rect x="290" y="265" width="28" height="24" rx="4" fill="#ff5722" />
                  <path d="M 318 272 Q 328 272 328 280 Q 328 288 318 288" stroke="#ff5722" strokeWidth="3" fill="none" />
                </svg>
              )}
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-coral-500" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
          </div>
        </aside>

        {/* ── RIGHT panel ───────────────────────────────────────── */}
        <main className="relative flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          {/* Vertical divider (desktop) */}
          <div aria-hidden className="absolute left-0 top-0 hidden h-full w-px bg-slate-200 lg:block" />

          {/* Mini brand for mobile */}
          <Link to="/" className="absolute left-6 top-6 inline-flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-coral-500 to-coral-600">
              <span className="text-sm font-black leading-none text-white">M</span>
            </span>
            </Link>

          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}