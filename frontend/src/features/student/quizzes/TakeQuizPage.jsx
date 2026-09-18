import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import {
  useGetQuizDetailQuery,
  useSubmitQuizMutation,
} from "../../../store/api/examsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import QuestionCard from "./components/QuestionCard";
import QuizTimer from "./components/QuizTimer";
import SubmitConfirmModal from "./components/SubmitConfirmModal";

export default function TakeQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const { data: quiz, isLoading, isError, error, refetch } = useGetQuizDetailQuery(quizId);
  const [submitQuiz, { isLoading: isSubmitting }] = useSubmitQuizMutation();

  const [answers, setAnswers] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const questions = useMemo(() => quiz?.questions ?? [], [quiz]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  const handleSelect = (questionId, choiceId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    const payload = Object.fromEntries(
      Object.entries(answers)
        .filter(([, choiceId]) => !!choiceId)
        .map(([qid, cid]) => [qid, [cid]])
    );

    try {
      const submission = await submitQuiz({ quizId, answers: payload }).unwrap();
      navigate(`/student/submissions/${submission.id}`, { replace: true });
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "Could not submit the quiz."));
      setConfirmOpen(false);
    }
  }, [answers, navigate, quizId, submitQuiz]);

  useEffect(() => {
    if (answeredCount === 0) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [answeredCount]);

  if (isLoading) return <LoadingState label="Loading quiz..." />;
  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  // If the student has already submitted this quiz, redirect to the result
  // page instead of letting them retake it. The detail endpoint scopes this
  // to the current student via already_submitted / submission_id.
  if (quiz.already_submitted && quiz.submission_id) {
    return <Navigate to={`/student/submissions/${quiz.submission_id}`} replace />;
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div>
      <Link
        to="/student/quizzes"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft size={16} />
        Back to quizzes
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-ink-900">{quiz.title}</h1>
          {quiz.description && (
            <p className="mt-1 max-w-xl text-sm text-ink-500">{quiz.description}</p>
          )}
          <p className="mt-2 text-xs text-ink-500">
            {questions.length} {questions.length === 1 ? "question" : "questions"} ·{" "}
            {totalMarks} {totalMarks === 1 ? "mark" : "marks"}
          </p>
        </div>
        <QuizTimer durationMinutes={quiz.duration_minutes} onExpire={handleSubmit} />
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            selectedChoiceId={answers[q.id] || null}
            onSelect={(choiceId) => handleSelect(q.id, choiceId)}
          />
        ))}
      </div>

      {submitError && (
        <p
          role="alert"
          className="mt-6 flex items-center gap-2 rounded-lg border border-danger-50 bg-danger-50/60 px-4 py-3 text-sm text-danger-700"
        >
          <AlertTriangle size={16} />
          {submitError}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-xl border border-ink-300 bg-white p-5 sm:flex-row">
        <p className="text-sm text-ink-700">
          <span className="font-medium">{answeredCount}</span> of{" "}
          <span className="font-medium">{questions.length}</span> answered
        </p>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={answeredCount === 0 || isSubmitting}
          loading={isSubmitting}
        >
          Submit quiz
        </Button>
      </div>

      <SubmitConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
