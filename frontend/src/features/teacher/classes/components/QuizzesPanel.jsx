import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, FileText } from "lucide-react";

import { useGetQuizzesForClassQuery } from "../../../../store/api/examsApi";
import { extractErrorMessage } from "../../../../utils/apiError";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import LoadingState from "../../../../components/feedback/LoadingState";
import EmptyState from "../../../../components/feedback/EmptyState";
import ErrorState from "../../../../components/feedback/ErrorState";
import CreateQuizModal from "./CreateQuizModal";

export default function QuizzesPanel({ classId }) {
  const { data: quizzes, isLoading, isError, error, refetch } =
    useGetQuizzesForClassQuery(classId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Quizzes</h2>
          <p className="text-xs text-ink-500">
            Create assessments and manage their questions.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Create quiz
        </Button>
      </div>

      {isLoading && <LoadingState label="Loading quizzes..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && quizzes?.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No quizzes yet"
          description="Create your first quiz to start adding questions."
          action={<Button onClick={() => setCreateOpen(true)}>Create quiz</Button>}
        />
      )}

      {!isLoading && !isError && quizzes?.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              to={`/teacher/classes/${classId}/quizzes/${quiz.id}`}
              className="focus-ring flex flex-col gap-3 rounded-xl border border-ink-300 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-ink-900">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">
                      {quiz.description}
                    </p>
                  )}
                </div>
                {quiz.is_published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="neutral">Draft</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {quiz.question_count} {quiz.question_count === 1 ? "question" : "questions"}
                </span>
                <span>{quiz.total_marks} marks</span>
                <span>{quiz.duration_minutes} min</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateQuizModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        classId={classId}
      />
    </section>
  );
}
