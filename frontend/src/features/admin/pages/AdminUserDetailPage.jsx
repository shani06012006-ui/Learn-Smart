// frontend/src/features/admin/pages/AdminUserDetailPage.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const [toggleActive, { isLoading: isToggling }] = useToggleAdminUserActiveMutation();

  const { data: user, isLoading, isError, error, refetch } = useGetAdminUserQuery(id);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  const { data: classesData, isLoading: classesLoading } = useGetAdminUserClassesQuery(id, { skip: !isTeacher });
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useGetAdminUserEnrollmentsQuery(id, { skip: !isStudent });

  const isSelf = user?.id === currentUser?.id;

  const classes = useMemo(() => classesData?.results || [], [classesData]);
  const enrollments = useMemo(() => enrollmentsData?.results || [], [enrollmentsData]);

  const handleToggleActive = async () => {
    if (!user || isSelf) return;
    try {
      await toggleActive({ id: user.id, is_active: !user.is_active }).unwrap();
      refetch();
    } catch {
      // Silent — badge reflects server state on refetch.
    }
  };

  if (isLoading) return <LoadingState label="Loading user..." />;

  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/users")}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
      >
        <ArrowLeft size={13} />
        Back to users
      </button>

      {/* Header card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-coral-400" />

        <div className="p-6">
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
                <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-navy-950">
                  {user.full_name || "—"}
                </h1>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {user.email}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={ROLE_VARIANT[user.role] || "neutral"}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.is_active ? "success" : "danger"} dot>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {user.institution?.name && (
                    <span className="text-xs font-semibold text-slate-400">
                      {user.institution.name}
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
                variant={user.is_active ? "secondary" : "primary"}
                disabled={isSelf || isToggling}
                loading={isToggling}
                onClick={handleToggleActive}
                title={isSelf ? "You cannot change your own status" : ""}
              >
                {user.is_active ? (
                  <>
                    <ShieldOff size={13} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Shield size={13} />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Facts */}
          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <Fact icon={Mail} label="Email" value={user.email} />
            <Fact icon={GraduationCap} label="Role" value={user.role} />
            <Fact icon={UserCheck} label="Institution" value={user.institution?.name || "—"} />
            <Fact
              icon={Calendar}
              label="Joined"
              value={
                user.created_at
                  ? new Date(user.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"
              }
            />
          </div>
        </div>
      </section>

      {/* Teacher — classes */}
      {isTeacher && (
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
                    <p className="truncate text-sm font-bold text-navy-950">{c.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {c.subject} · {c.student_count ?? 0} student{c.student_count === 1 ? "" : "s"}
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
      )}

      {/* Student — enrollments */}
      {isStudent && (
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
              <p className="text-sm font-semibold text-slate-500">No enrollments yet</p>
              <p className="text-xs text-slate-400">
                This student hasn't joined any classes.
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
                    <p className="truncate text-sm font-bold text-navy-950">
                      {e.class_course?.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {e.class_course?.subject}
                      {e.class_course?.teacher?.full_name
                        ? ` · ${e.class_course.teacher.full_name}`
                        : ""}
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
      )}

      {/* Admin — informational */}
      {user.role === "admin" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
              <UserX size={22} />
            </span>
            <p className="mt-2 font-display text-base font-extrabold text-navy-950">
              Administrator account
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Admins manage users and courses across the institution. No class
              or enrollment data applies.
            </p>
          </div>
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
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">{value}</p>
      </div>
    </div>
  );
}