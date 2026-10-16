// frontend/src/features/student/pages/StudentQuizResultPage.jsx
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Loader2, Trophy, XCircle,
} from "lucide-react";

import { useGetQuizAttemptResultQuery } from "../../../store/api/realApi";

export default function StudentQuizResultPage() {
  const { attemptId } = useParams();
  const { data, isLoading, isError } = useGetQuizAttemptResultQuery(attemptId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-coral-200 bg-coral-50 p-6 text-center">
        <p className="text-sm font-semibold text-coral-700">
          Could not load this result.
        </p>
        <Link
          to="/student/quizzes"
          className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
        >
          Back to quizzes
        </Link>
      </div>
    );
  }

  const passed = data.passed;
  const answers = data.answers || [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Score card */}
      <div
        className={
          "rounded-2xl border p-6 shadow-sm " +
          (passed
            ? "border-emerald-200 bg-emerald-50/70"
            : "border-rose-200 bg-rose-50/70")
        }
      >
        <div className="flex items-start gap-4">
          <span
            className={
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl " +
              (passed
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white")
            }
          >
            {passed ? <Trophy size={26} /> : <XCircle size={26} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {data.class_name}
            </p>
            <h1 className="font-display text-xl font-extrabold text-navy-950">
              {data.quiz_title}
            </h1>
            <p
              className={
                "mt-2 text-sm font-extrabold " +
                (passed ? "text-emerald-700" : "text-rose-700")
              }
            >
              {passed ? "Passed" : "Did not pass"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Score
            </p>
            <p className="font-display text-3xl font-extrabold text-navy-950">
              {data.score}
              <span className="text-lg text-slate-400">/{data.max_score}</span>
            </p>
            <p className="text-xs font-bold text-slate-500">
              {data.percentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Review */}
      <h2 className="mt-2 text-sm font-extrabold uppercase tracking-wider text-slate-500">
        Review
      </h2>

      {answers.map((a, idx) => {
        const correct = a.is_correct;
        return (
          <div
            key={a.id}
            className={
              "rounded-2xl border bg-white/95 p-5 shadow-sm backdrop-blur-md " +
              (correct
                ? "border-emerald-200"
                : "border-rose-200")
            }
          >
            <div className="flex items-start gap-3">
              <span
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white " +
                  (correct ? "bg-emerald-600" : "bg-rose-600")
                }
              >
                {correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-950">
                  {idx + 1}. {a.question_text}
                </p>

                <div className="mt-3 space-y-1.5 text-xs">
                  <p
                    className={
                      "rounded-lg px-3 py-2 font-semibold " +
                      (correct
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-rose-50 text-rose-800")
                    }
                  >
                    <span className="mr-2 font-bold uppercase tracking-wider">
                      Your answer:
                    </span>
                    {a.chosen_choice_text || "— (unanswered)"}
                  </p>

                  {!correct && (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">
                      <span className="mr-2 font-bold uppercase tracking-wider">
                        Correct:
                      </span>
                      {a.correct_choice_text}
                    </p>
                  )}

                  {a.explanation && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                      <span className="mr-2 font-bold uppercase tracking-wider text-slate-500">
                        Why:
                      </span>
                      {a.explanation}
                    </p>
                  )}
                </div>

                <p className="mt-2 text-[11px] font-bold text-slate-400">
                  {a.points_awarded} / {a.points} pts
                </p>
              </div>
            </div>
          </div>
        );
      })}

      <Link
        to="/student/quizzes"
        className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <ArrowLeft size={14} />
        Back to all quizzes
      </Link>
    </div>
  );
}