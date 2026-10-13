import { useMemo, useState } from "react";
import { CalendarX, UserCheck, Plus } from "lucide-react";

import Button from "../../../components/ui/Button";
import {
  useGetAdminAbsencesQuery,
  useCreateAdminAbsenceMutation,
  useSuggestSubstitutesMutation,
  useAssignSubstituteMutation,
  useGetAdminUsersQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdminSubstitutionsPage() {
  const [date, setDate] = useState(todayIso());
  const [teacherId, setTeacherId] = useState("");
  const [entryId, setEntryId] = useState("");
  const [reason, setReason] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const { data: usersData } = useGetAdminUsersQuery({ role: "teacher" });
  const teachers = useMemo(
    () => (usersData?.results ?? usersData ?? []).filter((u) => u.role === "teacher"),
    [usersData]
  );

  const { data: absencesData, refetch: refetchAbsences } = useGetAdminAbsencesQuery();
  const absences = absencesData?.results ?? absencesData ?? [];

  const [createAbsence] = useCreateAdminAbsenceMutation();
  const [suggest, { isLoading: suggesting }] = useSuggestSubstitutesMutation();
  const [assignSub] = useAssignSubstituteMutation();

  const handleMarkAbsent = async () => {
    setError("");
    if (!teacherId || !date) { setError("Pick a teacher and date."); return; }
    try {
      await createAbsence({ teacher_id: teacherId, date, reason }).unwrap();
      setNotice("Absence recorded.");
      refetchAbsences();
    } catch (e) { setError(extractErrorMessage(e)); }
  };

  const handleSuggest = async () => {
    setError(""); setNotice(""); setCandidates([]);
    if (!date || !entryId) { setError("Provide date and timetable entry ID."); return; }
    try {
      const res = await suggest({ date, timetable_entry_id: entryId }).unwrap();
      setCandidates(res.available || []);
    } catch (e) { setError(extractErrorMessage(e)); }
  };

  const handleAssign = async (substituteId) => {
    setError(""); setNotice("");
    try {
      await assignSub({ date, timetable_entry_id: entryId, substitute_teacher_id: substituteId }).unwrap();
      setNotice("Substitute assigned.");
      setCandidates([]);
    } catch (e) { setError(extractErrorMessage(e)); }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">Substitutions</h1>
        <p className="mt-1 text-sm text-slate-500">Mark teachers absent and find substitutes for their sessions.</p>
      </header>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{notice}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">1. Mark teacher absent</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">— Select teacher —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="primary" onClick={handleMarkAbsent}><Plus size={14} /> Mark Absent</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">2. Find substitute</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input type="text" value={entryId} onChange={(e) => setEntryId(e.target.value)} placeholder="Timetable entry UUID" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={handleSuggest} disabled={suggesting}><UserCheck size={14} /> {suggesting ? "Searching…" : "Find available"}</Button>
        </div>

        {candidates.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {candidates.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div>
                  <p className="text-sm font-bold text-navy-950">{c.full_name}</p>
                  <p className="text-[11px] text-slate-500">{c.email} · {c.current_load} periods today</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleAssign(c.id)}>Assign</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">Recorded absences</h2>
        {absences.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No absences recorded.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {absences.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-2 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600"><CalendarX size={14} /></span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy-950">{a.teacher_name}</p>
                  <p className="text-[11px] text-slate-500">{a.date} {a.reason && `· ${a.reason}`}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}