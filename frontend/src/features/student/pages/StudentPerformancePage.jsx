// frontend/src/features/student/pages/StudentPerformancePage.jsx
import { useMemo } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flame,
  Loader2,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { useGetStudentQuizzesQuery } from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

/* =================================================================
   Helpers
   ================================================================= */

// Group quizzes by class/subject name
function groupByClass(quizzes) {
  const map = {};
  for (const qz of quizzes) {
    const key = qz.class_name || qz.class_id || "Other";
    if (!map[key]) {
      map[key] = {
        label: qz.class_name || "Other class",
        subject: qz.subject || null,
        total: 0,
        submitted: 0,
        sumPercent: 0,
      };
    }
    map[key].total++;
    const att = qz.my_attempt;
    if (att?.status === "submitted") {
      map[key].submitted++;
      map[key].sumPercent += att.percentage || 0;
    }
  }
  return Object.values(map)
    .map((g) => ({
      ...g,
      avgPercent: g.submitted > 0 ? Math.round(g.sumPercent / g.submitted) : 0,
    }))
    .sort((a, b) => b.submitted - a.submitted);
}

// Compute achievement badges from quiz history
function computeBadges(quizzes) {
  const submitted = quizzes.filter(
    (qz) => qz.my_attempt?.status === "submitted",
  );
  const scores = submitted.map((q) => q.my_attempt.percentage || 0);
  const passed = submitted.filter((q) => q.my_attempt.passed);
  const perfect = submitted.filter((q) => q.my_attempt.percentage === 100);

  // Best streak of consecutive passes (in submission order)
  const ordered = [...submitted].sort(
    (a, b) =>
      new Date(a.my_attempt.submitted_at) -
      new Date(b.my_attempt.submitted_at),
  );
  let bestStreak = 0;
  let curStreak = 0;
  for (const q of ordered) {
    if (q.my_attempt.passed) {
      curStreak++;
      bestStreak = Math.max(bestStreak, curStreak);
    } else {
      curStreak = 0;
    }
  }

  // Best subject
  const byClass = groupByClass(quizzes);
  const bestClass = byClass.find((g) => g.submitted > 0 && g.avgPercent >= 90);

  return [
    {
      id: "first_quiz",
      icon: BookOpen,
      label: "First Quiz",
      desc: "Take your first quiz",
      earned: submitted.length >= 1,
    },
    {
      id: "perfect",
      icon: Star,
      label: "Perfectionist",
      desc: "Score 100% on any quiz",
      earned: perfect.length >= 1,
    },
    {
      id: "streak_3",
      icon: Flame,
      label: "On Fire",
      desc: "Pass 3 quizzes in a row",
      earned: bestStreak >= 3,
    },
    {
      id: "subject_master",
      icon: Award,
      label: "Subject Master",
      desc: "90%+ avg in any class",
      earned: !!bestClass,
    },
    {
      id: "five_quizzes",
      icon: Trophy,
      label: "Persistent",
      desc: "Complete 5 quizzes",
      earned: submitted.length >= 5,
    },
  ];
}

/* =================================================================
   Page
   ================================================================= */

export default function StudentPerformancePage() {
  const R = getRoleConfig("student");
  const { data, isLoading, isError, refetch } = useGetStudentQuizzesQuery();

  const quizzes = useMemo(() => data?.results ?? data ?? [], [data]);

  const submitted = useMemo(
    () => quizzes.filter((qz) => qz.my_attempt?.status === "submitted"),
    [quizzes],
  );

  const stats = useMemo(() => {
    const totalPoints = submitted.reduce(
      (sum, q) => sum + (q.my_attempt.score || 0),
      0,
    );
    const maxPoints = submitted.reduce(
      (sum, q) => sum + (q.my_attempt.max_score || 0),
      0,
    );
    const avgPercent =
      submitted.length > 0
        ? Math.round(
            submitted.reduce(
              (sum, q) => sum + (q.my_attempt.percentage || 0),
              0,
            ) / submitted.length,
          )
        : 0;
    const passed = submitted.filter((q) => q.my_attempt.passed).length;
    const passRate =
      submitted.length > 0
        ? Math.round((passed / submitted.length) * 100)
        : 0;
    return {
      totalPoints,
      maxPoints,
      avgPercent,
      passRate,
      taken: submitted.length,
      passed,
    };
  }, [submitted]);

  // Last 10 scores, ordered oldest → newest for the chart
  const recentScores = useMemo(() => {
    return [...submitted]
      .sort(
        (a, b) =>
          new Date(a.my_attempt.submitted_at) -
          new Date(b.my_attempt.submitted_at),
      )
      .slice(-10)
      .map((q) => ({
        title: q.title,
        percent: q.my_attempt.percentage || 0,
        passed: q.my_attempt.passed,
      }));
  }, [submitted]);

  const byClass = useMemo(() => groupByClass(quizzes), [quizzes]);
  const badges = useMemo(() => computeBadges(quizzes), [quizzes]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {R.headings?.performance?.title || "My Performance"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {R.headings?.performance?.subtitle ||
            "Your grades and progress at a glance."}
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-24 backdrop-blur-md">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 p-5 text-sm">
          <p className="font-semibold text-coral-700">
            Could not load your performance.
          </p>
          <button
            onClick={refetch}
            className="mt-2 rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && submitted.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/85 p-14 text-center backdrop-blur-md">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
            <BarChart3 size={26} />
          </span>
          <h2 className="font-display text-lg font-extrabold text-navy-950">
            No performance data yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Take your first quiz and your progress will appear here.
          </p>
        </div>
      )}

      {!isLoading && !isError && submitted.length > 0 && (
        <>
          {/* ===== Stats ===== */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total points"
              value={stats.totalPoints}
              icon={Trophy}
              tone="emerald"
            />
            <StatCard
              label="Quizzes taken"
              value={stats.taken}
              icon={BookOpen}
              tone="purple"
            />
            <StatCard
              label="Avg score"
              value={`${stats.avgPercent}%`}
              icon={TrendingUp}
              tone="blue"
            />
            <StatCard
              label="Pass rate"
              value={`${stats.passRate}%`}
              icon={Target}
              tone="amber"
            />
          </div>

          {/* ===== Score trend chart ===== */}
          <section className="rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                <TrendingUp size={14} className="text-emerald-600" />
                Recent scores
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                Last {recentScores.length}
              </span>
            </div>

            <div className="flex h-48 items-end gap-2 rounded-xl bg-slate-50/60 p-3">
              {/* 60% pass line */}
              <div className="relative flex w-full items-end gap-2">
                <div
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-emerald-300"
                  style={{ bottom: "60%" }}
                >
                  <span className="absolute -top-4 right-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    Pass 60%
                  </span>
                </div>

                {recentScores.map((s, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    title={`${s.title} · ${s.percent}%`}
                  >
                    <span className="mb-1 text-[9px] font-bold text-slate-400">
                      {s.percent}
                    </span>
                    <div
                      className={
                        "w-full rounded-t-md transition-all group-hover:opacity-80 " +
                        (s.passed ? "bg-emerald-500" : "bg-rose-400")
                      }
                      style={{
                        height: `${Math.max(4, s.percent)}%`,
                        minHeight: "8px",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              Each bar is a submitted quiz. Green = passed, red = failed.
            </p>
          </section>

          {/* ===== Two-column: subjects + badges ===== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Subject breakdown */}
            <section className="rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                <BookOpen size={14} className="text-blue-600" />
                By class
              </h2>

              <ul className="space-y-3">
                {byClass
                  .filter((g) => g.submitted > 0)
                  .map((g) => (
                    <li key={g.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate font-bold text-navy-950">
                          {g.label}
                        </span>
                        <span className="ml-2 shrink-0 font-semibold text-slate-500">
                          {g.submitted}{" "}
                          {g.submitted === 1 ? "quiz" : "quizzes"} ·{" "}
                          <span
                            className={
                              g.avgPercent >= 60
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }
                          >
                            {g.avgPercent}%
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={
                            "h-full rounded-full transition-all " +
                            (g.avgPercent >= 80
                              ? "bg-emerald-500"
                              : g.avgPercent >= 60
                              ? "bg-amber-500"
                              : "bg-rose-500")
                          }
                          style={{ width: `${g.avgPercent}%` }}
                        />
                      </div>
                    </li>
                  ))}
              </ul>

              {byClass.filter((g) => g.submitted > 0).length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">
                  Take a quiz in each class to see your per-class averages.
                </p>
              )}
            </section>

            {/* Achievements */}
            <section className="rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                <Award size={14} className="text-amber-500" />
                Achievements
              </h2>
              <ul className="space-y-2">
                {badges.map((b) => {
                  const Icon = b.icon;
                  return (
                    <li
                      key={b.id}
                      className={
                        "flex items-center gap-3 rounded-xl border px-3 py-2 " +
                        (b.earned
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-gray-100 bg-slate-50/60 opacity-60")
                      }
                    >
                      <span
                        className={
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                          (b.earned
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-400")
                        }
                      >
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-navy-950">
                          {b.label}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {b.desc}
                        </p>
                      </div>
                      {b.earned && (
                        <CheckCircle2
                          size={14}
                          className="shrink-0 text-emerald-600"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* =================================================================
   Sub-components
   ================================================================= */

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <span
          className={
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 " +
            tones[tone]
          }
        >
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-navy-950">
        {value}
      </p>
    </div>
  );
}