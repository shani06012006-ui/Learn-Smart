// frontend/src/features/admin/components/AvailableTeachersPicker.jsx
import { Check, UserCheck } from "lucide-react";

export default function AvailableTeachersPicker({
  candidates,
  selectedId,
  onSelect,
  onAssign,
  assigning,
  loading,
}) {
  if (loading) {
    return (
      <p className="py-6 text-center text-xs font-semibold text-slate-400">
        Finding available teachers…
      </p>
    );
  }

  if (!candidates.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50/60 py-6 text-center">
        <p className="text-xs font-semibold text-slate-500">
          No teachers are free for this slot.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Everyone is either teaching or absent at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {candidates.map((c) => {
          const selected = selectedId === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition " +
                  (selected ? "bg-purple-50" : "hover:bg-slate-50")
                }
              >
                <span
                  className={
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition " +
                    (selected
                      ? "border-purple-600 bg-purple-600 text-white"
                      : "border-slate-300 bg-white")
                  }
                >
                  {selected && <Check size={11} strokeWidth={3} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-950">
                    {c.full_name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {c.email}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  Free
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!selectedId || assigning}
          onClick={onAssign}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserCheck size={14} />
          {assigning ? "Assigning…" : "Assign substitute"}
        </button>
      </div>
    </div>
  );
}