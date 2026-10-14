// frontend/src/features/admin/components/attendance/WeekStepper.jsx
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

/** Convert any Date to "YYYY-MM-DD" (local, not UTC). */
function toIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing `d` (week starts Monday). */
export function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function weekRange(mondayDate) {
  const start = new Date(mondayDate);
  const end = new Date(mondayDate);
  end.setDate(end.getDate() + 4); // Mon–Fri
  return { start, end };
}

const fmtRange = (start, end) => {
  const opts = { month: "short", day: "numeric" };
  const y = start.getFullYear();
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(
    undefined,
    opts
  )}, ${y}`;
};

export default function WeekStepper({ monday, onChange }) {
  const { start, end } = weekRange(monday);
  const iso = toIso(monday);

  const shift = (deltaDays) => {
    const next = new Date(monday);
    next.setDate(next.getDate() + deltaDays);
    onChange(mondayOf(next));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => shift(-7)}
          className="flex h-10 w-10 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-purple-600"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2 border-x border-slate-200 px-4">
          <Calendar size={14} className="text-purple-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Week of
          </span>
          <span className="text-sm font-extrabold tabular-nums text-navy-950">
            {fmtRange(start, end)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => shift(7)}
          className="flex h-10 w-10 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-purple-600"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Jump to
        </label>
        <input
          type="date"
          value={iso}
          onChange={(e) => {
            if (!e.target.value) return;
            const [y, m, d] = e.target.value.split("-").map(Number);
            onChange(mondayOf(new Date(y, m - 1, d)));
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange(mondayOf(new Date()))}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
      >
        This week
      </button>
    </div>
  );
}