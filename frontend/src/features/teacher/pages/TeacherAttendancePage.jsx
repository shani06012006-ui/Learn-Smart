// frontend/src/features/teacher/pages/TeacherAttendancePage.jsx
import { useMemo, useState } from "react";
import {
  BookOpen, Calendar as CalendarIcon, Check, X,
  Clock, AlertCircle, Save, Eraser,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetGradesQuery,
  useGetTeacherAttendanceQuery,
  useMarkTeacherAttendanceMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const STATUSES = [
  { key: "present", label: "Present", icon: Check,        chip: "bg-emerald-500 text-white", muted: "text-emerald-700 border-emerald-300 bg-emerald-50" },
  { key: "absent",  label: "Absent",  icon: X,            chip: "bg-rose-500 text-white",    muted: "text-rose-700 border-rose-300 bg-rose-50" },
  { key: "late",    label: "Late",    icon: Clock,        chip: "bg-amber-500 text-white",   muted: "text-amber-700 border-amber-300 bg-amber-50" },
  { key: "excused", label: "Excused", icon: AlertCircle,  chip: "bg-slate-500 text-white",   muted: "text-slate-700 border-slate-300 bg-slate-50" },
];

export default function TeacherAttendancePage() {
  const [gradeId, setGradeId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [draft, setDraft] = useState({});
  const [notice, setNotice] = useState(null);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results || gradesData || [];

  const { data, isFetching, refetch } = useGetTeacherAttendanceQuery(
    { grade: gradeId, date },
    { skip: !gradeId || !date },
  );

  const [markAttendance, { isLoading: saving }] = useMarkTeacherAttendanceMutation();

  const rows = data?.rows || [];

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

  const setStatus = (sid, status) => setDraft((p) => ({ ...p, [sid]: status }));

  const markAll = (status) => {
    const next = {};
    merged.forEach((r) => { next[r.student] = status; });
    setDraft(next);
  };

  const save = async () => {
    setNotice(null);
    const records = merged
      .filter((r) => r.effectiveStatus)
      .map((r) => ({ student: r.student, status: r.effectiveStatus, note: r.note || "" }));

    if (!gradeId || !date || records.length === 0) {
      setNotice({ tone: "warn", text: "Pick a class, a date, and mark at least one student." });
      return;
    }

    try {
      const res = await markAttendance({ grade: gradeId, date, records }).unwrap();
      setDraft({});
      setNotice({ tone: "ok", text: `Saved ${res.saved || records.length} record(s) for ${date}.` });
      refetch();
    } catch (err) {
      setNotice({ tone: "err", text: extractErrorMessage(err) });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mark today's attendance for any of your classes.
          </p>
        </div>
      </header>

      {/* Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Grade</label>
            <select
              value={gradeId}
              onChange={(e) => { setGradeId(e.target.value); setDraft({}); }}
              className="h-10 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
            >
              <option value="">— Select class —</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
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
              disabled={!gradeId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
            >
              <Check size={13} /> Mark all present
            </button>
            <button
              type="button"
              onClick={() => setDraft({})}
              disabled={!gradeId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <Eraser size={13} /> Clear
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!gradeId || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-purple-glow transition hover:bg-purple-600 disabled:opacity-40"
            >
              <Save size={13} /> {saving ? "Saving…" : "Save attendance"}
            </button>
          </div>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={
            "rounded-xl px-3.5 py-2.5 text-sm font-semibold border " +
            (notice.tone === "ok"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : notice.tone === "warn"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-rose-50 text-rose-700 border-rose-200")
          }
        >
          {notice.text}
        </div>
      )}

      {/* Empty state */}
      {!gradeId && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <BookOpen size={24} />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-navy-950">
            Pick a grade to begin
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a grade and a date, then mark each student.
          </p>
        </div>
      )}

      {gradeId && isFetching && <LoadingState label="Loading roster..." />}

      {/* Stats strip */}
      {gradeId && !isFetching && merged.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Tile label="Present"  value={counts.present}  tone="emerald" />
          <Tile label="Absent"   value={counts.absent}   tone="rose" />
          <Tile label="Late"     value={counts.late}     tone="amber" />
          <Tile label="Excused"  value={counts.excused}  tone="slate" />
          <Tile label="Unmarked" value={counts.unset}    tone="violet" />
        </div>
      )}

      {/* Grid */}
      {gradeId && !isFetching && merged.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Student</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((r) => (
                <tr key={r.student} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-navy-950">{r.student_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => {
                        const Icon = s.icon;
                        const active = r.effectiveStatus === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setStatus(r.student, s.key)}
                            className={
                              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition " +
                              (active
                                ? s.chip + " border-transparent"
                                : "bg-white " + s.muted + " hover:opacity-90")
                            }
                          >
                            <Icon size={12} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {gradeId && !isFetching && merged.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No students in this class yet. Ask your admin to add students or share the join code.
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, tone }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-700",
    slate:   "bg-slate-50 text-slate-700",
    violet:  "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className={"inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " + toneMap[tone]}>
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-navy-950">{value}</p>
    </div>
  );
}