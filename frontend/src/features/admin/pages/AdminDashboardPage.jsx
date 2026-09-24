import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  UserX,
  Archive,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import StatCard from "../components/StatCard";
import WelcomeBanner from "../components/WelcomeBanner";
import QuickActions from "../components/QuickActions";
import UserRolesChart from "../components/UserRolesChart";
import ClassStatusChart from "../components/ClassStatusChart";
import RecentUsersTable from "../components/RecentUsersTable";
import RecentCoursesTable from "../components/RecentCoursesTable";
import {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useGetAdminCoursesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const RECENT_LIMIT = 5;

export default function AdminDashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
    refetch: refetchStats,
  } = useGetAdminStatsQuery();

  const {
    data: usersData,
    isLoading: usersLoading,
  } = useGetAdminUsersQuery({ page: 1 });

  const {
    data: coursesData,
    isLoading: coursesLoading,
  } = useGetAdminCoursesQuery({ page: 1 });

  if (statsLoading) return <LoadingState label="Loading dashboard..." />;

  if (statsError) {
    return (
      <ErrorState
        message={extractErrorMessage(statsErr)}
        onRetry={refetchStats}
      />
    );
  }

  const activeClasses = (stats.classes_total || 0) - (stats.classes_archived || 0);
  const recentUsers = (usersData?.results || []).slice(0, RECENT_LIMIT);
  const recentCourses = (coursesData?.results || []).slice(0, RECENT_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total users"
          value={stats.users_total}
          tone="brand"
        />
        <StatCard
          icon={GraduationCap}
          label="Teachers"
          value={stats.users_teachers}
          tone="success"
        />
        <StatCard
          icon={UserCheck}
          label="Students"
          value={stats.users_students}
          tone="brand"
        />
        <StatCard
          icon={BookOpen}
          label="Active classes"
          value={activeClasses}
          tone="warning"
          sub={`${stats.classes_archived || 0} archived`}
        />
        <StatCard
          icon={UserCheck}
          label="Active enrollments"
          value={stats.enrollments_active}
          tone="success"
        />
        <StatCard
          icon={UserX}
          label="Inactive accounts"
          value={stats.users_inactive}
          tone="danger"
        />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UserRolesChart stats={stats} />
        <ClassStatusChart stats={stats} />
      </div>

      {/* Recent lists row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {usersLoading ? (
          <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
            <div className="h-40 animate-pulse rounded bg-ink-100" />
          </div>
        ) : (
          <RecentUsersTable users={recentUsers} />
        )}

        {coursesLoading ? (
          <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
            <div className="h-40 animate-pulse rounded bg-ink-100" />
          </div>
        ) : (
          <RecentCoursesTable courses={recentCourses} />
        )}
      </div>
    </div>
  );
}