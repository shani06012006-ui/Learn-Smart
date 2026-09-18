import { useGetStudentPerformanceQuery } from "../../../store/api/performanceApi";
import { extractErrorMessage } from "../../../utils/apiError";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import EmptyState from "../../../components/feedback/EmptyState";
import { Trophy } from "lucide-react";
import OverallSummaryCard from "./components/OverallSummaryCard";
import TopicsCard from "./components/TopicsCard";
import TrendsChart from "./components/TrendsChart";
import RecentAssessmentsTable from "./components/RecentAssessmentsTable";

export default function PerformancePage() {
  const { data, isLoading, isError, error, refetch } = useGetStudentPerformanceQuery();

  const hasAnyData =
    data &&
    (data.recent_assessments.length > 0 ||
      data.trends.length > 0 ||
      data.strong_topics.length > 0 ||
      data.weak_topics.length > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">My Performance</h1>
        <p className="mt-1 text-sm text-ink-500">
          Track your marks, accuracy, and topic-wise progress over time.
        </p>
      </div>

      {isLoading && <LoadingState label="Analyzing your performance..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {data && !hasAnyData && (
        <EmptyState
          icon={Trophy}
          title="No performance data yet"
          description="Once you complete your first assessment, your marks, accuracy, and topics will show up here."
        />
      )}

      {data && hasAnyData && (
        <div className="flex flex-col gap-5">
          <OverallSummaryCard overall={data.overall} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <TopicsCard
              strongTopics={data.strong_topics}
              weakTopics={data.weak_topics}
            />
            <TrendsChart trends={data.trends} />
          </div>

          <RecentAssessmentsTable assessments={data.recent_assessments} />
        </div>
      )}
    </div>
  );
}
