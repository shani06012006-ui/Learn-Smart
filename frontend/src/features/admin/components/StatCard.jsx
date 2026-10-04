// frontend/src/features/admin/components/StatCard.jsx
export default function StatCard({ icon: Icon, label, value, tone = "purple", sub }) {
  const TONE = {
    purple:  "bg-purple-50 text-purple-600 ring-purple-100",
    coral:   "bg-coral-50 text-coral-600 ring-coral-100",
    mint:    "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber:   "bg-amber-50 text-amber-600 ring-amber-100",
    navy:    "bg-navy-50 text-navy-800 ring-navy-100",
  };

  const ACCENT = {
    purple: "bg-purple-500",
    coral:  "bg-coral-500",
    mint:   "bg-emerald-500",
    amber:  "bg-amber-500",
    navy:   "bg-navy-800",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
      {/* Top accent bar */}
      <span className={`absolute inset-x-0 top-0 h-1 ${ACCENT[tone]} opacity-70 transition-opacity group-hover:opacity-100`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-950 tabular-nums">
            {value ?? 0}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-500">{sub}</p>
          )}
        </div>

        {Icon && (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${TONE[tone]}`}
          >
            <Icon size={19} strokeWidth={2.2} />
          </span>
        )}
      </div>
    </div>
  );
}