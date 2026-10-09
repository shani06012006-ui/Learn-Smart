// frontend/src/features/teacher/pages/TeacherStudentsPage.jsx
import { useMemo, useState } from "react";
import { Search, GraduationCap, Users, TrendingUp, RefreshCw } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import { classShortLabel, classLabel } from "../components/classLabel";
import {
  useGetClassesQuery,
  useGetTeacherStudentsDirectoryQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

function MetricCard({ icon: Icon, label, value, tone = "purple" }) {
  const tones = {
    purple: "bg-purple-50 text-purple-600",
    mint: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <span className={"flex h-8 w-8 items-center justify-center rounded-lg " + tones[tone]}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-navy-950">
        {value}
      </p>
    </div>
  );
}

function initialsOf(name) {
  const parts = (name || "").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function TeacherStudentsPage() {
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");

  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.results ?? classesData ?? [];

  const queryArgs = useMemo(() => {
    const a = {};
    if (classId) a.class_course = classId;
    if (search.trim()) a.q = search.trim();
    return a;
  }, [classId, search]);

  const { data, isLoading, isError, error, refetch } =
    useGetTeacherStudentsDirectoryQuery(queryArgs);

  // HARDENED extraction — data may be:
  //   - undefined (loading)
  //   - { results: [...] } (paginated)
  //   - [...] (unpaginated)
  //   - an error object (403/500) with no results
  const students = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const metrics = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => (s.attendance_pct ?? 0) >= 75).length;
    const avgPct = total
      ? Math.round(
          students.reduce((sum, s) => sum + (s.attendance_pct || 0), 0) / total,
        )
      : 0;
    return { total, present, avgPct };
  }, [students]);

  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Class-wise student directory with attendance overview.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={Users} label="Total Students" value={metrics.total} tone="purple" />
        <MetricCard icon={GraduationCap} label="Above 75% Attendance" value={metrics.present} tone="mint" />
        <MetricCard icon={TrendingUp} label="Avg Attendance (%)" value={metrics.avgPct} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classShortLabel(c)}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <p className="text-xs text-slate-500">
          🎯 Showing roster for{" "}
          <span className="font-bold text-navy-950">{classLabel(selectedClass)}</span>
        </p>
      )}

      {isLoading && <LoadingState label="Loading students…" />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && students.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <Users size={26} />
          </span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">
            No students found
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Try a different class or clear the search.
          </p>
        </div>
      )}

      {!isLoading && !isError && students.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Roll #
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Student PIN
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Class Teacher
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const pct = s.attendance_pct ?? 0;
                const tone =
                  pct >= 85
                    ? "text-emerald-600 bg-emerald-50"
                    : pct >= 60
                    ? "text-amber-600 bg-amber-50"
                    : "text-rose-600 bg-rose-50";
                return (
                  <tr key={s.id || s.enrollment_id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                          {initialsOf(s.full_name || s.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy-950">
                            {s.full_name || "Unnamed"}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {s.roll_number || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {s.student_pin ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 font-mono text-xs font-bold text-purple-700 ring-1 ring-purple-100">
                          {s.student_pin}
                          {s.student_pin_active === false && (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                              inactive
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">No PIN</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {s.class_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {s.class_teacher_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-bold " + tone}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}