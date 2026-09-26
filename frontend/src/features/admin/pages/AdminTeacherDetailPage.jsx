import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetAdminUserQuery,
  useGetAdminUserClassesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

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

export default function AdminTeacherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: teacher,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminUserQuery(id);

  const { data: classesData, isLoading: classesLoading } =
    useGetAdminUserClassesQuery(id, { skip: !teacher });

  const classes = classesData?.results || [];

  if (isLoading) return <LoadingState label="Loading teacher..." />;

  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  if (!teacher) return null;

  // Guard: this page is only for teachers.
  if (teacher.role !== "teacher") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate("/admin/teachers")}
          className="focus-ring inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={14} />
          Back to teachers
        </button>
        <EmptyState
          title="Not a teacher"
          message="This account is not a teacher. Open the Users page to manage it."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/teachers")}
        className="focus-ring inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={14} />
        Back to teachers
      </button>

      {/* Header card */}
      <section className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar
            userId={teacher.id}
            initials={
              (teacher.full_name || teacher.email || "?")
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
              {teacher.full_name || "—"}
            </h1>
            <p className="mt-0.5 truncate text-sm text-ink-500">
              {teacher.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="success">teacher</Badge>
              <Badge
                variant={teacher.is_active ? "success" : "danger"}
                dot
              >
                {teacher.is_active ? "Active" : "Inactive"}
              </Badge>
              {teacher.institution?.name && (
                <span className="text-xs text-ink-500">
                  {teacher.institution.name}
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
          <Fact icon={Mail} label="Email" value={teacher.email} />
          <Fact
            icon={Building2}
            label="Institution"
            value={teacher.institution?.name || "—"}
          />
          <Fact
            icon={Calendar}
            label="Joined"
            value={formatDateTime(teacher.created_at)}
          />
          <Fact
            icon={Clock}
            label="Last seen"
            value={formatDateTime(teacher.last_seen_at)}
          />
        </dl>
      </section>

      {/* Classes taught */}
      <section className="rounded-card border border-ink-200 bg-white shadow-card">
        <header className="flex items-center justify-between gap-2 border-b border-ink-200 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Classes taught
          </h2>
          <span className="text-xs text-ink-500">
            {classes.length} total
          </span>
        </header>

        {classesLoading ? (
          <div className="p-5">
            <div className="h-20 animate-pulse rounded bg-ink-100" />
          </div>
        ) : classes.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={BookOpen}
              title="No classes yet"
              message="This teacher hasn't created any classes."
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <BookOpen size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/courses/${c.id}`}
                    className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-ink-500">
                    {c.subject} · {c.student_count ?? 0} student
                    {c.student_count === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge
                  variant={c.is_archived ? "neutral" : "success"}
                  dot
                >
                  {c.is_archived ? "Archived" : "Active"}
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