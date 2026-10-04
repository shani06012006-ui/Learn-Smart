// frontend/src/features/admin/pages/AdminTeacherDetailPage.jsx
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Building2, Calendar, Clock, BookOpen, UserX } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
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

  const { data: teacher, isLoading, isError, error, refetch } = useGetAdminUserQuery(id);
  const { data: classesData, isLoading: classesLoading } = useGetAdminUserClassesQuery(id, { skip: !teacher });

  const classes = classesData?.results || [];

  if (isLoading) return <LoadingState label="Loading teacher..." />;

  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  if (!teacher) return null;

  // Guard: this page is only for teachers.
  if (teacher.role !== "teacher") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate("/admin/teachers")}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
        >
          <ArrowLeft size={13} />
          Back to teachers
        </button>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
            <UserX size={22} />
          </span>
          <p className="font-display text-base font-extrabold text-navy-950">
            Not a teacher
          </p>
          <p className="max-w-md text-sm text-slate-500">
            This account is not a teacher. Open the Users page to manage it.
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
        onClick={() => navigate("/admin/teachers")}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
      >
        <ArrowLeft size={13} />
        Back to teachers
      </button>

      {/* Header card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-400" />

        <div className="p-6">
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
              <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-navy-950">
                {teacher.full_name || "—"}
              </h1>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {teacher.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="success">teacher</Badge>
                <Badge variant={teacher.is_active ? "success" : "danger"} dot>
                  {teacher.is_active ? "Active" : "Inactive"}
                </Badge>
                {teacher.institution?.name && (
                  <span className="text-xs font-semibold text-slate-400">
                    {teacher.institution.name}
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
          <Fact icon={Mail} label="Email" value={teacher.email} />
          <Fact icon={Building2} label="Institution" value={teacher.institution?.name || "—"} />
          <Fact icon={Calendar} label="Joined" value={formatDateTime(teacher.created_at)} />
          <Fact icon={Clock} label="Last seen" value={formatDateTime(teacher.last_seen_at)} />
        </div>
      </section>

      {/* Classes taught */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
            Classes taught
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {classes.length} total
          </span>
        </header>

        {classesLoading ? (
          <div className="p-5">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <BookOpen size={22} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No classes yet</p>
            <p className="text-xs text-slate-400">
              This teacher hasn't created any classes.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {classes.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen size={15} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/courses/${c.id}`}
                    className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
                  >
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-slate-400">
                    {c.subject} · {c.student_count ?? 0} student
                    {c.student_count === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge variant={c.is_archived ? "neutral" : "success"} dot>
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
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">{value}</p>
      </div>
    </div>
  );
}