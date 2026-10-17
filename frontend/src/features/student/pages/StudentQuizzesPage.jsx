// frontend/src/features/student/pages/StudentQuizzesPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Play,
  Search,
  Trophy,
  XCircle,
  X,
} from "lucide-react";

import { useGetStudentQuizzesQuery } from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function StudentQuizzesPage() {
  const R = getRoleConfig("student");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading, isError, refetch } = useGetStudentQuizzesQuery();

  // Flexible shape (array or { results })
  const quizzes = useMemo(() => data?.results ?? data ?? [], [data]);

  // Bucket quizzes by status
  const { all, inProgress, completed } = useMemo(() => {
    const buckets = { all: [], inProgress: [], completed: [] };
    for (const qz of quizzes) {
      buckets.all.push(qz);
      const status = qz.my_attempt?.status;
      if (status === "submitted") buckets.completed.push(qz);
      else buckets.inProgress.push(qz); // null or "in_progress"
    }
    return {
      all: buckets.all,
      inProgress: buckets.inProgress,
      completed: buckets.completed,
    };
  }, [quizzes]);

  const buckets = { all, in_progress: inProgress, completed };

  // Apply filter + search
  const visible = useMemo(() => {
    let list = buckets[filter] || all;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (qz) =>
          (qz.title || "").toLowerCase().includes(q) ||
          (qz.class_name || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [buckets, filter, all, search]);

  const counts = {
    all: all.length,
    in_progress: inProgress.length,
    completed: completed.length,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {R.headings?.quizzes?.title || "My Quizzes"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {R.headings?.quizzes?.subtitle ||
            "Quizzes from your enrolled classes."}
        </p>
      </header>

      {/* Filter + search bar */}
      {quizzes.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/90 p-3 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Filter size={14} />
            </span>

            {FILTERS.map((f) => {
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all " +
                    (isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700")
                  }
                >
                  {f.label}
                  <span
                    className={
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] " +
                      (isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-500")
                    }
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}

            <div className="relative ml-auto min-w-[14rem] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quizzes…"
                className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy-950"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-16 backdrop-blur-md">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
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

      {/* No quizzes at all */}
      {!isLoading && !isError && quizzes.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/85 p-14 text-center backdrop-blur-md">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
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

      {/* Filtered but no results */}
      {!isLoading && !isError && quizzes.length > 0 && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/85 p-10 text-center backdrop-blur-md">
          <p className="text-sm font-semibold text-navy-950">
            {search
              ? `No quizzes match "${search}"`
              : filter === "in_progress"
              ? "Nothing pending right now"
              : filter === "completed"
              ? "No completed quizzes yet"
              : "No quizzes to show"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {filter !== "all"
              ? "Try switching to the All tab."
              : "Come back later."}
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((qz) => (
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

  return (
    <div className="group flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white/95 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Colored status bar */}
      <div
        className={
          "h-1 w-full " +
          (done
            ? passed
              ? "bg-emerald-500"
              : "bg-rose-500"
            : started
            ? "bg-amber-500"
            : "bg-purple-500")
        }
      />

      <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
        {/* Top row: pill + status */}
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
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

        {/* Title */}
        <div>
          <h3 className="line-clamp-2 font-display text-base font-extrabold leading-snug text-navy-950 transition group-hover:text-emerald-600">
            {quiz.title}
          </h3>
          <p className="mt-1 truncate text-xs text-slate-500">
            {quiz.class_name || "—"}
          </p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock size={11} className="text-slate-400" />
            {quiz.duration_minutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy size={11} className="text-slate-400" />
            {done
              ? `${attempt.score} / ${attempt.max_score}`
              : `${quiz.total_marks || quiz.question_count || 0} pts`}
          </span>
        </div>

        {/* Action */}
        <div className="mt-auto border-t border-gray-100 pt-3">
          {done ? (
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Your score
                </p>
                <p
                  className={
                    "text-sm font-extrabold " +
                    (passed ? "text-emerald-700" : "text-rose-700")
                  }
                >
                  {attempt.percentage}%
                </p>
              </div>
              <Link
                to={`/student/quiz-attempts/${attempt.id}`}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Review
              </Link>
            </div>
          ) : (
            <Link
              to={`/student/quizzes/${quiz.id}`}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <Play size={12} />
              {started ? "Continue quiz" : "Start quiz"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}