import { useAuth } from "../../../hooks/useAuth";
import { useGetTeacherDashboardAnalyticsQuery } from "../../../store/api/analyticsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import NeedsAttentionWidget from "./components/NeedsAttentionWidget";
import NeedsImprovementWidget from "./components/NeedsImprovementWidget";
import ImprovingWidget from "./components/ImprovingWidget";
import WeakTopicsWidget from "./components/WeakTopicsWidget";
import PerformanceTrendsWidget from "./components/PerformanceTrendsWidget";
import RecommendedActionsWidget from "./components/RecommendedActionsWidget";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useGetTeacherDashboardAnalyticsQuery();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">
          Welcome back, {user.first_name}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          AI-powered insights across your classes.
        </p>
      </div>

      {isLoading && <LoadingState label="Analyzing student performance..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {data && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <NeedsAttentionWidget students={data.needs_attention} />
          <ImprovingWidget students={data.improving} />
          <NeedsImprovementWidget students={data.needs_improvement} />
          <WeakTopicsWidget topics={data.weak_topics} />
          <PerformanceTrendsWidget trends={data.trends} />
          <RecommendedActionsWidget recommendations={data.recommendations} />
        </div>
      )}
    </div>
  );
}
