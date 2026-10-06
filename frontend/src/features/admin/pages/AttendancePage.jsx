import { useMemo, useState } from "react";
import {
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useGetClassesQuery,
} from "../../../store/api/realApi";

const STATUSES = [
  { key: "present", label: "Present", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { key: "absent",  label: "Absent",  cls: "bg-rose-100 text-rose-700 border-rose-300" },
  { key: "late",    label: "Late",    cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { key: "excused", label: "Excused", cls: "bg-slate-100 text-slate-700 border-slate-300" },
];

const today = new Date().toISOString().slice(0, 10);

export default function AttendancePage() {
  const [klassId, setKlassId] = useState("");
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState({}); // { studentId: status }
  const [notice, setNotice] = useState(null);

  const { data: classesData } = useGetClassesQuery({ page: 1 });
  const classes = classesData?.results || classesData || [];

  const { data, isFetching } = useGetAttendanceQuery(
    { klass: klassId, date },
    { skip: !klassId || !date }
  );

  const [markAttendance, { isLoading: saving }] = useMarkAttendanceMutation();

  const rows = data?.rows || [];

  // merge server data with local draft
  const merged = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      effectiveStatus: draft[r.student] ?? r.status,
    }));
  }, [rows, draft]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0, unset: 0 };
    merged.forEach((r) => {
      if (r.effectiveStatus && c[r.effectiveStatus] !== undefined) {
        c[r.effectiveStatus]++;
      } else {
        c.unset++;
      }
    });
    return c;
  }, [merged]);

  const setStatus = (studentId, status) => {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const next = {};
    merged.forEach((r) => { next[r.student] = status; });
    setDraft(next);
  };

  const save = async () => {
    setNotice(null);
    const records = merged
      .filter((r) => r.effectiveStatus)
      .map((r) => ({
        student: r.student,
        status: r.effectiveStatus,
        note: r.note || "",
      }));

    if (!klassId || !date || records.length === 0) {
      setNotice({ tone: "warn", text: "Pick a class, a date, and mark at least one student." });
      return;
    }

    try {
      await markAttendance({ klass: klassId, date, records }).unwrap();
      setDraft({});
      setNotice({ tone: "ok", text: `Saved ${records.length} record(s) for ${date}.` });
    } catch (err) {
      const msg =
        err?.data?.error?.detail ||
        err?.data?.detail ||
        "Could not save attendance.";
      setNotice({ tone: "err", text: typeof msg === "string" ? msg : JSON.stringify(msg) });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Mark attendance for a class on a given day.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
          <select
            value={klassId}
            onChange={(e) => { setKlassId(e.target.value); setDraft({}); }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-w-[200px]"
          >
            <option value="">— Select class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setDraft({}); }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => markAll("present")}
            className="rounded-xl bg-emerald-100 text-emerald-700 px-3 py-2 text-sm font-semibold"
          >
            Mark all present
          </button>
          <button
            onClick={() => setDraft({})}
            className="rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-sm font-semibold"
          >
            Clear changes
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-violet-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={
            "mb-4 rounded-xl px-3.5 py-2.5 text-sm font-semibold " +
            (notice.tone === "ok"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : notice.tone === "warn"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200")
          }
        >
          {notice.text}
        </div>
      )}

      {/* Stats strip */}
      {klassId && (
        <div className="mb-5 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Present" value={counts.present} tone="emerald" />
          <Stat label="Absent"  value={counts.absent}  tone="rose" />
          <Stat label="Late"    value={counts.late}    tone="amber" />
          <Stat label="Excused" value={counts.excused} tone="slate" />
          <Stat label="Unmarked" value={counts.unset}  tone="violet" />
        </div>
      )}

      {/* Grid */}
      {!klassId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Pick a class above to start marking attendance.
        </div>
      ) : isFetching ? (
        <div className="rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          Loading…
        </div>
      ) : merged.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No students found in this class.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Student</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((r) => (
                <tr key={r.student} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.student_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {STATUSES.map((s) => {
                        const active = r.effectiveStatus === s.key;
                        return (
                          <button
                            key={s.key}
                            onClick={() => setStatus(r.student, s.key)}
                            className={
                              "rounded-lg px-3 py-1.5 text-xs font-semibold border transition " +
                              (active
                                ? s.cls + " ring-2 ring-offset-1 ring-violet-300"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")
                            }
                          >
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
    </div>
  );
}

function Stat({ label, value, tone }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-700",
    slate:   "bg-slate-50 text-slate-700",
    violet:  "bg-violet-50 text-violet-700",
  };
  return (
    <div className={"rounded-xl px-4 py-3 " + (toneMap[tone] || toneMap.slate)}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}