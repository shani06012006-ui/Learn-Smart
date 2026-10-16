// frontend/src/features/student/pages/StudentTakeQuizPage.jsx
import { useCallback, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

import {
  useStartQuizAttemptMutation,
  useSubmitQuizAttemptMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function StudentTakeQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [start, { isLoading: starting }] = useStartQuizAttemptMutation();
  const [submit, { isLoading: submitting }] = useSubmitQuizAttemptMutation();

  const [attemptId, setAttemptId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(null);

  // 1. Start attempt on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await start(quizId).unwrap();
        if (cancelled) return;
        setAttemptId(res.attempt_id);
        setQuiz(res.quiz);
        setSecondsLeft(res.seconds_left);
      } catch (err) {
        const detail = err?.data?.detail || "";
        // If already submitted, hop to the result page
        if (err?.data?.attempt_id && detail.toLowerCase().includes("already")) {
          navigate(`/student/quiz-attempts/${err.data.attempt_id}`);
          return;
        }
        setError(extractErrorMessage(err));
      }
    })();
    return () => { cancelled = true; };
  }, [quizId, start, navigate]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (!attemptId || !quiz) return;
    const total = quiz.questions.length;
    const answered = Object.keys(answers).length;
    if (!auto && answered < total) {
      const missing = total - answered;
      const ok = window.confirm(
        `You still have ${missing} unanswered question${missing === 1 ? "" : "s"}. Submit anyway?`,
      );
      if (!ok) return;
    }
    setError("");
    try {
      const payload = quiz.questions.map((q) => ({
        question_id: q.id,
        choice_id: answers[q.id] || null,
      }));
      const res = await submit({ quizId, answers: payload }).unwrap();
      navigate(`/student/quiz-attempts/${res.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [attemptId, quiz, answers, quizId, submit, navigate]);

  // 2. Timer
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) { handleSubmit(true); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, handleSubmit]);

  const choose = (questionId, choiceId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const answered = Object.keys(answers).length;
  const total = quiz?.questions?.length || 0;
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

  const fmt = (s) => {
    if (s == null) return "--:--";
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (starting) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-coral-200 bg-coral-50 p-6 text-center">
        <AlertTriangle className="mx-auto text-coral-500" size={32} />
        <p className="mt-3 text-sm font-semibold text-coral-700">{error}</p>
        <Link
          to="/student/quizzes"
          className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
        >
          Back to quizzes
        </Link>
      </div>
    );
  }

  if (!quiz) return null;

  const danger = secondsLeft != null && secondsLeft <= 60;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Sticky header with timer + progress */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-sm backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            {quiz.class_name}
          </p>
          <h1 className="truncate font-display text-lg font-extrabold text-navy-950">
            {quiz.title}
          </h1>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {answered} of {total} answered
          </p>
        </div>

        <div
          className={
            "flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-extrabold tabular-nums ring-1 " +
            (danger
              ? "bg-rose-50 text-rose-700 ring-rose-200"
              : "bg-slate-50 text-navy-950 ring-slate-200")
          }
        >
          <Clock size={16} className={danger ? "text-rose-500" : "text-slate-400"} />
          {fmt(secondsLeft)}
        </div>
      </div>

      {/* Questions */}
      {quiz.questions.map((q, idx) => (
        <div
          key={q.id}
          className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-extrabold text-white">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-relaxed text-navy-950">
                {q.question_text}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                {q.points} {q.points === 1 ? "point" : "points"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.choices.map((c) => {
              const chosen = answers[q.id] === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => choose(q.id, c.id)}
                  className={
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition " +
                    (chosen
                      ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-200"
                      : "border-gray-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40")
                  }
                >
                  <span
                    className={
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 " +
                      (chosen
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white")
                    }
                  >
                    {chosen && <CheckCircle2 size={10} strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{c.choice_text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-700">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-md backdrop-blur-md">
        <Link
          to="/student/quizzes"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Exit without submitting
        </Link>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit quiz"}
        </button>
      </div>
    </div>
  );
}