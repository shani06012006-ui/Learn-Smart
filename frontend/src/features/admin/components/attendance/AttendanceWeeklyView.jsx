// frontend/src/features/admin/components/attendance/AttendanceWeeklyView.jsx
import { useMemo, useState } from "react";
import { Download, UserCheck, UserX, Clock, AlertCircle, BookOpen } from "lucide-react";
import {
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";
import { nextStatus } from "./AttendanceStatusPill";
import WeekStepper, { weekRange } from "./WeekStepper";
import WeeklyRegisterGrid from "./WeeklyRegisterGrid";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const toIso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function StatTile({ label, value, tone, icon: Icon }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <span
          className={
            "flex h-8 w-8 items-center justify-center rounded-lg " +
            (toneMap[tone] || toneMap.slate)
          }
        >
          {Icon && <Icon size={14} />}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-navy-950">
        {value}
      </p>
    </div>
  );
}

export default function AttendanceWeeklyView({ gradeId, monday, setMonday }) {
  const [search, setSearch] = useState("");
  const [busyCell, setBusyCell] = useState(null);
  const [toast, setToast] = useState("");

  const { start, end } = weekRange(monday);
  const dayDates = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [start]
  );

  // Fire 5 parallel daily queries — RTK dedupes so this is cheap.
  const q0 = useGetAttendanceQuery(
    { grade: gradeId, date: toIso(dayDates[0]) },
    { skip: !gradeId }
  );
  const q1 = useGetAttendanceQuery(
    { grade: gradeId, date: toIso(dayDates[1]) },
    { skip: !gradeId }
  );
  const q2 = useGetAttendanceQuery(
    { grade: gradeId, date: toIso(dayDates[2]) },
    { skip: !gradeId }
  );
  const q3 = useGetAttendanceQuery(
    { grade: gradeId, date: toIso(dayDates[3]) },
    { skip: !gradeId }
  );
  const q4 = useGetAttendanceQuery(
    { grade: gradeId, date: toIso(dayDates[4]) },
    { skip: !gradeId }
  );
  const queries = [q0, q1, q2, q3, q4];

  const [markAttendance] = useMarkAttendanceMutation();

  const loading = gradeId && queries.some((q) => q.isLoading);
  const errObj = queries.find((q) => q.isError)?.error;
  const error = errObj ? extractErrorMessage(errObj) : "";

  // Pivot: { student_id -> { name, email, days: [ {date, status, record_id} x5 ] } }
  const students = useMemo(() => {
    if (!gradeId) return [];

    const map = new Map();

    queries.forEach((q, dayIdx) => {
      const rows = q.data?.rows || [];
      const dateIso = toIso(dayDates[dayIdx]);
      rows.forEach((r) => {
        const sid = String(r.student || r.student_id || r.student_name);
        if (!map.has(sid)) {
          map.set(sid, {
            student_id: sid,
            name: r.student_name || r.student || "—",
            email: r.student_email || r.email || "",
            days: dayDates.map((d) => ({
              date: toIso(d),
              record_id: null,
              status: null,
            })),
          });
        }
        const entry = map.get(sid);
        entry.days[dayIdx] = {
          date: dateIso,
          record_id: r.record_id || null,
          status: r.status || null,
        };
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [gradeId, queries, dayDates]);

  // Weekly counts
  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0, recorded: 0 };
    students.forEach((s) =>
      s.days.forEach((d) => {
        if (d.status && c[d.status] !== undefined) {
          c[d.status]++;
          c.recorded++;
        }
      })
    );
    return c;
  }, [students]);

  async function handleCellClick(studentId, dayIdx, currentStatus) {
    const next = nextStatus(currentStatus);
    const cellKey = `${studentId}-${dayIdx}`;
    setBusyCell(cellKey);
    setToast("");

    try {
      await markAttendance({
        grade: gradeId,
        date: toIso(dayDates[dayIdx]),
        records: [{ student: studentId, status: next }],
      }).unwrap();

      queries[dayIdx].refetch();
      setToast(`${DAY_LABELS[dayIdx]} · marked ${next}`);
    } catch (e) {
      setToast(extractErrorMessage(e));
    } finally {
      setBusyCell(null);
      setTimeout(() => setToast(""), 2500);
    }
  }

  function exportCsv() {
    const header = [
      "Student",
      "Email",
      ...dayDates.map((d) => DAY_LABELS[dayDates.indexOf(d)] + " " + toIso(d)),
    ].join(",");
    const body = students
      .map((s) =>
        [
          `"${(s.name || "").replace(/"/g, '""')}"`,
          `"${(s.email || "").replace(/"/g, '""')}"`,
          ...s.days.map((d) => `"${d.status || ""}"`),
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-week-${toIso(start)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <WeekStepper monday={monday} onChange={setMonday} />

        <div className="relative min-w-[14rem] flex-1 max-w-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
          />
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={students.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#6D28D9] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#5B21B6] disabled:opacity-40"
        >
          <Download size={13} />
          Export Sheet
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Recorded"  value={counts.recorded} tone="violet"  icon={BookOpen} />
        <StatTile label="Present"   value={counts.present}  tone="emerald" icon={UserCheck} />
        <StatTile label="Absent"    value={counts.absent}   tone="rose"    icon={UserX} />
        <StatTile label="Late"      value={counts.late}     tone="amber"   icon={Clock} />
        <StatTile label="Excused"   value={counts.excused}  tone="slate"   icon={AlertCircle} />
      </div>

      {toast && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700">
          {toast}
        </div>
      )}

      {/* The ledger */}
      <div className="rounded-2xl border border-purple-100 bg-white shadow-xl">
        <WeeklyRegisterGrid
          loading={loading}
          error={error}
          students={students}
          onCellClick={handleCellClick}
          busyCell={busyCell}
          search={search}
        />
      </div>
    </div>
  );
}