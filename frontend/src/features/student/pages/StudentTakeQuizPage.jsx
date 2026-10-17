// frontend/src/features/student/pages/StudentTakeQuizPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import {
  useStartQuizAttemptMutation,
  useSubmitQuizAttemptMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const CHOICE_LETTERS = ["A", "B", "C", "D"];

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
        if (err?.data?.attempt_id && detail.toLowerCase().includes("already")) {
          navigate(`/student/quiz-attempts/${err.data.attempt_id}`);
          return;
        }
        setError(extractErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId, start, navigate]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!attemptId || !quiz) return;
      const total = quiz.questions.length;
      const answered = Object.keys(answers).length;
      if (!auto && answered < total) {
        const missing = total - answered;
        const ok = window.confirm(
          `You still have ${missing} unanswered question${
            missing === 1 ? "" : "s"
          }. Submit anyway?`
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
    },
    [attemptId, quiz, answers, quizId, submit, navigate]
  );

  // 2. Timer
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      handleSubmit(true);
      return;
    }
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
        <Loader2 className="animate-spin text-emerald-500" size={32} />
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
          className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            {quiz.class_name}
          </p>
          <h1 className="truncate font-display text-lg font-extrabold text-navy-950">
            {quiz.title}
          </h1>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
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
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-extrabold text-white"> 
               {idx + 1} 
            </span>
             <div className="min-w-0 flex-1">
                {/* ADDED: Image Container */}
                {q.question_image && ( 
                  <div className="group mb-3 flex justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-inner"> 
                  <img 
                  src={q.question_image} 
                  alt="Question illustration" 
                  className="max-h-56 w-auto cursor-zoom-in rounded-lg object-contain transition-transform duration-300 group-hover:scale-105" 
                  onClick={() => window.open(q.question_image, "_blank")} 
                  /> 
              </div> )}

    <p className="text-sm font-bold leading-relaxed text-navy-950">
      {q.question_text}
    </p>
    <p className="mt-1 text-[11px] font-semibold text-slate-400">
      {q.points} {q.points === 1 ? "point" : "points"}
    </p>
  </div>
</div>

          {/* === THE UPGRADED ANSWER PILLS === */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.choices.map((c, cIdx) => {
              const chosen = answers[q.id] === c.id;
              const letter = CHOICE_LETTERS[cIdx] || String.fromCharCode(65 + cIdx);

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => choose(q.id, c.id)}
                  className={
                    "group flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 " +
                    (chosen
                      ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm ring-2 ring-emerald-200"
                      : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40")
                  }
                >
                  {/* A / B / C / D Letter Badge */}
                  <span
                    className={
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-extrabold transition-colors " +
                      (chosen
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-200 bg-slate-50 text-slate-500 group-hover:border-emerald-300 group-hover:text-emerald-600")
                    }
                  >
                    {letter}
                  </span>

                  {/* The actual text from the backend */}
                  <span
                    className={
                      "flex-1 text-sm font-semibold leading-snug transition-colors " +
                      (chosen ? "text-emerald-900" : "text-slate-700")
                    }
                  >
                    {c.choice_text}
                  </span>

                  {/* Check icon when selected */}
                  {chosen && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 size={14} className="stroke-[3]" />
                    </span>
                  )}
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
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit quiz"}
        </button>
      </div>
    </div>
  );
}