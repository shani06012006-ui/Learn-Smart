import { Link } from "react-router-dom";
import { ClipboardList, Clock, CheckCircle2 } from "lucide-react";

export default function QuizCard({ quiz }) {
  const submitted = !!quiz.already_submitted;
  const to = submitted
    ? `/student/submissions/${quiz.submission_id}`
    : `/student/quizzes/${quiz.id}`;

  return (
    <Link
      to={to}
      className={
        "focus-ring flex flex-col gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md " +
        (submitted
          ? "border-success-500 bg-success-50/40"
          : "border-ink-300 bg-white")
      }
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
        {submitted && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-500 px-2.5 py-0.5 text-xs font-medium text-white">
            <CheckCircle2 size={12} />
            Submitted
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-3 text-xs text-ink-500">
        <span className="flex items-center gap-1">
          <ClipboardList size={12} />
          {quiz.question_count}{" "}
          {quiz.question_count === 1 ? "question" : "questions"}
        </span>
        <span>{quiz.total_marks} marks</span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {quiz.duration_minutes} min
        </span>
      </div>
      {submitted && (
        <p className="text-xs font-medium text-success-700">
          View your result →
        </p>
      )}
    </Link>
  );
}
