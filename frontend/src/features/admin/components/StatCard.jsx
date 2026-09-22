export default function StatCard({ icon: Icon, label, value, tone = "brand", sub }) {
  const TONE = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-700",
    danger: "bg-danger-50 text-danger-700",
    neutral: "bg-ink-100 text-ink-700",
  };

  return (
    <div className="rounded-card border border-ink-300 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
        </div>
        {Icon && (
          <span
            className={
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
              TONE[tone]
            }
          >
            <Icon size={18} />
          </span>
        )}
      </div>
    </div>
  );
}