// frontend/src/features/admin/pages/AdminCourseDetailPage.jsx
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Archive, ArchiveRestore, BookOpen,
  GraduationCap, UserCheck, Users,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import CreateCourseModal from "../components/CreateCourseModal";
import {
  useGetAdminCourseQuery,
  useGetAdminCourseStudentsQuery,
  useUpdateAdminCourseMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const ENROLLMENT_STATUS_VARIANT = {
  active: "success",
  pending: "warning",
  blocked: "danger",
  removed: "neutral",
};

/* Subject → gradient (matches the card grid on the courses list) */
const SUBJECT_GRADIENTS = {
  "Mathematics":      "from-purple-500 to-purple-700",
  "Science":          "from-emerald-500 to-teal-600",
  "English":          "from-coral-500 to-coral-700",
  "History":          "from-amber-500 to-coral-600",
  "Physics":          "from-purple-500 to-coral-500",
  "Chemistry":        "from-teal-500 to-emerald-700",
  "Biology":          "from-emerald-500 to-purple-500",
  "Computer Science": "from-purple-500 to-purple-700",
  "Geography":        "from-amber-500 to-coral-500",
};

const FALLBACK_GRADIENTS = [
  "from-purple-500 to-purple-700",
  "from-coral-500 to-coral-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-coral-500",
  "from-teal-500 to-emerald-700",
  "from-purple-500 to-coral-500",
];

function gradientForSubject(subject) {
  if (!subject) return FALLBACK_GRADIENTS[0];
  if (SUBJECT_GRADIENTS[subject]) return SUBJECT_GRADIENTS[subject];
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return FALLBACK_GRADIENTS[h % FALLBACK_GRADIENTS.length];
}

export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [updateCourse, { isLoading: isTogglingArchive }] = useUpdateAdminCourseMutation();

  const { data: course, isLoading, isError, error, refetch } = useGetAdminCourseQuery(id);
  const { data: studentsData, isLoading: studentsLoading } = useGetAdminCourseStudentsQuery(id, { skip: !course });

  const students = studentsData?.results || [];

  const handleArchiveToggle = async () => {
    if (!course) return;
    try {
      await updateCourse({
        id: course.id,
        is_archived: !course.is_archived,
      }).unwrap();
      refetch();
    } catch {
      // Silent — badge reflects server on refetch.
    }
  };

  if (isLoading) return <LoadingState label="Loading course..." />;

  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  if (!course) return null;

  const gradient = gradientForSubject(course.subject);

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/courses")}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
      >
        <ArrowLeft size={13} />
        Back to courses
      </button>

      {/* Header card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {/* Gradient bar matching the course's subject */}
        <div className={`h-1 bg-gradient-to-r ${gradient}`} />

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-elevated`}>
                <BookOpen size={24} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-navy-950">
                  {course.name}
                </h1>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {course.subject}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={course.is_archived ? "neutral" : "success"} dot>
                    {course.is_archived ? "Archived" : "Active"}
                  </Badge>
                  {course.institution?.name && (
                    <span className="text-xs font-semibold text-slate-400">
                      {course.institution.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={13} />
                Edit
              </Button>
              <Button
                variant={course.is_archived ? "primary" : "secondary"}
                disabled={isTogglingArchive}
                loading={isTogglingArchive}
                onClick={handleArchiveToggle}
              >
                {course.is_archived ? (
                  <>
                    <ArchiveRestore size={13} />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive size={13} />
                    Archive
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-600">
              {course.description}
            </p>
          )}

          {/* Profile facts */}
          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <Fact icon={GraduationCap} label="Teacher" value={course.teacher?.full_name || "Unassigned"} />
            <Fact icon={Users} label="Active students" value={course.student_count ?? 0} />
            <Fact icon={UserCheck} label="Institution" value={course.institution?.name || "—"} />
          </div>
        </div>
      </section>

      {/* Enrolled students */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
            Enrolled students
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {students.length} total
          </span>
        </header>

        {studentsLoading ? (
          <div className="p-5">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users size={22} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No students enrolled yet</p>
            <p className="text-xs text-slate-400">
              Students appear here once they join using the class code.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {students.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60"
              >
                <Avatar
                  userId={row.student.id}
                  initials={
                    (row.student.full_name || row.student.email || "?")
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase() || "?"
                  }
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/users/${row.student.id}`}
                    className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
                  >
                    {row.student.full_name || "—"}
                  </Link>
                  <p className="truncate text-xs text-slate-400">
                    {row.student.email}
                  </p>
                </div>
                <Badge variant={ENROLLMENT_STATUS_VARIANT[row.status] || "neutral"} dot>
                  {row.status}
                </Badge>
                <Badge variant={row.student.is_active ? "success" : "danger"} dot>
                  {row.student.is_active ? "Active" : "Inactive"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateCourseModal
        open={editOpen}
        course={course}
        onClose={() => {
          setEditOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">{value}</p>
      </div>
    </div>
  );
}