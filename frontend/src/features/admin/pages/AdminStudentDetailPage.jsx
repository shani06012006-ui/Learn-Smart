// frontend/src/features/admin/pages/AdminStudentDetailPage.jsx
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, GraduationCap, Building2, Calendar, Clock,
  MapPin, ClipboardCheck, BookOpen, UserX,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
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

  const { data: student, isLoading, isError, error, refetch } = useGetAdminUserQuery(id);
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useGetAdminUserEnrollmentsQuery(id, { skip: !student });

  const enrollments = enrollmentsData?.results || [];

  if (isLoading) return <LoadingState label="Loading student..." />;

  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  if (!student) return null;

  // Guard: this page is only for students.
  if (student.role !== "student") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate("/admin/students")}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
        >
          <ArrowLeft size={13} />
          Back to students
        </button>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
            <UserX size={22} />
          </span>
          <p className="font-display text-base font-extrabold text-navy-950">
            Not a student
          </p>
          <p className="max-w-md text-sm text-slate-500">
            This account is not a student. Open the Users page to manage it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/students")}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
      >
        <ArrowLeft size={13} />
        Back to students
      </button>

      {/* Header card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="h-1 bg-gradient-to-r from-coral-400 via-coral-500 to-purple-500" />

        <div className="p-6">
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
              <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-navy-950">
                {student.full_name || "—"}
              </h1>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {student.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="neutral">student</Badge>
                <Badge variant={student.is_active ? "success" : "danger"} dot>
                  {student.is_active ? "Active" : "Inactive"}
                </Badge>
                {student.institution?.name && (
                  <span className="text-xs font-semibold text-slate-400">
                    {student.institution.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile facts */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="mb-5 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Profile
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={Mail} label="Email" value={student.email} />
          <Fact icon={Building2} label="Institution" value={student.institution?.name || "—"} />
          <Fact icon={Calendar} label="Joined" value={formatDateTime(student.created_at)} />
          <Fact icon={Clock} label="Last seen" value={formatDateTime(student.last_seen_at)} />
        </div>
      </section>

      {/* Address placeholder */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Address
        </h2>
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <MapPin size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-600">
              ZIP / postal code not set
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Editing this field will be available in a future release.
            </p>
          </div>
        </div>
      </section>

      {/* Attendance placeholder */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Attendance
        </h2>
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <ClipboardCheck size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-600">
              Attendance is not tracked yet
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              This will populate once attendance records are added to the platform.
            </p>
          </div>
        </div>
      </section>

      {/* Enrolled classes */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
            Enrolled classes
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {enrollments.length} total
          </span>
        </header>

        {enrollmentsLoading ? (
          <div className="p-5">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <BookOpen size={22} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Not enrolled in any class</p>
            <p className="text-xs text-slate-400">
              This student has not joined a class yet.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {enrollments.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen size={15} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  {e.class_course?.id ? (
                    <Link
                      to={`/admin/courses/${e.class_course.id}`}
                      className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
                    >
                      {e.class_course.name}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-bold text-navy-950">
                      {e.class_course?.name || "—"}
                    </p>
                  )}
                  <p className="truncate text-xs text-slate-400">
                    {e.class_course?.subject}
                    {e.class_course?.teacher?.full_name ? ` · ${e.class_course.teacher.full_name}` : ""}
                  </p>
                </div>
                <Badge variant={ENROLLMENT_STATUS_VARIANT[e.status] || "neutral"} dot>
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
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">{value}</p>
      </div>
    </div>
  );
}