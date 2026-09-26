import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react";

import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
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

const WEEK_DAYS = [0, 1, 2, 3, 4]; // Mon-Fri for the grid

function formatTime(t) {
  if (!t) return "—";
  return t.slice(0, 5);
}

export default function AdminTimetablePage() {
  const [teacherFilter, setTeacherFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const queryParams = {};
  if (teacherFilter) queryParams.teacher = teacherFilter;
  if (classFilter) queryParams.class_id = classFilter;

  const { data, isLoading, isError, error, refetch } =
    useGetAdminTimetableQuery(queryParams);
  const [deactivate, { isLoading: isDeactivating }] =
    useDeactivateAdminTimetableMutation();

  const { data: coursesData } = useGetAdminCoursesQuery({ is_archived: false });
  const { data: teachersData } = useGetAdminUsersQuery({ role: "teacher" });

  const courses = coursesData?.results || [];
  const teachers = teachersData?.results || [];
  const entries = data?.results || [];

  // Group entries by day for the grid view.
  const entriesByDay = useMemo(() => {
    const map = {};
    WEEK_DAYS.forEach((d) => {
      map[d] = [];
    });
    entries.forEach((e) => {
      if (map[e.day_of_week]) map[e.day_of_week].push(e);
    });
    // Sort each day by start_time
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
    try {
      await deactivate(entry.id).unwrap();
    } catch {
      // Silent — refetch happens via tag invalidation.
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditEntry(null);
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Timetable
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Weekly schedule for classes across your institution.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} />
          Add entry
        </Button>
      </header>

      {/* Filters + view toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="tt-teacher"
            className="text-sm font-medium text-ink-700"
          >
            Teacher
          </label>
          <select
            id="tt-teacher"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || t.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="tt-class"
            className="text-sm font-medium text-ink-700"
          >
            Class
          </label>
          <select
            id="tt-class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All classes</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.subject}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-ink-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={
              "focus-ring flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium " +
              (view === "grid"
                ? "bg-brand-600 text-white"
                : "text-ink-600 hover:bg-ink-100")
            }
          >
            <LayoutGrid size={14} />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={
              "focus-ring flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium " +
              (view === "list"
                ? "bg-brand-600 text-white"
                : "text-ink-600 hover:bg-ink-100")
            }
          >
            <List size={14} />
            List
          </button>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading timetable..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <EmptyState
          title="No timetable entries"
          message="Add the first entry to build the weekly schedule."
        />
      )}

      {!isLoading && !isError && entries.length > 0 && view === "grid" && (
        <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
          <div className="grid grid-cols-5 divide-x divide-ink-200">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="min-w-0">
                <div className="border-b border-ink-200 bg-ink-100/40 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {DAYS[d].short}
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {entriesByDay[d].length === 0 ? (
                    <p className="py-4 text-center text-xs text-ink-400">
                      No classes
                    </p>
                  ) : (
                    entriesByDay[d].map((e) => (
                      <div
                        key={e.id}
                        className="rounded-lg border border-brand-200 bg-brand-50/60 p-2"
                      >
                        <p className="text-xs font-semibold text-ink-900">
                          {formatTime(e.start_time)}–{formatTime(e.end_time)}
                        </p>
                        <Link
                          to={`/admin/courses/${e.class_course?.id}`}
                          className="focus-ring block truncate text-xs font-medium text-brand-700 hover:underline"
                        >
                          {e.class_course?.name}
                        </Link>
                        <p className="truncate text-[10px] text-ink-500">
                          {e.class_course?.teacher?.full_name || "—"}
                        </p>
                        {e.room && (
                          <p className="truncate text-[10px] text-ink-500">
                            📍 {e.room}
                          </p>
                        )}
                        <div className="mt-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(e)}
                            className="focus-ring rounded p-1 text-ink-500 hover:bg-white hover:text-ink-900"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(e)}
                            disabled={isDeactivating}
                            className="focus-ring rounded p-1 text-ink-500 hover:bg-white hover:text-danger-700"
                            title="Deactivate"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !isError && entries.length > 0 && view === "list" && (
        <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
          <table className="w-full">
            <thead className="border-b border-ink-200 bg-ink-100/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Day
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Teacher
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Room
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
                >
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{e.day_label || DAYS[e.day_of_week]?.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-900">
                    {formatTime(e.start_time)}–{formatTime(e.end_time)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/courses/${e.class_course?.id}`}
                      className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                    >
                      {e.class_course?.name}
                    </Link>
                    <p className="truncate text-xs text-ink-500">
                      {e.class_course?.subject}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">
                    {e.class_course?.teacher?.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">
                    {e.room || <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(e)}
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeactivate(e)}
                        disabled={isDeactivating}
                      >
                        <Trash2 size={14} />
                        Deactivate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
