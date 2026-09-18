import { useEffect } from "react";
import { X } from "lucide-react";

// Right-side drawer on md+ screens, full-screen panel on mobile.
//
// - Escape closes
// - Backdrop click closes (desktop only -- mobile full-screen has no backdrop)
// - Body scroll locked while open
// - Focus is placed on the close button on open
//
// Kept independent of Modal so future drawers can use it (e.g. notification
// panel, settings) without dragging Modal semantics along.

export default function Drawer({ open, onClose, title, children, width = "max-w-md" }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop -- visible only on desktop; on mobile the panel is
          full-screen so a backdrop would be invisible anyway. */}
      <div
        className="absolute inset-0 hidden bg-ink-900/40 md:block"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          "relative ml-auto flex h-full w-full flex-col bg-white shadow-xl " +
          "md:w-auto " + width
        }
      >
        <header className="flex items-center justify-between border-b border-ink-300 px-4 py-3">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="focus-ring rounded-md p-1 text-ink-500 hover:bg-ink-100"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
