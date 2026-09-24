import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Shield,
  ShieldOff,
  Mail,
  GraduationCap,
  BookOpen,
  Calendar,
  UserCheck,
  UserX,
} from "lucide-react";
import { useSelector } from "react-redux";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import EditUserModal from "../components/EditUserModal";
import {
  useGetAdminUserQuery,
  useGetAdminUserClassesQuery,
  useGetAdminUserEnrollmentsQuery,
  useToggleAdminUserActiveMutation,
} from "../../../store/api/realApi";
import { selectAdminUser } from "../../../store/slices/adminAuthSlice";
import { extractErrorMessage } from "../../../utils/apiError";

const ROLE_VARIANT = {
  admin: "brand",
  teacher: "success",
  student: "neutral",
};

const ENROLLMENT_STATUS_VARIANT = {
  active: "success",
  pending: "warning",
  blocked: "danger",
  removed: "neutral",
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectAdminUser);

  const [editOpen, setEditOpen] = useState(false);
  const [toggleActive, { isLoading: isToggling }] =
    useToggleAdminUserActiveMutation();

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminUserQuery(id);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  const {
    data: classesData,
    isLoading: classesLoading,
  } = useGetAdminUserClassesQuery(id, { skip: !isTeacher });

  const {
    data: enrollmentsData,
    isLoading: enrollmentsLoading,
  } = useGetAdminUserEnrollmentsQuery(id, { skip: !isStudent });

  const isSelf = user?.id === currentUser?.id;

  const classes = useMemo(
    () => classesData?.results || [],
    [classesData]
  );
  const enrollments = useMemo(
    () => enrollmentsData?.results || [],
    [enrollmentsData]
  );

  const handleToggleActive = async () => {
    if (!user || isSelf) return;
    try {
      await toggleActive({
        id: user.id,
        is_active: !user.is_active,
      }).unwrap();
      refetch();
    } catch {
      // Silent — the badge reflects whatever the server returns on refetch.
    }
  };

  if (isLoading) return <LoadingState label="Loading user..." />;

  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/users")}
        className="focus-ring inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={14} />
        Back to users
      </button>

      {/* Header card */}
      <section className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar
              userId={user.id}
              initials={
                (user.full_name || user.email || "?")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase() || "?"
              }
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900">
                {user.full_name || "—"}
              </h1>
              <p className="mt-0.5 truncate text-sm text-ink-500">
                {user.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={ROLE_VARIANT[user.role] || "neutral"}>
                  {user.role}
                </Badge>
                <Badge variant={user.is_active ? "success" : "danger"} dot>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
                {user.institution?.name && (
                  <span className="text-xs text-ink-500">
                    {user.institution.name}
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
              variant={user.is_active ? "secondary" : "primary"}
              disabled={isSelf || isToggling}
              loading={isToggling}
              onClick={handleToggleActive}
              title={isSelf ? "You cannot change your own status" : ""}
            >
              {user.is_active ? (
                <>
                  <ShieldOff size={14} />
                  Deactivate
                </>
              ) : (
                <>
                  <Shield size={14} />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Profile facts */}
        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <Fact icon={Mail} label="Email" value={user.email} />
          <Fact
            icon={GraduationCap}
            label="Role"
            value={user.role}
          />
          <Fact
            icon={UserCheck}
            label="Institution"
            value={user.institution?.name || "—"}
          />
          <Fact
            icon={Calendar}
            label="Joined"
            value={
              user.created_at
                ? new Date(user.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"
            }
          />
        </dl>
      </section>

      {/* Role-specific section */}
      {isTeacher && (
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
                    <p className="truncate text-sm font-medium text-ink-900">
                      {c.name}
                    </p>
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
      )}

      {isStudent && (
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
                title="No enrollments yet"
                message="This student hasn't joined any classes."
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
                    <p className="truncate text-sm font-medium text-ink-900">
                      {e.class_course?.name}
                    </p>
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
      )}

      {/* Admin role — informational */}
      {user.role === "admin" && (
        <section className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
          <EmptyState
            icon={UserX}
            title="Administrator account"
            message="Admins manage users and courses across the institution. No class or enrollment data applies."
          />
        </section>
      )}

      <EditUserModal
        open={editOpen}
        user={user}
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