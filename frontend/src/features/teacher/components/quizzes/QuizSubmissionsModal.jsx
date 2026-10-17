// frontend/src/features/teacher/components/quizzes/QuizSubmissionsModal.jsx
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Trophy,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  useGetTeacherQuizSubmissionsQuery,
  useGetQuizAttemptResultQuery,
} from "../../../../store/api/realApi";

function initialsOf(name) {
  return (
    (name || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function QuizSubmissionsModal({ quiz, open, onClose }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading, isError, refetch } =
    useGetTeacherQuizSubmissionsQuery(quiz?.id, {
      skip: !open || !quiz?.id,
    });

  const submissions = useMemo(() => data?.results || [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (s) =>
        (s.student_name || "").toLowerCase().includes(q) ||
        (s.student_email || "").toLowerCase().includes(q),
    );
  }, [submissions, search]);

  const stats = useMemo(() => {
    if (!submissions.length) return null;
    const submitted = submissions.filter((s) => s.status === "submitted");
    const scores = submitted.map((s) => s.percentage || 0);
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const passed = submitted.filter((s) => s.passed).length;
    const passRate = submitted.length
      ? Math.round((passed / submitted.length) * 100)
      : 0;
    return {
      total: submissions.length,
      submitted: submitted.length,
      avg,
      passRate,
      passed,
    };
  }, [submissions]);

  if (!open || !quiz) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
              Submissions
            </p>
            <h2 className="mt-0.5 font-display text-lg font-extrabold text-navy-950">
              {quiz.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {quiz.class_name || "—"} · {quiz.question_count || 0} questions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats strip */}
        {stats && (
          <div className="grid grid-cols-3 border-b border-gray-100 bg-slate-50/60">
            <div className="flex flex-col items-center border-r border-gray-100 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Submissions
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-navy-950">
                {stats.submitted}
                <span className="text-xs text-slate-400">/{stats.total}</span>
              </p>
            </div>
            <div className="flex flex-col items-center border-r border-gray-100 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Avg score
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-emerald-600">
                {stats.avg}%
              </p>
            </div>
            <div className="flex flex-col items-center py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pass rate
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-purple-600">
                {stats.passRate}%
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-slate-300" size={28} />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-coral-200 bg-coral-50 p-4 text-center text-sm">
              <p className="font-semibold text-coral-700">
                Could not load submissions.
              </p>
              <button
                onClick={refetch}
                className="mt-2 rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500 ring-1 ring-purple-100">
                <Users size={22} />
              </span>
              <p className="text-sm font-semibold text-navy-950">
                {search ? "No students match your search" : "No submissions yet"}
              </p>
              <p className="text-xs text-slate-400">
                {search
                  ? "Try a different name or email."
                  : "Students will appear here once they take this quiz."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <SubmissionRow
                  key={s.id}
                  submission={s}
                  quiz={quiz}
                  expanded={expandedId === s.id}
                  onToggle={() =>
                    setExpandedId((cur) => (cur === s.id ? null : s.id))
                  }
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 bg-slate-50/60 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({ submission, quiz, expanded, onToggle }) {
  const s = submission;
  const isDone = s.status === "submitted";

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50/50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-[11px] font-bold text-white">
          {initialsOf(s.student_name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-navy-950">
            {s.student_name}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {s.student_email}
          </p>
        </div>

        {/* Score */}
        <div className="hidden w-32 shrink-0 sm:block">
          {isDone ? (
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>
                  {s.score}/{s.max_score}
                </span>
                <span
                  className={
                    s.passed ? "text-emerald-600" : "text-rose-600"
                  }
                >
                  {s.percentage}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={
                    "h-full rounded-full " +
                    (s.passed ? "bg-emerald-500" : "bg-rose-500")
                  }
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-100">
              In progress
            </span>
          )}
        </div>

        {/* Pass/fail pill */}
        <span className="shrink-0">
          {isDone ? (
            s.passed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                <CheckCircle2 size={10} />
                Passed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-rose-100">
                <XCircle size={10} />
                Failed
              </span>
            )
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              —
            </span>
          )}
        </span>

        {expanded ? (
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-slate-400" />
        )}
      </button>

      {expanded && <AttemptReview attemptId={s.id} />}
    </li>
  );
}

function AttemptReview({ attemptId }) {
  const { data, isLoading, isError } =
    useGetQuizAttemptResultQuery(attemptId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">
        <Loader2 size={12} className="animate-spin" />
        Loading answers…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="rounded-xl bg-coral-50 px-4 py-3 text-xs font-semibold text-coral-700">
        Could not load answers.
      </p>
    );
  }

  const answers = data.answers || [];
  if (answers.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs italic text-slate-400">
        No answers recorded.
      </p>
    );
  }

  return (
    <div className="mb-3 ml-12 space-y-2 rounded-xl border border-gray-100 bg-slate-50/60 p-3">
      {answers.map((a, i) => (
        <div
          key={a.id}
          className={
            "rounded-lg border bg-white px-3 py-2 text-xs " +
            (a.is_correct
              ? "border-emerald-200"
              : "border-rose-200")
          }
        >
          <div className="flex items-start gap-2">
            <span
              className={
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white " +
                (a.is_correct ? "bg-emerald-600" : "bg-rose-500")
              }
            >
              {i + 1}
            </span>
            <p className="flex-1 font-semibold text-navy-950">
              {a.question_text}
            </p>
          </div>
          <div className="mt-1.5 ml-7 space-y-1 text-[11px]">
            <p className="text-slate-600">
              <span className="font-bold text-slate-500">Chose:</span>{" "}
              {a.chosen_choice_text || "— (unanswered)"}
            </p>
            {!a.is_correct && (
              <p className="text-emerald-700">
                <span className="font-bold">Correct:</span>{" "}
                {a.correct_choice_text}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}