// frontend/src/features/admin/pages/AdminSubstitutionsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  CalendarX,
  Plus,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  useGetAdminAbsencesQuery,
  useCreateAdminAbsenceMutation,
  useSuggestSubstitutesMutation,
  useAssignSubstituteMutation,
  useGetAdminUsersQuery,
  useGetAdminTimetableQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";
import SessionCard from "../components/SessionCard";
import AvailableTeachersPicker from "../components/AvailableTeachersPicker";

const todayIso = () => new Date().toISOString().slice(0, 10);

// JS Date#getDay() → Sunday=0..Saturday=6
// Backend DAY_CHOICES → Monday=0..Sunday=6
const toBackendDow = (isoDate) => {
  const d = new Date(isoDate + "T00:00:00");
  const js = d.getDay();          // 0=Sun
  return (js + 6) % 7;            // 0=Mon
};

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AdminSubstitutionsPage() {
  // ---- Step 1: absence ----
  const [date, setDate] = useState(todayIso());
  const [teacherId, setTeacherId] = useState("");
  const [reason, setReason] = useState("");

  // ---- Step 2: pick session ----
  const [selectedEntry, setSelectedEntry] = useState(null);

  // ---- Step 3: pick substitute ----
  const [candidates, setCandidates] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ---- Teachers list ----
  const { data: usersData } = useGetAdminUsersQuery({ role: "teacher" });
  const teachers = useMemo(
    () =>
      (usersData?.results ?? usersData ?? []).filter(
        (u) => u.role === "teacher",
      ),
    [usersData],
  );

  // ---- Absences list ----
  const { data: absencesData, refetch: refetchAbsences } =
    useGetAdminAbsencesQuery();
  const absences = absencesData?.results ?? absencesData ?? [];

  // ---- Step 2: teacher's schedule for that date ----
  const dow = date ? toBackendDow(date) : null;
  const { data: timetableData, isFetching: loadingSchedule } =
    useGetAdminTimetableQuery(
      teacherId && dow != null
        ? { teacher: teacherId, day: dow }
        : { teacher: "__none__", day: 0 },
      { skip: !teacherId || dow == null },
    );

  const schedule = useMemo(() => {
    const rows = timetableData?.results ?? timetableData ?? [];
    return [...rows].sort((a, b) =>
      (a.start_time || "").localeCompare(b.start_time || ""),
    );
  }, [timetableData]);

  // Clear session + candidates when teacher or date changes
  useEffect(() => {
    setSelectedEntry(null);
    setCandidates([]);
    setSelectedSubId("");
  }, [teacherId, date]);

  // ---- Mutations ----
  const [createAbsence, { isLoading: savingAbsence }] =
    useCreateAdminAbsenceMutation();
  const [suggest, { isLoading: suggesting }] = useSuggestSubstitutesMutation();
  const [assignSub, { isLoading: assigning }] = useAssignSubstituteMutation();

  // ---- Step 1: record absence ----
  const handleMarkAbsent = async () => {
    setError("");
    setNotice("");
    if (!teacherId || !date) {
      setError("Pick a teacher and a date.");
      return;
    }
    try {
      await createAbsence({ teacher_id: teacherId, date, reason }).unwrap();
      setNotice("Absence recorded. Now pick a session to cover.");
      refetchAbsences();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  // ---- Step 2: click a session card ----
  const handleSelectSession = async (entry) => {
    setError("");
    setNotice("");
    setSelectedEntry(entry);
    setCandidates([]);
    setSelectedSubId("");

    try {
      const res = await suggest({
        date,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
      }).unwrap();
      setCandidates(res.available || []);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  // ---- Step 3: assign ----
  const handleAssign = async () => {
    setError("");
    setNotice("");
    if (!selectedEntry || !selectedSubId) {
      setError("Pick a substitute first.");
      return;
    }
    try {
      await assignSub({
        date,
        timetable_entry_id: selectedEntry.id,
        substitute_teacher_id: selectedSubId,
      }).unwrap();
      setNotice("Substitute assigned.");
      setSelectedEntry(null);
      setCandidates([]);
      setSelectedSubId("");
      refetchAbsences();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const teacherLabel =
    teachers.find((t) => String(t.id) === String(teacherId))?.full_name ||
    teachers.find((t) => String(t.id) === String(teacherId))?.email ||
    "";

  const dayLabel = dow != null ? DAY_LABELS[dow] : "";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          Substitutions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Mark a teacher absent, pick the sessions they were meant to teach, and
          assign coverage — in three steps.
        </p>
      </header>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ═════════════ STEP 1 — Record absence ═════════════ */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-[11px] font-extrabold text-white">
            1
          </span>
          <h2 className="text-sm font-extrabold text-navy-950">
            Mark a teacher absent
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="">— Select teacher —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Reason <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical leave"
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleMarkAbsent}
            disabled={savingAbsence || !teacherId || !date}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            {savingAbsence ? "Recording…" : "Record absence"}
          </button>
        </div>
      </section>

      {/* ═════════════ STEP 2 — Pick a session ═════════════ */}
      {teacherId && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-[11px] font-extrabold text-white">
                2
              </span>
              <h2 className="text-sm font-extrabold text-navy-950">
                Pick a session to cover
              </h2>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">
              {teacherLabel && <>Showing <strong className="text-navy-950">{teacherLabel}</strong> · </>}
              {dayLabel} {date}
            </p>
          </div>

          {loadingSchedule ? (
            <p className="py-6 text-center text-xs font-semibold text-slate-400">
              Loading schedule…
            </p>
          ) : schedule.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50/60 py-8 text-center">
              <p className="text-xs font-semibold text-slate-500">
                No sessions scheduled for this teacher on {dayLabel}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {schedule.map((entry) => (
                <SessionCard
                  key={entry.id}
                  entry={entry}
                  selected={selectedEntry?.id === entry.id}
                  onClick={() => handleSelectSession(entry)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═════════════ STEP 3 — Assign substitute ═════════════ */}
      {selectedEntry && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-[11px] font-extrabold text-white">
              3
            </span>
            <h2 className="text-sm font-extrabold text-navy-950">
              Assign a substitute
            </h2>
          </div>

          <div className="mb-4 rounded-xl border border-gray-100 bg-slate-50/60 px-4 py-3">
            <p className="text-xs font-bold text-navy-950">
              {selectedEntry.class_course?.subject ||
                selectedEntry.class_course?.name ||
                "Session"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {(selectedEntry.start_time || "").slice(0, 5)}–
              {(selectedEntry.end_time || "").slice(0, 5)}
              {selectedEntry.section_name &&
                ` · ${selectedEntry.section_name}`}
              {selectedEntry.room && ` · Room ${selectedEntry.room}`}
            </p>
          </div>

          <AvailableTeachersPicker
            candidates={candidates}
            selectedId={selectedSubId}
            onSelect={setSelectedSubId}
            onAssign={handleAssign}
            assigning={assigning}
            loading={suggesting}
          />
        </section>
      )}

      {/* ═════════════ Recorded absences ═════════════ */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <CalendarX size={16} />
          </span>
          <h2 className="text-sm font-extrabold text-navy-950">
            Recorded absences
          </h2>
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {absences.length}
          </span>
        </div>

        {absences.length === 0 ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-400">
            No absences recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {absences.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <UserCheck size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-950">
                    {a.teacher_name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {a.date}
                    {a.reason && ` · ${a.reason}`}
                  </p>
                </div>
                {a.is_approved ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 ring-1 ring-amber-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Pending
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}