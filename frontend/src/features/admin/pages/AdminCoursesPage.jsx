// frontend/src/features/admin/pages/AdminCoursesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, X, BookOpen, Users, MoreVertical,
  Pencil, Archive, ArchiveRestore, UserCheck, Trash2, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Avatar from "../../../components/ui/Avatar";
import Button from "../../../components/ui/Button";
import Pager from "../../../components/ui/Pager";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import CreateCourseModal from "../components/CreateCourseModal";
import {
  useGetAdminCoursesQuery,
  useUpdateAdminCourseMutation,
  useDeleteAdminCourseMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

const STATUS_CHIPS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

/* ─────────────────────────────────────────────────────────────── */
/*  Card actions menu (⋯)                                          */
/* ─────────────────────────────────────────────────────────────── */
function CardMenu({ course, onEdit, onArchiveToggle, onDelete, busy }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Course actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-950"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy-950"
            >
              <Pencil size={13} />
              Edit course
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onArchiveToggle();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                course.is_archived
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-navy-950"
              } disabled:opacity-50`}
            >
              {course.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              {course.is_archived ? "Restore" : "Archive"}
            </button>

            <div className="my-1 h-px bg-gray-100" />

            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-coral-600 transition-colors hover:bg-coral-50 disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete course
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Course card — clean white surface, purple accents              */
/* ─────────────────────────────────────────────────────────────── */
function CourseCard({ course, onEdit, onArchiveToggle, onDelete, busy }) {
  const navigate = useNavigate();
  const teacherName =
    course.teacher?.full_name || course.teacher?.email || "Unassigned";
  const teacherInitials =
    (teacherName || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";
  const isArchived = course.is_archived;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => navigate(`/admin/courses/${course.id}`)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Top row: icon + actions */}
      <div className="flex items-start justify-between p-5 pb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
          <BookOpen size={18} strokeWidth={2.2} />
        </span>
        <CardMenu
          course={course}
          onEdit={() => onEdit(course)}
          onArchiveToggle={() => onArchiveToggle(course)}
          onDelete={() => onDelete(course)}
          busy={busy}
        />
      </div>

      {/* Title + subject pill */}
      <div className="px-5">
        {course.subject && (
          <span className="inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
            {course.subject}
          </span>
        )}
        <h3 className="mt-2 line-clamp-2 font-display text-base font-extrabold leading-snug text-navy-950 transition-colors group-hover:text-purple-600">
          {course.name}
        </h3>
        {course.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {course.description}
          </p>
        )}
      </div>

      {/* Teacher row */}
      <div className="mt-4 flex items-center gap-2.5 px-5">
        <Avatar
          userId={course.teacher?.id || course.id}
          initials={teacherInitials}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Teacher
          </p>
          <p className="truncate text-xs font-semibold text-navy-950">
            {teacherName}
          </p>
        </div>
      </div>

      {/* Footer: students + status */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 px-5 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Users size={12} className="text-slate-400" />
          {course.student_count ?? 0}{" "}
          {course.student_count === 1 ? "student" : "students"}
        </span>

        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 " +
            (isArchived
              ? "bg-slate-50 text-slate-600 ring-slate-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-100")
          }
        >
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (isArchived ? "bg-slate-400" : "bg-emerald-500")
            }
          />
          {isArchived ? "Archived" : "Active"}
        </span>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Stat card — unified purple tone                                */
/* ─────────────────────────────────────────────────────────────── */
function StatMini({ label, value, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold tabular-nums text-navy-950">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Delete confirmation                                            */
/* ─────────────────────────────────────────────────────────────── */
function DeleteConfirmModal({ course, onCancel, onConfirm, saving }) {
  return (
    <AnimatePresence>
      {course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-sm"
          onClick={() => !saving && onCancel()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-100"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
              <AlertTriangle size={22} />
            </span>
            <h3 className="mt-4 font-display text-lg font-extrabold text-navy-950">
              Delete this course?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              This will <strong className="text-coral-600">permanently delete</strong>{" "}
              the course, its enrolments, and any timetable entries linked to it.
              This action cannot be undone.
            </p>

            <div className="mt-4 rounded-xl border border-gray-100 bg-slate-50/60 p-4 text-xs">
              <p className="flex items-center gap-2">
                <BookOpen size={12} className="text-slate-400" />
                <span className="font-bold text-navy-950">Course:</span>
                <span className="truncate text-slate-600">{course.name}</span>
              </p>
              {course.subject && (
                <p className="mt-1 flex items-center gap-2">
                  <span className="font-bold text-navy-950">Subject:</span>
                  <span className="truncate text-slate-600">{course.subject}</span>
                </p>
              )}
              <p className="mt-1 flex items-center gap-2">
                <span className="font-bold text-navy-950">Students:</span>
                <span className="truncate text-slate-600">
                  {course.student_count ?? 0}
                </span>
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Tip: If you just want to hide it from the active list, use{" "}
              <strong className="text-slate-600">Archive</strong> instead.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onConfirm} loading={saving}>
                <Trash2 size={13} />
                Delete permanently
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Page                                                           */
/* ─────────────────────────────────────────────────────────────── */
export default function AdminCoursesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, subjectFilter, search]);

  const queryParams = { page };
  if (statusFilter === "active") queryParams.is_archived = false;
  if (statusFilter === "archived") queryParams.is_archived = true;
  if (subjectFilter) queryParams.subject = subjectFilter;
  if (search.trim()) queryParams.q = search.trim();

  const { data, isLoading, isError, error, refetch } =
    useGetAdminCoursesQuery(queryParams);
  const [updateCourse] = useUpdateAdminCourseMutation();
  const [deleteCourseMutation] = useDeleteAdminCourseMutation();

  const courses = data?.results || [];
  const count = data?.count || 0;

  const activeCount = courses.filter((c) => !c.is_archived).length;
  const archivedCount = courses.length - activeCount;

  const subjectOptions = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.subject) set.add(c.subject);
    });
    return Array.from(set).sort();
  }, [courses]);

  const handleCreate = () => {
    setEditCourse(null);
    setModalOpen(true);
  };

  const handleEdit = (course) => {
    setEditCourse(course);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditCourse(null);
  };

  const handleArchiveToggle = async (course) => {
    setBusyId(course.id);
    try {
      await updateCourse({
        id: course.id,
        is_archived: !course.is_archived,
      }).unwrap();
    } catch {
      // silent — tag invalidation refetches
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCourse) return;
    setDeleting(true);
    try {
      await deleteCourseMutation(deleteCourse.id).unwrap();
      setDeleteCourse(null);
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const hasAnyFilter = statusFilter || subjectFilter || search;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Courses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the courses taught on your platform.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={15} />
          Create course
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatMini label="Total Courses" value={count} icon={BookOpen} />
        <StatMini label="Active" value={activeCount} icon={UserCheck} />
        <StatMini label="Archived" value={archivedCount} icon={Archive} />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {STATUS_CHIPS.map((chip) => {
              const isActive = statusFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setStatusFilter(chip.value)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all " +
                    (isActive
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-purple-50 hover:text-purple-700")
                  }
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {subjectOptions.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <div className="relative min-w-[14rem] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course name or subject"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-950"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-block">
            {count} {count === 1 ? "course" : "courses"}
          </span>
        </div>
      </div>

      {/* States */}
      {isLoading && <LoadingState label="Loading courses..." />}
      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && courses.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500 ring-1 ring-purple-100">
            <BookOpen size={26} strokeWidth={2} />
          </span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">
            {hasAnyFilter ? "No courses match your filter" : "No courses yet"}
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            {hasAnyFilter
              ? "Try clearing filters or searching for something else."
              : "Create the first course and assign it to a teacher."}
          </p>
          {!hasAnyFilter && (
            <Button onClick={handleCreate} className="mt-2">
              <Plus size={15} />
              Create course
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={handleEdit}
                onArchiveToggle={handleArchiveToggle}
                onDelete={(c) => setDeleteCourse(c)}
                busy={busyId === course.id}
              />
            ))}
          </div>

          <Pager
            page={page}
            count={count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateCourseModal
        open={modalOpen}
        onClose={handleCloseModal}
        course={editCourse}
      />

      <DeleteConfirmModal
        course={deleteCourse}
        onCancel={() => !deleting && setDeleteCourse(null)}
        onConfirm={handleDeleteConfirm}
        saving={deleting}
      />
    </div>
  );
}