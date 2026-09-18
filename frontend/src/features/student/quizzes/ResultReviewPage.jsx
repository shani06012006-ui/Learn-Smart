import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";

import { useGetSubmissionQuery } from "../../../store/api/examsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Badge from "../../../components/ui/Badge";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";

function percentToVariant(p) {
  if (p >= 75) return "success";
  if (p >= 50) return "warning";
  return "danger";
}

export default function ResultReviewPage() {
  const { submissionId } = useParams();
  const { data, isLoading, isError, error, refetch } =
    useGetSubmissionQuery(submissionId);

  if (isLoading) return <LoadingState label="Loading your result..." />;
  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  const percent =
    data.total_marks > 0 ? Math.round((data.score / data.total_marks) * 100) : 0;

  const answerByQuestionId = Object.fromEntries(
    (data.answers || []).map((a) => [a.question_id, a])
  );

  return (
    <div>
      <Link
        to="/student/quizzes"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft size={16} />
        Back to quizzes
      </Link>

      <div className="mb-6 rounded-xl border border-ink-300 bg-white p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
              Result
            </p>
            <h1 className="mt-0.5 text-xl font-semibold text-ink-900">
              {data.quiz?.title || "Quiz result"}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Submitted{" "}
              {new Date(data.submitted_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-brand-500 bg-brand-50 text-brand-700">
                <span className="text-2xl font-bold leading-none">
                  {data.score}
                </span>
                <span className="mt-0.5 text-xs text-brand-600">of</span>
                <span className="text-base font-semibold leading-none">
                  {data.total_marks}
                </span>
              </div>
              <span className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-500">
                Marks obtained
              </span>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <Badge variant={percentToVariant(percent)} dot>
                {percent}%
              </Badge>
              <span className="text-xs text-ink-500">
                {percent >= 75
                  ? "Very Good"
                  : percent >= 50
                  ? "Average"
                  : "Needs Improvement"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {(data.questions || []).map((q, idx) => {
          const answer = answerByQuestionId[q.id];
          const studentChoiceId = answer?.answer_ids?.[0] || null;
          const correctChoice = q.choices.find((c) => c.is_correct);
          const studentChoice = q.choices.find((c) => c.id === studentChoiceId);
          const isCorrect = !!answer?.is_correct;

          return (
            <section
              key={q.id}
              className={
                "rounded-xl border bg-white p-4 " +
                (isCorrect ? "border-success-500" : "border-danger-500")
              }
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                    Question {idx + 1} · {q.marks}{" "}
                    {q.marks === 1 ? "mark" : "marks"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{q.text}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
                      <Check size={12} />
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-700">
                      <X size={12} />
                      Incorrect
                    </span>
                  )}
                </div>
              </div>

              <ul className="flex flex-col gap-1.5">
                {q.choices.map((c) => {
                  const isStudent = c.id === studentChoiceId;
                  const isTheCorrect = c.id === correctChoice?.id;
                  let className =
                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm ";
                  if (isTheCorrect) {
                    className += "bg-success-50 text-success-700";
                  } else if (isStudent && !isCorrect) {
                    className += "bg-danger-50 text-danger-700";
                  } else {
                    className += "bg-ink-100/60 text-ink-700";
                  }

                  return (
                    <li key={c.id} className={className}>
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (isTheCorrect
                            ? "bg-success-500"
                            : isStudent && !isCorrect
                            ? "bg-danger-500"
                            : "bg-ink-300")
                        }
                        aria-hidden="true"
                      />
                      {c.text}
                      {isStudent && !isTheCorrect && (
                        <span className="ml-auto text-xs font-medium">
                          Your answer
                        </span>
                      )}
                      {isTheCorrect && !isStudent && (
                        <span className="ml-auto text-xs font-medium">
                          Correct answer
                        </span>
                      )}
                      {isTheCorrect && isStudent && (
                        <span className="ml-auto text-xs font-medium">
                          Your answer · Correct
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              {!studentChoice && (
                <p className="mt-2 text-xs text-ink-500">
                  You didn&apos;t answer this question.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to="/student/quizzes"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Back to quizzes
        </Link>
      </div>
    </div>
  );
}
