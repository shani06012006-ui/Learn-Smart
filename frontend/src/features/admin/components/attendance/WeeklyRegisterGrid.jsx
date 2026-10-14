// frontend/src/features/admin/components/attendance/WeeklyRegisterGrid.jsx
import { Loader2, CalendarX, AlertTriangle } from "lucide-react";
import AttendanceStatusPill, {
  nextStatus,
} from "./AttendanceStatusPill";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function initialsOf(name, email) {
  const src = (name || email || "?").trim();
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function WeeklyRegisterGrid({
  loading,
  error,
  students,           // [{ student_id, name, email, days: [{date, record_id, status}, x5] }]
  onCellClick,        // (student_id, dayIdx, currentStatus, record_id) => void
  busyCell,           // "studentId-dayIdx" | null
  search,
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-purple-300" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <AlertTriangle className="text-rose-500" size={28} />
        <p className="text-sm font-semibold text-navy-950">
          Could not load the register
        </p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
          <CalendarX size={24} />
        </span>
        <p className="text-sm font-semibold text-navy-950">
          No students in this grade
        </p>
        <p className="max-w-md text-xs text-slate-500">
          Once students are enrolled in this grade, they will appear here so you
          can mark the weekly register.
        </p>
      </div>
    );
  }

  const visibleStudents = search
    ? students.filter((s) => {
        const q = search.trim().toLowerCase();
        return (
          (s.name || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q)
        );
      })
    : students;

  if (visibleStudents.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        No students match your search.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      {/* Header bar */}
      <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] bg-[#6B5B95] text-white">
        <div className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider">
          Student
        </div>
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="border-l border-white/15 px-2 py-3 text-center text-[11px] font-extrabold uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {visibleStudents.map((s, rowIdx) => {
          const zebra = rowIdx % 2 === 0;
          return (
            <div
              key={s.student_id}
              className={
                "grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] items-center transition-colors hover:bg-purple-50/40 " +
                (zebra ? "bg-rose-50/60" : "bg-white")
              }
            >
              {/* Student cell */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-extrabold text-purple-700">
                  {initialsOf(s.name, s.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-950">
                    {s.name || "—"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {s.email || ""}
                  </p>
                </div>
              </div>

              {/* Day cells */}
              {s.days.map((cell, dayIdx) => {
                const key = `${s.student_id}-${dayIdx}`;
                const isBusy = busyCell === key;
                return (
                  <div
                    key={dayIdx}
                    className="flex items-center justify-center border-l border-slate-200/70 px-2 py-2.5"
                  >
                    <AttendanceStatusPill
                      status={cell.status}
                      busy={isBusy}
                      onClick={() =>
                        onCellClick(
                          s.student_id,
                          dayIdx,
                          cell.status,
                          cell.record_id
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-[11px] font-semibold text-slate-500">
        <span className="font-extrabold uppercase tracking-wider">Legend:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
            P
          </span>
          Present
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-extrabold text-rose-700 ring-1 ring-rose-200">
            A
          </span>
          Absent
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-extrabold text-amber-700 ring-1 ring-amber-200">
            L
          </span>
          Late
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-700 ring-1 ring-slate-200">
            E
          </span>
          Excused
        </span>
        <span className="ml-auto italic">
          Click any cell to cycle status
        </span>
      </div>
    </div>
  );
}