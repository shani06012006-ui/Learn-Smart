// frontend/src/features/admin/pages/AdminDashboardPage.jsx
import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  UserX,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import StatCard from "../components/StatCard";
import WelcomeBanner from "../components/WelcomeBanner";
import QuickActions from "../components/QuickActions";
import UserRolesChart from "../components/UserRolesChart";
import ClassStatusChart from "../components/ClassStatusChart";
import PerformanceTrendCard from "../components/PerformanceTrendCard";
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

  const { data: usersData, isLoading: usersLoading } = useGetAdminUsersQuery({ page: 1 });
  const { data: coursesData, isLoading: coursesLoading } = useGetAdminCoursesQuery({ page: 1 });

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
          tone="purple"
        />
        <StatCard
          icon={GraduationCap}
          label="Teachers"
          value={stats.users_teachers}
          tone="mint"
        />
        <StatCard
          icon={UserCheck}
          label="Students"
          value={stats.users_students}
          tone="purple"
        />
        <StatCard
          icon={BookOpen}
          label="Active classes"
          value={activeClasses}
          tone="amber"
          sub={`${stats.classes_archived || 0} archived`}
        />
        <StatCard
          icon={UserCheck}
          label="Active enrollments"
          value={stats.enrollments_active}
          tone="mint"
        />
        <StatCard
          icon={UserX}
          label="Inactive accounts"
          value={stats.users_inactive}
          tone="coral"
        />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UserRolesChart stats={stats} />
        <PerformanceTrendCard />
      </div>

      {/* Recent lists row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {usersLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <RecentUsersTable users={recentUsers} />
        )}

        {coursesLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <RecentCoursesTable courses={recentCourses} />
        )}
      </div>
    </div>
  );
}