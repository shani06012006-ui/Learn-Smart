import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  BookOpen,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Plus,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
  X,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import StatCard from "../components/StatCard";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import GradeFormModal from "../components/GradeFormModal";
import AddStudentToGradeModal from "../components/AddStudentToGradeModal";
import AttachClassToGradeModal from "../components/AttachClassToGradeModal";
import {
  useGetGradeQuery,
  useGetAdminUsersQuery,
  useGetAdminCoursesQuery,
  useDeleteGradeMutation,
  useUpdateAdminUserMutation,
  useUpdateAdminCourseMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const TABS = [
  { id: "students", label: "Students", icon: Users },
  { id: "classes",  label: "Classes",  icon: BookOpen },
];

function initialsOf(name) {
  const parts = (name || "").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/* Row ⋯ menu */
function RowMenu({ items }) {
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
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
        aria-label="Row actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg">
          {items.map(({ label, icon: Icon, onClick, tone = "default" }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={
                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition " +
                (tone === "danger"
                  ? "text-coral-600 hover:bg-coral-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-navy-950")
              }
            >
              {Icon && <Icon size={13} />}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminGradeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("students");
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [addStudentsOpen, setAddStudentsOpen] = useState(false);
  const [attachClassOpen, setAttachClassOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const {
    data: grade,
    isLoading: gradeLoading,
    isError: gradeError,
    error: gradeErr,
    refetch: refetchGrade,
  } = useGetGradeQuery(id);

  const {
    data: studentsData,
    isLoading: studentsLoading,
    refetch: refetchStudents,
  } = useGetAdminUsersQuery(
    { role: "student", grade: id },
    { skip: !grade },
  );

  const {
    data: coursesData,
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useGetAdminCoursesQuery({ grade: id }, { skip: !grade });

  const [deleteGrade, { isLoading: deleting }] = useDeleteGradeMutation();
  const [updateUser] = useUpdateAdminUserMutation();
  const [updateCourse] = useUpdateAdminCourseMutation();

  const students = studentsData?.results ?? studentsData ?? [];
  const courses = coursesData?.results ?? coursesData ?? [];

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q),
    );
  }, [students, search]);

  function promptDelete() {
    setConfirm({
      title: `Delete "${grade.name}"?`,
      description:
        "The grade will be removed. Any students or classes currently assigned must be reassigned first.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteGrade(grade.id).unwrap();
          navigate("/admin/grades", { replace: true });
        } catch (err) {
          console.error("delete grade failed", err);
        }
        setConfirm(null);
      },
    });
  }

  function promptRemoveStudent(student) {
    setConfirm({
      title: `Remove ${student.full_name || student.email} from this grade?`,
      description:
        "They will no longer be assigned to this grade. Their existing class enrollments remain.",
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: async () => {
        try {
          await updateUser({ id: student.id, grade_id: null }).unwrap();
          refetchStudents();
          refetchGrade();
        } catch (err) {
          console.error("remove student failed", err);
        }
        setConfirm(null);
      },
    });
  }

  function promptDetachClass(course) {
    setConfirm({
      title: `Detach "${course.name}" from this grade?`,
      description:
        "The class will no longer be linked to this grade. Existing enrollments are unaffected.",
      confirmLabel: "Detach",
      tone: "danger",
      onConfirm: async () => {
        try {
          await updateCourse({ id: course.id, grade_id: null }).unwrap();
          refetchCourses();
          refetchGrade();
        } catch (err) {
          console.error("detach class failed", err);
        }
        setConfirm(null);
      },
    });
  }

  if (gradeLoading) return <LoadingState label="Loading grade..." />;
  if (gradeError) {
    return <ErrorState message={extractErrorMessage(gradeErr)} onRetry={refetchGrade} />;
  }
  if (!grade) return null;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate("/admin/grades")}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
      >
        <ArrowLeft size={13} />
        Back to grades
      </button>

      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 font-display text-xl font-extrabold text-white shadow-elevated">
              {grade.level}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-navy-950">
                {grade.name}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Level {grade.level} · {grade.student_count || 0} student
                {(grade.student_count || 0) === 1 ? "" : "s"} ·{" "}
                {grade.class_count || 0} class
                {(grade.class_count || 0) === 1 ? "" : "es"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={grade.is_active ? "success" : "neutral"} dot>
                  {grade.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil size={13} />
              Edit grade
            </Button>
            <Button variant="danger" onClick={promptDelete}>
              <Trash2 size={13} />
              Delete
            </Button>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={Users}
          label="Students in this grade"
          value={grade.student_count ?? students.length}
          tone="purple"
        />
        <StatCard
          icon={BookOpen}
          label="Classes in this grade"
          value={grade.class_count ?? courses.length}
          tone="mint"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button
              key={tid}
              type="button"
              onClick={() => setTab(tid)}
              className={
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors " +
                (tab === tid
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-slate-500 hover:text-navy-950")
              }
            >
              <Icon size={15} />
              {label}
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                {tid === "students" ? students.length : courses.length}
              </span>
            </button>
          ))}
        </div>

        <div className="pb-2">
          {tab === "students" && (
            <Button variant="primary" size="sm" onClick={() => setAddStudentsOpen(true)}>
              <Plus size={14} />
              Add students
            </Button>
          )}
          {tab === "classes" && (
            <Button variant="primary" size="sm" onClick={() => setAttachClassOpen(true)}>
              <Plus size={14} />
              Attach class
            </Button>
          )}
        </div>
      </div>

      {/* Students tab */}
      {tab === "students" && (
        <>
          {students.length > 0 && (
            <div className="relative max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400"
              />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
            {studentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-slate-300" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
                  <Users size={26} />
                </span>
                <p className="text-sm font-semibold text-navy-950">
                  No students in this grade yet
                </p>
                <p className="text-xs text-slate-400">
                  Assign students to this grade to see them here.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAddStudentsOpen(true)}
                  className="mt-1"
                >
                  <Plus size={14} />
                  Add students
                </Button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No students match your search.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
                  >
                    <Avatar
                      userId={s.id}
                      initials={initialsOf(s.full_name || s.email)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/admin/users/${s.id}`}
                        className="block truncate text-sm font-bold text-navy-950 hover:text-purple-500"
                      >
                        {s.full_name || s.email}
                      </Link>
                      <p className="truncate text-[11px] text-slate-400">
                        {s.email}
                      </p>
                    </div>
                    <Badge variant={s.is_active ? "success" : "danger"} dot>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <RowMenu
                      items={[
                        {
                          label: "Remove from grade",
                          icon: X,
                          tone: "danger",
                          onClick: () => promptRemoveStudent(s),
                        },
                      ]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Classes tab */}
      {tab === "classes" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          {coursesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
                <BookOpen size={26} />
              </span>
              <p className="text-sm font-semibold text-navy-950">
                No classes attached to this grade
              </p>
              <p className="text-xs text-slate-400">
                Attach a class to this grade to see it here.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAttachClassOpen(true)}
                className="mt-1"
              >
                <Plus size={14} />
                Attach class
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {courses.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <BookOpen size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/courses/${c.id}`}
                      className="block truncate text-sm font-bold text-navy-950 hover:text-purple-500"
                    >
                      {c.name}
                    </Link>
                    <p className="truncate text-[11px] text-slate-400">
                      {c.subject}
                      {c.teacher?.full_name && ` · ${c.teacher.full_name}`}
                    </p>
                  </div>
                  <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
                    {c.student_count ?? 0} student{(c.student_count ?? 0) === 1 ? "" : "s"}
                  </span>
                  <Badge variant={c.is_archived ? "neutral" : "success"}>
                    {c.is_archived ? "Archived" : "Active"}
                  </Badge>
                  <RowMenu
                    items={[
                      {
                        label: "Detach from grade",
                        icon: X,
                        tone: "danger",
                        onClick: () => promptDetachClass(c),
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <GradeFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        grade={grade}
        onSuccess={() => refetchGrade()}
      />

      <AddStudentToGradeModal
        open={addStudentsOpen}
        onClose={() => setAddStudentsOpen(false)}
        gradeId={grade.id}
        onSuccess={() => {
          refetchStudents();
          refetchGrade();
        }}
      />

      <AttachClassToGradeModal
        open={attachClassOpen}
        onClose={() => setAttachClassOpen(false)}
        gradeId={grade.id}
        onSuccess={() => {
          refetchCourses();
          refetchGrade();
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        loading={deleting}
      />
    </div>
  );
}
