// frontend/src/features/admin/pages/AttendancePage.jsx
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Calendar as CalendarIcon, Download,
  UserCheck, UserX, Clock, AlertCircle, BookOpen,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import AttendanceWeeklyView from "../components/attendance/AttendanceWeeklyView";
import { mondayOf } from "../components/attendance/WeekStepper";
import {
  useGetGradesQuery,
  useGetAttendanceQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const STATUS_META = {
  present: { label: "Present", chip: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  absent:  { label: "Absent",  chip: "bg-rose-100 text-rose-700 border-rose-200" },
  late:    { label: "Late",    chip: "bg-amber-100 text-amber-700 border-amber-200" },
  excused: { label: "Excused", chip: "bg-slate-100 text-slate-700 border-slate-200" },
};

function StatTile({ label, value, tone, icon: Icon }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-700",
    slate:   "bg-slate-50 text-slate-700",
    violet:  "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <span className={"flex h-8 w-8 items-center justify-center rounded-lg " + (toneMap[tone] || toneMap.slate)}>
          {Icon && <Icon size={14} />}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-navy-950">
        {value}
      </p>
    </div>
  );
}

function DownloadCsv({ klassName, date, rows }) {
  const handle = () => {
    const header = "Student,Status,Marked By,Marked At,Note\n";
    const body = rows
      .map((r) => {
        const esc = (s) => `"${(String(s || "")).replace(/"/g, '""')}"`;
        return [
          esc(r.student_name),
          esc(r.status || ""),
          esc(r.marked_by || ""),
          esc(formatTime(r.marked_at)),
          esc(r.note || ""),
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${klassName || "class"}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
    >
      <Download size={13} />
      Export CSV
    </button>
  );
}

const TABS = [
  { id: "weekly", label: "Weekly" },
  { id: "daily",  label: "Daily"  },
];

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const tab = urlTab === "daily" ? "daily" : "weekly"; // Weekly is default

  const [gradeId, setGradeId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const [search, setSearch] = useState("");

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === "weekly") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results || gradesData || [];

  const dailyQuery = useGetAttendanceQuery(
    { grade: gradeId, date },
    { skip: !gradeId || !date || tab !== "daily" },
  );

  const { isLoading, isError, error, refetch } = dailyQuery;
  const dailyRows = dailyQuery.data?.rows || [];

  const filteredDaily = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dailyRows;
    return dailyRows.filter((r) =>
      (r.student_name || "").toLowerCase().includes(q) ||
      (r.marked_by || "").toLowerCase().includes(q)
    );
  }, [dailyRows, search]);

  const dailyCounts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    dailyRows.forEach((r) => {
      if (r.status && c[r.status] !== undefined) c[r.status]++;
    });
    return c;
  }, [dailyRows]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Weekly class register. Click any cell to mark or override a student's
            attendance.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 self-start rounded-full bg-slate-50 p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              "rounded-full px-4 py-2 text-xs font-bold transition " +
              (tab === id
                ? "bg-purple-500 text-white shadow-purple-glow"
                : "text-slate-500 hover:text-navy-950")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grade picker (shared by both tabs) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Grade
            </label>
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="h-10 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition focus:border-purple-400"
            >
              <option value="">— Select grade —</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Daily-only filters */}
          {tab === "daily" && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
                />
              </div>
              <div className="relative min-w-[14rem] flex-1">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student or teacher"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-purple-400"
                />
              </div>
              <div className="ml-auto">
                <DownloadCsv
                  klassName={dailyQuery.data?.grade_name}
                  date={date}
                  rows={filteredDaily}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Empty state (no grade picked) */}
      {!gradeId && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <BookOpen size={24} />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-navy-950">
            Pick a grade to view attendance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {tab === "weekly"
              ? "See the weekly register for any date — click cells to mark."
              : "See the records teachers have marked on any given date."}
          </p>
        </div>
      )}

      {/* WEEKLY (default) */}
      {gradeId && tab === "weekly" && (
        <AttendanceWeeklyView
          gradeId={gradeId}
          monday={monday}
          setMonday={setMonday}
        />
      )}

      {/* DAILY (unchanged behaviour) */}
      {gradeId && tab === "daily" && (
        <>
          {isLoading && <LoadingState label="Loading attendance..." />}
          {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

          {!isLoading && !isError && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <StatTile label="Records" value={dailyRows.length}    tone="violet"  icon={CalendarIcon} />
                <StatTile label="Present" value={dailyCounts.present} tone="emerald" icon={UserCheck} />
                <StatTile label="Absent"  value={dailyCounts.absent}  tone="rose"    icon={UserX} />
                <StatTile label="Late"    value={dailyCounts.late}    tone="amber"   icon={Clock} />
                <StatTile label="Excused" value={dailyCounts.excused} tone="slate"   icon={AlertCircle} />
              </div>

              {dailyRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <CalendarIcon size={24} />
                  </span>
                  <h2 className="mt-4 font-display text-lg font-extrabold text-navy-950">
                    No attendance recorded for this date
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Teachers mark attendance from their dashboard. Once they do, the records will show up here.
                  </p>
                </div>
              ) : filteredDaily.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  No records match your search.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Student</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Marked by</th>
                        <th className="px-4 py-3 text-left font-semibold">Marked at</th>
                        <th className="px-4 py-3 text-left font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDaily.map((r) => {
                        const meta = STATUS_META[r.status] || STATUS_META.present;
                        return (
                          <tr key={r.record_id || r.student} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-medium text-navy-950">{r.student_name}</td>
                            <td className="px-4 py-3">
                              <span className={"inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider " + meta.chip}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{r.marked_by || "—"}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{formatTime(r.marked_at)}</td>
                            <td className="px-4 py-3 text-slate-500">{r.note || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}