import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Archive,
  ArchiveRestore,
  BookOpen,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
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

export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [updateCourse, { isLoading: isTogglingArchive }] =
    useUpdateAdminCourseMutation();

  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminCourseQuery(id);

  const {
    data: studentsData,
    isLoading: studentsLoading,
  } = useGetAdminCourseStudentsQuery(id, { skip: !course });

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
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  if (!course) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/courses")}
        className="focus-ring inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={14} />
        Back to courses
      </button>

      {/* Header card */}
      <section className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <BookOpen size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900">
                {course.name}
              </h1>
              <p className="mt-0.5 truncate text-sm text-ink-500">
                {course.subject}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant={course.is_archived ? "neutral" : "success"}
                  dot
                >
                  {course.is_archived ? "Archived" : "Active"}
                </Badge>
                {course.institution?.name && (
                  <span className="text-xs text-ink-500">
                    {course.institution.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setEditOpen(true)}
            >
              <Pencil size={14} />
              Edit
            </Button>
            <Button
              variant="secondary"
              disabled={isTogglingArchive}
              loading={isTogglingArchive}
              onClick={handleArchiveToggle}
            >
              {course.is_archived ? (
                <>
                  <ArchiveRestore size={14} />
                  Restore
                </>
              ) : (
                <>
                  <Archive size={14} />
                  Archive
                </>
              )}
            </Button>
          </div>
        </div>

        {course.description && (
          <p className="mt-4 border-t border-ink-100 pt-4 text-sm text-ink-700">
            {course.description}
          </p>
        )}

        {/* Profile facts */}
        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <Fact
            icon={GraduationCap}
            label="Teacher"
            value={course.teacher?.full_name || "—"}
          />
          <Fact
            icon={Users}
            label="Active students"
            value={course.student_count ?? 0}
          />
          <Fact
            icon={UserCheck}
            label="Institution"
            value={course.institution?.name || "—"}
          />
        </dl>
      </section>

      {/* Enrolled students */}
      <section className="rounded-card border border-ink-200 bg-white shadow-card">
        <header className="flex items-center justify-between gap-2 border-b border-ink-200 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Enrolled students
          </h2>
          <span className="text-xs text-ink-500">
            {students.length} total
          </span>
        </header>

        {studentsLoading ? (
          <div className="p-5">
            <div className="h-20 animate-pulse rounded bg-ink-100" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Users}
              title="No students enrolled yet"
              message="Students appear here once they join using the class code."
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {students.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 px-5 py-3"
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
                    className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                  >
                    {row.student.full_name || "—"}
                  </Link>
                  <p className="truncate text-xs text-ink-500">
                    {row.student.email}
                  </p>
                </div>
                <Badge
                  variant={
                    ENROLLMENT_STATUS_VARIANT[row.status] || "neutral"
                  }
                  dot
                >
                  {row.status}
                </Badge>
                <Badge
                  variant={row.student.is_active ? "success" : "danger"}
                  dot
                >
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
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </dt>
        <dd className="truncate text-sm text-ink-900">{value}</dd>
      </div>
    </div>
  );
}