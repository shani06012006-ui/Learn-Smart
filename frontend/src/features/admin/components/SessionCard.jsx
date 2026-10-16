// frontend/src/features/admin/components/SessionCard.jsx
import { Clock, MapPin } from "lucide-react";

export default function SessionCard({ entry, selected, onClick }) {
  const subject =
    entry.class_course?.subject ||
    entry.class_course?.name ||
    "Session";
  const className =
    entry.section_name ||
    entry.class_course?.name ||
    entry.class_course?.grade_name ||
    "—";

  const start = (entry.start_time || "").slice(0, 5);
  const end = (entry.end_time || "").slice(0, 5);

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all " +
        (selected
          ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
          : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/40")
      }
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-extrabold leading-snug text-navy-950">
          {subject}
        </span>
        {entry.period_number != null && (
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-gray-200">
            P{entry.period_number}
          </span>
        )}
      </div>

      <span className="truncate text-xs font-semibold text-slate-500">
        {className}
      </span>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock size={11} className="text-slate-400" />
          {start}–{end}
        </span>
        {entry.room && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} className="text-slate-400" />
            {entry.room}
          </span>
        )}
      </div>
    </button>
  );
}