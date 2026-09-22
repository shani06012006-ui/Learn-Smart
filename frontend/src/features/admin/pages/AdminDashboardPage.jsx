import { Users, GraduationCap, BookOpen, UserCheck, UserX } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import StatCard from "../components/StatCard";
import { useGetAdminStatsQuery } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useGetAdminStatsQuery();

  if (isLoading) return <LoadingState label="Loading dashboard..." />;
  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {data.is_superuser_view
            ? "Platform-wide overview across every institution."
            : `Overview for ${data.institution?.name || "your institution"}.`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total users"
          value={data.users_total}
          tone="brand"
        />
        <StatCard
          icon={GraduationCap}
          label="Teachers"
          value={data.users_teachers}
          tone="success"
        />
        <StatCard
          icon={UserCheck}
          label="Students"
          value={data.users_students}
          tone="brand"
        />
        <StatCard
          icon={BookOpen}
          label="Active classes"
          value={data.classes_total - data.classes_archived}
          tone="warning"
          sub={`${data.classes_archived} archived`}
        />
        <StatCard
          icon={UserCheck}
          label="Active enrollments"
          value={data.enrollments_active}
          tone="success"
        />
        <StatCard
          icon={UserX}
          label="Inactive accounts"
          value={data.users_inactive}
          tone="danger"
        />
      </div>
    </div>
  );
}