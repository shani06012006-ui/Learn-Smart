import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  GraduationCap,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ClipboardCheck,
  BookOpen,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetAdminUserQuery,
  useGetAdminUserEnrollmentsQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const ENROLLMENT_STATUS_VARIANT = {
  active: "success",
  pending: "warning",
  blocked: "danger",
  removed: "neutral",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminStudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: student,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminUserQuery(id);

  const { data: enrollmentsData, isLoading: enrollmentsLoading } =
    useGetAdminUserEnrollmentsQuery(id, { skip: !student });

  const enrollments = enrollmentsData?.results || [];

  if (isLoading) return <LoadingState label="Loading student..." />;

  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  if (!student) return null;

  // Guard: this page is only for students. If someone hits it with a
  // non-student ID, send them to the generic user page.
  if (student.role !== "student") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate("/admin/students")}
          className="focus-ring inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={14} />
          Back to students
        </button>
        <EmptyState
          title="Not a student"
          message="This account is not a student. Open the Users page to manage it."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/students")}
        className="focus-ring inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={14} />
        Back to students
      </button>

      {/* Header card */}
      <section className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar
            userId={student.id}
            initials={
              (student.full_name || student.email || "?")
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase() || "?"
            }
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900">
              {student.full_name || "—"}
            </h1>
            <p className="mt-0.5 truncate text-sm text-ink-500">
              {student.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="neutral">student</Badge>
              <Badge
                variant={student.is_active ? "success" : "danger"}
                dot
              >
                {student.is_active ? "Active" : "Inactive"}
              </Badge>
              {student.institution?.name && (
                <span className="text-xs text-ink-500">
                  {student.institution.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Profile facts */}
      <section className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Profile
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact icon={Mail} label="Email" value={student.email} />
          <Fact
            icon={Building2}
            label="Institution"
            value={student.institution?.name || "—"}
          />
          <Fact
            icon={Calendar}
            label="Joined"
            value={formatDateTime(student.created_at)}
          />
          <Fact
            icon={Clock}
            label="Last seen"
            value={formatDateTime(student.last_seen_at)}
          />
        </dl>
      </section>

      {/* ZIP / postal code — placeholder until backend field exists */}
      <section className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Address
        </h2>
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-ink-300 bg-ink-50/50 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
            <MapPin size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-700">
              ZIP / postal code not set
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Editing this field will be available in a future release.
            </p>
          </div>
        </div>
      </section>

      {/* Attendance — placeholder until backend model exists */}
      <section className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Attendance
        </h2>
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-ink-300 bg-ink-50/50 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
            <ClipboardCheck size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-700">
              Attendance is not tracked yet
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              This will populate once attendance records are added to the
              platform.
            </p>
          </div>
        </div>
      </section>

      {/* Enrolled classes */}
      <section className="rounded-card border border-ink-200 bg-white shadow-card">
        <header className="flex items-center justify-between gap-2 border-b border-ink-200 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Enrolled classes
          </h2>
          <span className="text-xs text-ink-500">
            {enrollments.length} total
          </span>
        </header>

        {enrollmentsLoading ? (
          <div className="p-5">
            <div className="h-20 animate-pulse rounded bg-ink-100" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={BookOpen}
              title="Not enrolled in any class"
              message="This student has not joined a class yet."
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {enrollments.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <BookOpen size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  {e.class_course?.id ? (
                    <Link
                      to={`/admin/courses/${e.class_course.id}`}
                      className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                    >
                      {e.class_course.name}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-medium text-ink-900">
                      {e.class_course?.name || "—"}
                    </p>
                  )}
                  <p className="truncate text-xs text-ink-500">
                    {e.class_course?.subject}
                    {e.class_course?.teacher?.full_name
                      ? ` · ${e.class_course.teacher.full_name}`
                      : ""}
                  </p>
                </div>
                <Badge
                  variant={
                    ENROLLMENT_STATUS_VARIANT[e.status] || "neutral"
                  }
                  dot
                >
                  {e.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
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