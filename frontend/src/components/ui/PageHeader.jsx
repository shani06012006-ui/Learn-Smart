// Canonical page header. The pattern this replaces:
//   <h1 className="text-xl font-semibold text-ink-900">...</h1>
//   <p className="mt-1 text-sm text-ink-500">...</p>
//
// That exact combination appears (with small drifts) across ~10 pages.
// This primitive locks the typography and spacing. Pages that need a
// right-side action pass it as `actions`.
export default function PageHeader({ title, subtitle, actions, className = "" }) {
  return (
    <div
      className={
        "mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start " +
        className
      }
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
