// frontend/src/components/ui/SplitModal.jsx
import { X } from "lucide-react";

export default function SplitModal({
  open,
  onClose,
  title,
  subtitle,
  leftPanel,
  children,
  footer,
  maxWidth = "max-w-4xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        className={
          "relative z-10 flex w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 " +
          maxWidth
        }
        style={{ maxHeight: "90vh" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Left decorative panel */}
        <aside className="relative hidden w-72 shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 text-white md:flex">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-12 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl"
          />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2 L2 7 L12 12 L22 7 Z" />
                <path d="M2 17 L12 22 L22 17" />
                <path d="M2 12 L12 17 L22 12" />
              </svg>
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-white/60">
              Learn Smart
            </p>
            <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight">
              {leftPanel?.heading || "Empower your classroom."}
            </h3>
            <p className="mt-3 text-sm text-white/70">
              {leftPanel?.subheading ||
                "Add teachers, assign grades, and start managing your learning platform."}
            </p>
          </div>

          <ul className="relative space-y-3 text-sm">
            {(leftPanel?.bullets || [
              "Verify details before inviting",
              "Assign one or more grades",
              "Set a secure password",
            ]).map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-white/80">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right panel (form) */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-navy-950">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:px-8">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
