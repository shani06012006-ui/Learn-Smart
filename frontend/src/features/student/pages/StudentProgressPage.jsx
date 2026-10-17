// frontend/src/features/student/pages/StudentProgressPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Clock,
  FileText,
  Flame,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react";

import {
  useGetStudentMeQuery,
  useGetStudentMyClassesQuery,
  useGetStudentMyAttendanceQuery,
  useGetStudentMyTimetableQuery,
  useGetStudentMyMaterialsQuery,
  useGetStudentQuizzesQuery,
} from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

/* =================================================================
   Helpers
   ================================================================= */

// Backend day_of_week: Mon=0..Sun=6. JS Date#getDay: Sun=0..Sat=6.
function backendDowFromJs(d) {
  return (d.getDay() + 6) % 7;
}

const DAY_LABELS = [
  "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday", "Sunday",
];

// "09:30:00" → "9:30 AM"
function formatTime(hms) {
  if (!hms) return "";
  const [h, m] = hms.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Count consecutive "present"/"late" days from the most recent backwards.
function computeAttendanceStreak(recent = []) {
  const sorted = [...recent].sort((a, b) =>
    (b.date || "").localeCompare(a.date || ""),
  );
  let streak = 0;
  let prev = null;
  for (const row of sorted) {
    const ok = row.status === "present" || row.status === "late";
    if (!ok) break;
    // ensure "consecutive day" — allow at most 1-day gap for weekends
    if (prev) {
      const d1 = new Date(row.date);
      const d2 = new Date(prev);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (diff > 3) break; // allow weekend gap
    }
    streak++;
    prev = row.date;
  }
  return streak;
}

/* =================================================================
   Page
   ================================================================= */

export default function StudentProgressPage() {
  const R = getRoleConfig("student");

  const { data: me, isLoading: meLoading } = useGetStudentMeQuery();
  const { data: classesData, isLoading: classesLoading } =
    useGetStudentMyClassesQuery();
  const { data: attendance, isLoading: attLoading } =
    useGetStudentMyAttendanceQuery({});
  const { data: timetableData, isLoading: timetableLoading } =
    useGetStudentMyTimetableQuery();
  const { data: materialsData, isLoading: materialsLoading } =
    useGetStudentMyMaterialsQuery();
  const { data: quizzesData, isLoading: quizzesLoading } =
    useGetStudentQuizzesQuery();

  const classes = classesData?.results ?? classesData ?? [];
  const materials = materialsData?.results ?? materialsData ?? [];
  const quizzes = quizzesData?.results ?? quizzesData ?? [];

  // Timetable shape: could be {results}, {days: [...]}, or array of entries.
  const timetableEntries = useMemo(() => {
    if (!timetableData) return [];
    if (Array.isArray(timetableData)) return timetableData;
    if (Array.isArray(timetableData.results)) return timetableData.results;
    // Some backends return { days: [{ day_of_week, entries: [...] }, ...] }
    if (Array.isArray(timetableData.days)) {
      return timetableData.days.flatMap((d) =>
        (d.entries || []).map((e) => ({
          ...e,
          day_of_week: e.day_of_week ?? d.day_of_week,
        })),
      );
    }
    return [];
  }, [timetableData]);

  const today = useMemo(() => new Date(), []);
  const todayDow = backendDowFromJs(today);

  const todaysClasses = useMemo(() => {
    return timetableEntries
      .filter((e) => Number(e.day_of_week) === todayDow)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [timetableEntries, todayDow]);

  // Next class countdown
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nextClassInfo = useMemo(() => {
    for (const e of todaysClasses) {
      if (!e.start_time) continue;
      const [h, m] = e.start_time.split(":").map(Number);
      const start = new Date(today);
      start.setHours(h, m, 0, 0);
      if (start > now) {
        const diffMs = start - now;
        const totalMin = Math.floor(diffMs / 60000);
        const hrs = Math.floor(totalMin / 60);
        const mins = totalMin % 60;
        const secs = Math.floor((diffMs % 60000) / 1000);
        return {
          entry: e,
          in: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${secs}s`,
        };
      }
    }
    return null;
  }, [todaysClasses, now, today]);

  // Points = sum of submitted attempt scores across quizzes
  const points = useMemo(() => {
    return quizzes.reduce((sum, q) => {
      const a = q.my_attempt;
      if (a && a.status === "submitted") return sum + (a.score || 0);
      return sum;
    }, 0);
  }, [quizzes]);

  // Streak
  const streak = useMemo(
    () => computeAttendanceStreak(attendance?.recent || []),
    [attendance],
  );

  // Pending quizzes (no attempt, or in progress)
  const pendingQuizzes = useMemo(() => {
    return quizzes
      .filter((q) => {
        const a = q.my_attempt;
        return !a || a.status === "in_progress";
      })
      .slice(0, 3);
  }, [quizzes]);

  // Recent materials
  const recentMaterials = useMemo(() => {
    return [...materials]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 3);
  }, [materials]);

  const loading =
    meLoading ||
    classesLoading ||
    attLoading ||
    timetableLoading ||
    materialsLoading ||
    quizzesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-24 backdrop-blur-md">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ===== Welcome header ===== */}
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-sm backdrop-blur-md">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            {R.headings?.dashboard?.title || "My Dashboard"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-navy-950">
            {greeting()}, {me?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {today.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {me?.grade?.name ? ` · ${me.grade.name}` : ""}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Streak */}
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
            <Flame size={18} className="text-amber-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Streak
              </p>
              <p className="text-sm font-extrabold text-amber-900">
                {streak} {streak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

          {/* Points */}
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
            <Trophy size={18} className="text-emerald-600" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Points
              </p>
              <p className="text-sm font-extrabold text-emerald-900">{points}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Next class countdown ===== */}
      {nextClassInfo ? (
        <section className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              Next class
            </p>
            <h2 className="mt-0.5 truncate font-display text-lg font-extrabold">
              {nextClassInfo.entry.class_course?.name ||
                nextClassInfo.entry.class_name ||
                "Class"}{" "}
              <span className="text-white/80">
                · {formatTime(nextClassInfo.entry.start_time)}
              </span>
            </h2>
            {nextClassInfo.entry.room && (
              <p className="text-xs text-white/80">
                Room {nextClassInfo.entry.room}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-white/20 px-4 py-2 text-center backdrop-blur-sm ring-1 ring-white/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              In
            </p>
            <p className="font-mono text-xl font-extrabold tabular-nums">
              {nextClassInfo.in}
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-center backdrop-blur-md">
          <p className="text-sm font-semibold text-emerald-800">
            {todaysClasses.length > 0
              ? "You're done with classes for today 🎉"
              : "No classes scheduled today"}
          </p>
        </section>
      )}

      {/* ===== Today's schedule ===== */}
      <section className="rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
            <CalendarDays size={14} className="text-emerald-600" />
            Today · {DAY_LABELS[todayDow]}
          </h2>
          <Link
            to="/student/timetable"
            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            Full timetable →
          </Link>
        </div>

        {todaysClasses.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No classes scheduled for today.
          </p>
        ) : (
          <ul className="space-y-2">
            {todaysClasses.map((e) => {
              const [h, m] = (e.start_time || "00:00").split(":").map(Number);
              const start = new Date(today);
              start.setHours(h, m, 0, 0);
              const isPast =
                e.end_time &&
                (() => {
                  const [eh, em] = e.end_time.split(":").map(Number);
                  const end = new Date(today);
                  end.setHours(eh, em, 0, 0);
                  return now > end;
                })();
              return (
                <li
                  key={e.id}
                  className={
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 " +
                    (isPast
                      ? "border-gray-100 bg-slate-50 opacity-60"
                      : "border-emerald-100 bg-emerald-50/40")
                  }
                >
                  <div className="flex flex-col items-center">
                    <p className="text-xs font-extrabold text-navy-950">
                      {formatTime(e.start_time)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatTime(e.end_time)}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy-950">
                      {e.class_course?.name || e.class_name || "Class"}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {e.class_course?.subject || ""}
                      {e.room ? ` · Room ${e.room}` : ""}
                    </p>
                  </div>
                  {!isPast && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Today
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ===== Quick action grid ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pending quizzes */}
        <section className="flex flex-col rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              <Brain size={14} className="text-purple-600" />
              Pending quizzes
            </h2>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
              {pendingQuizzes.length}
            </span>
          </div>

          {pendingQuizzes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <Sparkles size={22} className="text-emerald-500" />
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                All caught up!
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                No pending quizzes right now.
              </p>
            </div>
          ) : (
            <>
              <ul className="flex-1 space-y-2">
                {pendingQuizzes.map((q) => (
                  <li key={q.id}>
                    <Link
                      to={`/student/quizzes/${q.id}`}
                      className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/40 px-3 py-2 transition hover:border-purple-300 hover:bg-purple-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-navy-950">
                          {q.title}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {q.class_name || "—"} · {q.duration_minutes} min
                        </p>
                      </div>
                      <ArrowRight size={12} className="text-purple-600" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/student/quizzes"
                className="mt-3 inline-flex items-center gap-1 self-start text-[11px] font-bold text-purple-600 hover:text-purple-700"
              >
                All quizzes
                <ArrowRight size={11} />
              </Link>
            </>
          )}
        </section>

        {/* Recent materials */}
        <section className="flex flex-col rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              <FileText size={14} className="text-blue-600" />
              Recent materials
            </h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100">
              {materials.length}
            </span>
          </div>

          {recentMaterials.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <FileText size={22} className="text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-500">
                No materials yet
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Your teachers will share resources here.
              </p>
            </div>
          ) : (
            <>
              <ul className="flex-1 space-y-2">
                {recentMaterials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-slate-50/60 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-navy-950">
                        {m.title}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {m.class_course?.name || m.class_name || "—"}
                      </p>
                    </div>
                    {m.file && (
                      <a
                        href={m.file}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                      >
                        Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <Link
                to="/student/materials"
                className="mt-3 inline-flex items-center gap-1 self-start text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                All materials
                <ArrowRight size={11} />
              </Link>
            </>
          )}
        </section>

        {/* My classes (replaces announcements) */}
        <section className="flex flex-col rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-md lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              <BookOpen size={14} className="text-emerald-600" />
              My classes
            </h2>
            <Link
              to="/student/classes"
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
            >
              View all →
            </Link>
          </div>

          {classes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              You're not enrolled in any classes yet.{" "}
              <Link
                to="/student/join-class"
                className="font-bold text-emerald-600 hover:text-emerald-700"
              >
                Join one →
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {classes.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  to={`/student/classes`}
                  className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <BookOpen size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-navy-950">
                      {c.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                      {c.subject || "—"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}