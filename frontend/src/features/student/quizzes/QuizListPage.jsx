import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";

import { useGetAllQuizzesQuery } from "../../../store/api/examsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import QuizCard from "./components/QuizCard";

export default function QuizListPage() {
  const { data: quizzes, isLoading, isError, error, refetch } = useGetAllQuizzesQuery();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Quizzes</h1>
        <p className="mt-1 text-sm text-ink-500">
          Published quizzes across all your classes.
        </p>
      </div>

      {isLoading && <LoadingState label="Loading quizzes..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && quizzes?.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No quizzes available"
          description="When your teachers publish quizzes for your classes, they'll appear here."
          action={
            <Link to="/student/classes" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Go to My Classes
            </Link>
          }
        />
      )}

      {!isLoading && !isError && quizzes?.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
