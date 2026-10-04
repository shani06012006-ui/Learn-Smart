// frontend/src/features/admin/pages/AdminTimetablePage.jsx
import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, Trash2, LayoutGrid, List, Calendar as CalendarIcon,
  Clock, MapPin, BookOpen, MoreVertical, User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import TimetableEntryModal from "../components/TimetableEntryModal";
import {
  useGetAdminTimetableQuery,
  useDeactivateAdminTimetableMutation,
  useGetAdminCoursesQuery,
  useGetAdminUsersQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const DAYS = [
  { value: 0, label: "Monday", short: "Mon" },
  { value: 1, label: "Tuesday", short: "Tue" },
  { value: 2, label: "Wednesday", short: "Wed" },
  { value: 3, label: "Thursday", short: "Thu" },
  { value: 4, label: "Friday", short: "Fri" },
  { value: 5, label: "Saturday", short: "Sat" },
  { value: 6, label: "Sunday", short: "Sun" },
];

const WEEK_DAYS = [0, 1, 2, 3, 4];

function formatTime(t) {
  if (!t) return "—";
  return t.slice(0, 5);
}

/* Subject → gradient for entry cards */
const SUBJECT_GRADIENTS = {
  "Mathematics":      "from-purple-500 to-purple-700",
  "Science":          "from-emerald-500 to-teal-600",
  "English":          "from-coral-500 to-coral-700",
  "History":          "from-amber-500 to-coral-600",
  "Physics":          "from-purple-500 to-coral-500",
  "Chemistry":        "from-teal-500 to-emerald-700",
  "Biology":          "from-emerald-500 to-purple-500",
  "Computer Science": "from-purple-500 to-purple-700",
};

const FALLBACK_GRADIENTS = [
  "from-purple-500 to-purple-700",
  "from-coral-500 to-coral-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-coral-500",
  "from-teal-500 to-emerald-700",
];

function gradientForSubject(subject) {
  if (!subject) return FALLBACK_GRADIENTS[0];
  if (SUBJECT_GRADIENTS[subject]) return SUBJECT_GRADIENTS[subject];
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return FALLBACK_GRADIENTS[h % FALLBACK_GRADIENTS.length];
}

/* Small stat card */
function StatMini({ label, value, tone = "purple", icon: Icon }) {
  const TONE = {
    purple:  { chip: "bg-purple-50 text-purple-600",  bar: "bg-purple-500" },
    emerald: { chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
    coral:   { chip: "bg-coral-50 text-coral-600",     bar: "bg-coral-500" },
  };
  const t = TONE[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar} opacity-70 group-hover:opacity-100`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-navy-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.chip}`}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}

/* Entry card for grid view */
function GridEntryCard({ entry, onEdit, onDeactivate, busy }) {
  const gradient = gradientForSubject(entry.class_course?.subject);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />

      <div className="flex items-start justify-between gap-1">
        <p className="text-[11px] font-bold tabular-nums text-navy-950">
          {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
        </p>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            title="Edit"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={() => onDeactivate(entry)}
            disabled={busy}
            title="Deactivate"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-coral-50 hover:text-coral-600 disabled:opacity-40"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {entry.class_course?.id ? (
        <Link
          to={`/admin/courses/${entry.class_course.id}`}
          className="mt-1 block truncate text-[11px] font-semibold text-navy-950 transition-colors hover:text-purple-500"
        >
          {entry.class_course?.name}
        </Link>
      ) : (
        <p className="mt-1 truncate text-[11px] font-semibold text-navy-950">
          {entry.class_course?.name}
        </p>
      )}

      {entry.class_course?.teacher?.full_name && (
        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {entry.class_course.teacher.full_name}
        </p>
      )}

      {entry.room && (
        <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-400">
          <MapPin size={9} />
          {entry.room}
        </p>
      )}
    </motion.div>
  );
}

/* Row for list view */
function ListRow({ entry, onEdit, onDeactivate, busy }) {
  const gradient = gradientForSubject(entry.class_course?.subject);
  return (
    <li className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 lg:flex-row lg:items-center lg:gap-5">
      {/* Day badge */}
      <span className="hidden w-20 shrink-0 lg:block">
        <Badge variant="neutral">
          {entry.day_label || DAYS[entry.day_of_week]?.short}
        </Badge>
      </span>

      {/* Class */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
          <BookOpen size={16} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          {entry.class_course?.id ? (
            <Link
              to={`/admin/courses/${entry.class_course.id}`}
              className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
            >
              {entry.class_course.name}
            </Link>
          ) : (
            <p className="truncate text-sm font-bold text-navy-950">
              {entry.class_course?.name}
            </p>
          )}
          <p className="truncate text-xs text-slate-400">
            {entry.class_course?.subject}
            {entry.class_course?.teacher?.full_name ? ` · ${entry.class_course.teacher.full_name}` : ""}
          </p>
        </div>
      </div>

      {/* Time chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100">
          <Clock size={11} className="text-slate-400" />
          <span className="tabular-nums text-navy-950">
            {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
          </span>
        </span>
        {entry.room && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100">
            <MapPin size={11} className="text-slate-400" />
            {entry.room}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 lg:w-24">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          title="Edit"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDeactivate(entry)}
          disabled={busy}
          title="Deactivate"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-coral-50 hover:text-coral-600 disabled:opacity-40"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}

export default function AdminTimetablePage() {
  const [teacherFilter, setTeacherFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [view, setView] = useState("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const queryParams = {};
  if (teacherFilter) queryParams.teacher = teacherFilter;
  if (classFilter) queryParams.class_id = classFilter;

  const { data, isLoading, isError, error, refetch } = useGetAdminTimetableQuery(queryParams);
  const [deactivate] = useDeactivateAdminTimetableMutation();

  const { data: coursesData } = useGetAdminCoursesQuery({ is_archived: false });
  const { data: teachersData } = useGetAdminUsersQuery({ role: "teacher" });

  const courses = coursesData?.results || [];
  const teachers = teachersData?.results || [];
  const entries = data?.results || [];

  const entriesByDay = useMemo(() => {
    const map = {};
    WEEK_DAYS.forEach((d) => { map[d] = []; });
    entries.forEach((e) => {
      if (map[e.day_of_week]) map[e.day_of_week].push(e);
    });
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return map;
  }, [entries]);

  const handleCreate = () => {
    setEditEntry(null);
    setModalOpen(true);
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setModalOpen(true);
  };

  const handleDeactivate = async (entry) => {
    if (!window.confirm(
      `Deactivate ${entry.class_course?.name} on ${DAYS[entry.day_of_week]?.label}?`
    )) return;
    setBusyId(entry.id);
    try {
      await deactivate(entry.id).unwrap();
    } catch {
      // Silent — refetch via tag invalidation.
    } finally {
      setBusyId(null);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditEntry(null);
  };

  const teacherCount = new Set(
    entries.map((e) => e.class_course?.teacher?.id).filter(Boolean)
  ).size;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Weekly schedule for classes across your platform.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={15} />
          Add entry
        </Button>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatMini label="Total entries" value={entries.length} tone="purple" icon={CalendarIcon} />
        <StatMini label="Teachers scheduled" value={teacherCount} tone="emerald" icon={User} />
        <StatMini label="Classes covered" value={courses.length} tone="coral" icon={BookOpen} />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Teacher filter */}
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || t.email}
              </option>
            ))}
          </select>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">All classes</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.subject}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 rounded-full bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                view === "grid"
                  ? "bg-purple-500 text-white shadow-purple-glow"
                  : "text-slate-500 hover:text-navy-950"
              }`}
            >
              <LayoutGrid size={13} />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                view === "list"
                  ? "bg-purple-500 text-white shadow-purple-glow"
                  : "text-slate-500 hover:text-navy-950"
              }`}
            >
              <List size={13} />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading && <LoadingState label="Loading timetable..." />}

      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && entries.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <CalendarIcon size={26} strokeWidth={2} />
          </span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">
            No timetable entries yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Add the first entry to start building your weekly schedule.
          </p>
          <Button onClick={handleCreate} className="mt-2">
            <Plus size={15} />
            Add entry
          </Button>
        </div>
      )}

      {/* Grid view */}
      {!isLoading && !isError && entries.length > 0 && view === "grid" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="grid grid-cols-5 divide-x divide-slate-100">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="min-w-0">
                <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2.5 text-center font-display text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {DAYS[d].short}
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {entriesByDay[d].length === 0 ? (
                    <p className="py-6 text-center text-[10px] font-semibold text-slate-300">
                      No classes
                    </p>
                  ) : (
                    entriesByDay[d].map((e) => (
                      <GridEntryCard
                        key={e.id}
                        entry={e}
                        onEdit={handleEdit}
                        onDeactivate={handleDeactivate}
                        busy={busyId === e.id}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      {!isLoading && !isError && entries.length > 0 && view === "list" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <ul className="divide-y divide-slate-100">
            {entries.map((e) => (
              <ListRow
                key={e.id}
                entry={e}
                onEdit={handleEdit}
                onDeactivate={handleDeactivate}
                busy={busyId === e.id}
              />
            ))}
          </ul>
        </div>
      )}

      <TimetableEntryModal
        open={modalOpen}
        onClose={handleCloseModal}
        entry={editEntry}
      />
    </div>
  );
}