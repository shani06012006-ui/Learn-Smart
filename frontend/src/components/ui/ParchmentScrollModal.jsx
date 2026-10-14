// frontend/src/components/ui/ParchmentScrollModal.jsx
import { X } from "lucide-react";

export default function ParchmentScrollModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-3xl",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 no-scrollbar"
      style={{ backgroundColor: "rgba(219, 234, 254, 0.72)" }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        className={
          "relative z-10 w-full " +
          maxWidth +
          " rounded-[28px] shadow-2xl no-scrollbar"
        }
        style={{
          background:
            "linear-gradient(180deg, #FBF3DB 0%, #F7ECCE 55%, #F2E2BA 100%)",
          border: "2px solid #E7D3A0",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Top rolled scroll edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 left-4 right-4 h-6 rounded-full"
          style={{
            background:
              "linear-gradient(180deg, #EAD7A6 0%, #D9BF80 50%, #C9A968 100%)",
            boxShadow:
              "inset 0 2px 0 rgba(255,255,255,0.5), 0 4px 8px rgba(120, 80, 30, 0.18)",
          }}
        />

        {/* Bottom rolled scroll edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-3 left-4 right-4 h-6 rounded-full"
          style={{
            background:
              "linear-gradient(180deg, #C9A968 0%, #D9BF80 50%, #EAD7A6 100%)",
            boxShadow:
              "inset 0 -2px 0 rgba(255,255,255,0.4), 0 -4px 8px rgba(120, 80, 30, 0.18)",
          }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-3 px-6 pt-4 pb-2">

          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-amber-900">

              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-amber-800/70">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-amber-900/70 transition hover:bg-amber-100 hover:text-amber-900"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Divider ribbon */}
        <div
          aria-hidden="true"
          className="mx-8 h-[2px] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #D9BF80 15%, #C9A968 50%, #D9BF80 85%, transparent)",
          }}
        />

        {/* Body */}
        <div className="px-6 py-3">{children}</div>


        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-amber-200/70 px-6 pb-4 pt-3">

            {footer}
          </div>
        )}

        <ScrollCornerDecorations />
      </div>
    </div>
  );
}

function ScrollCornerDecorations() {
  return (
    <>
      {/* Bottom-left: open book + pencils */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 90"
        className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-32 opacity-90"
      >
        <path d="M10 60 Q30 50 55 58 L55 82 Q30 74 10 84 Z" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.5" />
        <path d="M55 58 Q80 50 100 60 L100 84 Q80 74 55 82 Z" fill="#FDE68A" stroke="#B45309" strokeWidth="1.5" />
        <line x1="55" y1="58" x2="55" y2="82" stroke="#B45309" strokeWidth="1.2" />
        <g transform="rotate(-25 30 40)">
          <rect x="20" y="30" width="4" height="22" rx="1" fill="#F59E0B" />
          <polygon points="20,52 24,52 22,58" fill="#78350F" />
          <rect x="20" y="28" width="4" height="3" fill="#EF4444" />
        </g>
        <g transform="rotate(15 75 40)">
          <rect x="70" y="28" width="4" height="22" rx="1" fill="#8B5CF6" />
          <polygon points="70,50 74,50 72,56" fill="#78350F" />
          <rect x="70" y="26" width="4" height="3" fill="#F59E0B" />
        </g>
      </svg>

      {/* Bottom-right: stacked notebooks */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 90"
        className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-32 opacity-90"
      >
        <rect x="30" y="62" width="60" height="10" rx="2" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="1.2" />
        <rect x="30" y="52" width="60" height="10" rx="2" fill="#FCA5A5" stroke="#7F1D1D" strokeWidth="1.2" />
        <rect x="30" y="42" width="60" height="10" rx="2" fill="#86EFAC" stroke="#14532D" strokeWidth="1.2" />
        <line x1="34" y1="47" x2="80" y2="47" stroke="#14532D" strokeWidth="0.8" opacity="0.5" />
        <line x1="34" y1="57" x2="80" y2="57" stroke="#7F1D1D" strokeWidth="0.8" opacity="0.5" />
        <line x1="34" y1="67" x2="80" y2="67" stroke="#1E3A8A" strokeWidth="0.8" opacity="0.5" />
      </svg>
    </>
  );
}
