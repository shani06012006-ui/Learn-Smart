// frontend/src/features/student/pages/StudentQuizzesPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain, CheckCircle2, Clock, Play, Search, Trophy, XCircle, Loader2,
} from "lucide-react";

import { useGetStudentQuizzesQuery } from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

export default function StudentQuizzesPage() {
  const R = getRoleConfig("student");
  const [search, setSearch] = useState("");

  // Uses your existing hook — /student/quizzes/ returns array or {results}
  const { data, isLoading, isError, refetch } = useGetStudentQuizzesQuery();

  const quizzes = useMemo(() => data?.results ?? data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(
      (qz) =>
        (qz.title || "").toLowerCase().includes(q) ||
        (qz.class_name || "").toLowerCase().includes(q),
    );
  }, [quizzes, search]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {R.headings?.quizzes?.title || "My Quizzes"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {R.headings?.quizzes?.subtitle ||
            "Quizzes from your enrolled classes."}
        </p>
      </header>

      {quizzes.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-3 shadow-sm backdrop-blur-md">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes…"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-16 backdrop-blur-md">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 p-5 text-sm">
          <p className="font-semibold text-coral-700">Could not load quizzes.</p>
          <button
            onClick={refetch}
            className="mt-2 rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && quizzes.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/85 p-14 text-center backdrop-blur-md">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 ring-1 ring-blue-100">
            <Brain size={26} />
          </span>
          <h2 className="font-display text-lg font-extrabold text-navy-950">
            No quizzes yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            When your teachers publish a quiz for your class, it will appear here.
          </p>
        </div>
      )}

      {!isLoading && !isError && quizzes.length > 0 && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white/85 py-10 text-center text-sm text-slate-400 backdrop-blur-md">
          No quizzes match "{search}".
        </p>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((qz) => (
            <QuizCard key={qz.id} quiz={qz} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuizCard({ quiz }) {
  const attempt = quiz.my_attempt;
  const done = attempt?.status === "submitted";
  const started = attempt?.status === "in_progress";
  const passed = attempt?.passed;
  const scoreLabel = done
    ? `${attempt.score} / ${attempt.max_score}`
    : `${quiz.total_marks || quiz.question_count || 0} pts`;

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100">
          <Brain size={11} />
          Quiz
        </span>

        {done && (
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 " +
              (passed
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-rose-50 text-rose-700 ring-rose-100")
            }
          >
            {passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            {passed ? "Passed" : "Failed"}
          </span>
        )}
        {started && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-100">
            In progress
          </span>
        )}
      </div>

      <div>
        <h3 className="line-clamp-2 font-display text-base font-extrabold leading-snug text-navy-950 group-hover:text-blue-600">
          {quiz.title}
        </h3>
        <p className="mt-1 truncate text-xs text-slate-500">
          {quiz.class_name || "—"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock size={11} className="text-slate-400" />
          {quiz.duration_minutes} min
        </span>
        <span className="inline-flex items-center gap-1">
          <Trophy size={11} className="text-slate-400" />
          {scoreLabel}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
        {done ? (
          <Link
            to={`/student/quiz-attempts/${attempt.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            View result
          </Link>
        ) : (
          <Link
            to={`/student/quizzes/${quiz.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            <Play size={12} />
            {started ? "Continue" : "Start quiz"}
          </Link>
        )}
      </div>
    </div>
  );
}