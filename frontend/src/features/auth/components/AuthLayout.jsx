// frontend/src/features/auth/components/AuthLayout.jsx
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, Sparkles } from "lucide-react";
import BrandMark from "../../landing/components/BrandMark";
import SafeImage from "../../landing/components/SafeImage";

/**
 * Split-panel auth shell, styled like the landing page.
 *   LEFT  — dark rounded frame: logo, headline, product preview, testimonial
 *   RIGHT — white panel: page title + the form (children)
 *
 * Props
 *   heading   big headline on the dark panel (desktop)
 *   subheading small paragraph under it
 *   title     the page's <h1> on the white side ("Welcome back")
 *   subtitle  one line under the title
 */

/* Decorative "what you get" cards — sample numbers, not live data. */
function ProductPreview() {
  return (
    <div aria-hidden="true" className="relative mt-10 h-[17rem] max-w-md">
      <div className="absolute left-0 top-0 flex -rotate-2 items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-ink-700">
          <FileText size={18} />
        </span>
        <div>
          <p className="text-xs font-bold text-ink-900">Fractions-ch4.pdf</p>
          <p className="flex items-center gap-1 text-[11px] text-ink-500">
            <CheckCircle2 size={11} className="text-sage-600" />
            Quiz generated · 10 questions
          </p>
        </div>
      </div>

      <div className="absolute right-0 top-[4.5rem] w-52 rotate-2 rounded-2xl bg-white/10 p-4 text-white ring-1 ring-white/15 backdrop-blur">
        <p className="text-[11px] text-white/60">Auto-graded</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          28 <span className="text-base font-medium text-white/60">/ 30 submitted</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[93%] rounded-full bg-sage-300" />
        </div>
      </div>

      <div className="absolute bottom-0 left-10 w-52 rounded-2xl bg-sage-400 p-4 text-ink-950 shadow-xl">
        <p className="text-[11px] font-semibold text-ink-700">Class 5B attendance</p>
        <p className="mt-0.5 font-display text-3xl font-semibold">94%</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-950/15">
          <div className="h-full w-[94%] rounded-full bg-ink-800" />
        </div>
      </div>

      <Sparkles size={26} strokeWidth={1.6} className="absolute bottom-6 right-6 text-white/70" />
    </div>
  );
}

export default function AuthLayout({ heading, subheading, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white font-sans text-ink-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)]">
        {/* ── LEFT: dark frame (desktop only) ───────────────────── */}
        <aside className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-screen">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-ink-800 px-10 py-9 xl:px-14 xl:py-11">
            {/* glow + chalkboard grid, same as the landing hero */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-sage-400/15 blur-[100px]" />
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                  backgroundSize: "56px 56px",
                  maskImage: "linear-gradient(to bottom, black, transparent 85%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
                }}
              />
            </div>

            <div className="relative">
              <BrandMark />
            </div>

            <div className="relative my-auto">
              <p className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
                {heading}
              </p>
              {subheading && (
                <p className="mt-4 max-w-sm text-base leading-relaxed text-white/65">{subheading}</p>
              )}
              <ProductPreview />
            </div>

            <figure className="relative flex items-center gap-4 border-t border-white/10 pt-6">
              <SafeImage
                src="https://i.pravatar.cc/150?img=5"
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/20"
              />
              <div>
                <blockquote className="text-sm leading-relaxed text-white/80">
                  “I generate a quiz from my lesson PDF in under a minute.”
                </blockquote>
                <figcaption className="mt-1 text-xs text-white/50">Anita Iyer · Teacher, Class 6</figcaption>
              </div>
            </figure>
          </div>
        </aside>

        {/* ── RIGHT: form ────────────────────────────────────────── */}
        <main className="relative flex min-h-screen flex-col px-6 py-6 sm:px-10">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <BrandMark tone="dark" />
            </div>
            <span className="hidden lg:block" />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to home
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-[25rem]">
              {title && (
                <div className="mb-8">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
                  {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
                </div>
              )}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}