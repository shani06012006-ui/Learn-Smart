// frontend/src/features/teacher/pages/TeacherAttendancePage.jsx
import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon, Check, X, Clock, AlertCircle,
  Save, Eraser, GraduationCap, Lock, CheckCircle2,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import { classLabel, classShortLabel } from "../components/classLabel";
import {
  useGetGradesQuery,
  useGetClassesQuery,
  useGetTeacherAttendanceQuery,
  useMarkTeacherAttendanceMutation,
} from "../../../store/api/realApi";
import { useAuth } from "../../../hooks/useAuth";
import { extractErrorMessage } from "../../../utils/apiError";

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const STATUSES = [
  { key: "present", label: "Present", icon: Check,       chip: "bg-emerald-500 text-white", muted: "text-emerald-700 border-emerald-300 bg-emerald-50" },
  { key: "absent",  label: "Absent",  icon: X,           chip: "bg-rose-500 text-white",    muted: "text-rose-700 border-rose-300 bg-rose-50" },
  { key: "late",    label: "Late",    icon: Clock,       chip: "bg-amber-500 text-white",   muted: "text-amber-700 border-amber-300 bg-amber-50" },
  { key: "excused", label: "Excused", icon: AlertCircle, chip: "bg-slate-500 text-white",   muted: "text-slate-700 border-slate-300 bg-slate-50" },
];

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
    });
  } catch {
    return iso;
  }
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState("class"); // "class" | "grade"
  const [gradeId, setGradeId] = useState("");
  const [classCourseId, setClassCourseId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [draft, setDraft] = useState({});
  const [notice, setNotice] = useState(null);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results || gradesData || [];
  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.results || classesData || [];

  const target = mode === "class" ? classCourseId : gradeId;

  const { data, isFetching, refetch } = useGetTeacherAttendanceQuery(
    {
      grade: mode === "grade" ? gradeId : undefined,
      klass: mode === "class" ? classCourseId : undefined,
      date,
    },
    { skip: !target || !date },
  );

  const [markAttendance, { isLoading: saving }] = useMarkTeacherAttendanceMutation();
  const rows = data?.rows || [];
  const submitted = data?.submitted || null;
  const classTeacherName = data?.class_teacher_name || "";
  const klassName = data?.klass_name || "";
  const gradeName = data?.grade_name || "";

  // Read-only if a different teacher has submitted
  const submittedByMe = submitted && String(submitted.teacher_id) === String(user?.id);
  const readOnly = Boolean(submitted) && !submittedByMe && mode === "class";

  const merged = useMemo(
    () => rows.map((r) => ({ ...r, effectiveStatus: draft[r.student] ?? r.status })),
    [rows, draft],
  );

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0, unset: 0 };
    merged.forEach((r) => {
      if (r.effectiveStatus && c[r.effectiveStatus] !== undefined) c[r.effectiveStatus]++;
      else c.unset++;
    });
    return c;
  }, [merged]);

  const setStatus = (sid, status) => {
    if (readOnly) return;
    setDraft((p) => ({ ...p, [sid]: status }));
  };

  const markAll = (status) => {
    if (readOnly) return;
    const next = {};
    merged.forEach((r) => { next[r.student] = status; });
    setDraft(next);
  };

  const save = async () => {
    setNotice(null);
    const records = merged
      .filter((r) => r.effectiveStatus)
      .map((r) => ({ student: r.student, status: r.effectiveStatus, note: r.note || "" }));

    if (!target || !date || records.length === 0) {
      setNotice({ tone: "warn", text: "Pick a class, a date, and mark at least one student." });
      return;
    }

    try {
      const payload = { date, records };
      if (mode === "class") payload.klass = classCourseId;
      else payload.grade = gradeId;

      const res = await markAttendance(payload).unwrap();
      setDraft({});
      setNotice({ tone: "ok", text: `Saved ${res.saved || records.length} record(s) for ${date}.` });
      refetch();
    } catch (err) {
      setNotice({ tone: "err", text: extractErrorMessage(err) });
    }
  };

  const clearDraft = () => setDraft({});

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mark daily attendance for your class. Other teachers can view — read only.
          </p>
        </div>
      </header>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 self-start rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => { setMode("class"); setDraft({}); }}
          className={
            "rounded-full px-4 py-1.5 text-xs font-bold transition " +
            (mode === "class" ? "bg-purple-500 text-white shadow-purple-glow" : "text-slate-600 hover:text-navy-950")
          }
        >
          By Class
        </button>
        <button
          type="button"
          onClick={() => { setMode("grade"); setDraft({}); }}
          className={
            "rounded-full px-4 py-1.5 text-xs font-bold transition " +
            (mode === "grade" ? "bg-purple-500 text-white shadow-purple-glow" : "text-slate-600 hover:text-navy-950")
          }
        >
          By Grade
        </button>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          {mode === "class" ? (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Class / Course
              </label>
              <select
                value={classCourseId}
                onChange={(e) => { setClassCourseId(e.target.value); setDraft({}); }}
                className="h-10 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
              >
                <option value="">— Select class —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{classShortLabel(c)}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Grade
              </label>
              <select
                value={gradeId}
                onChange={(e) => { setGradeId(e.target.value); setDraft({}); }}
                className="h-10 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
              >
                <option value="">— Select grade —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setDraft({}); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
            />
          </div>

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => markAll("present")}
              disabled={!target || readOnly}
              className="h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll("absent")}
              disabled={!target || readOnly}
              className="h-10 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              Mark All Absent
            </button>
            <button
              type="button"
              onClick={clearDraft}
              disabled={Object.keys(draft).length === 0}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Eraser size={12} className="mr-1 inline" /> Clear
            </button>
          </div>
        </div>

        {/* Class teacher + submitted banner */}
        {mode === "class" && klassName && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700">
              <GraduationCap size={12} />
              Class Teacher: {classTeacherName || "—"}
            </span>

            {submitted && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={12} />
                Submitted by {submitted.teacher_name} at {fmtTime(submitted.submitted_at)}
              </span>
            )}

            {readOnly && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                <Lock size={12} />
                Read-only
              </span>
            )}
          </div>
        )}
      </div>

      {notice && (
        <div
          className={
            "rounded-xl border px-4 py-3 text-sm font-semibold " +
            (notice.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : notice.tone === "warn"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-rose-200 bg-rose-50 text-rose-700")
          }
        >
          {notice.text}
        </div>
      )}

      {/* Summary chips */}
      {target && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            Present: {counts.present}
          </span>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700">
            Absent: {counts.absent}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
            Late: {counts.late}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
            Excused: {counts.excused}
          </span>
          {counts.unset > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
              Unmarked: {counts.unset}
            </span>
          )}
        </div>
      )}

      {isFetching && <LoadingState label="Loading attendance…" />}

      {!isFetching && target && merged.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          No students enrolled in this class yet.
        </div>
      )}

      {!isFetching && merged.length > 0 && (
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
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody>
              {merged.map((r) => {
                const current = r.effectiveStatus || "unset";
                return (
                  <tr key={r.student} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy-950">{r.student_name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {r.roll_number || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {STATUSES.map((s) => {
                          const Icon = s.icon;
                          const active = current === s.key;
                          return (
                            <button
                              key={s.key}
                              type="button"
                              disabled={readOnly}
                              onClick={() => setStatus(r.student, s.key)}
                              className={
                                "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition " +
                                (active
                                  ? s.chip + " border-transparent"
                                  : "bg-white " + s.muted + (readOnly ? " opacity-50 cursor-not-allowed" : " hover:bg-slate-50"))
                              }
                              title={s.label}
                            >
                              <Icon size={12} />
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {target && !readOnly && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving || Object.keys(draft).length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 px-5 py-3 text-sm font-bold text-white shadow-elevated-lg transition hover:bg-purple-600 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Saving…" : "Submit Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}