import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, ArrowRight, User, Users } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import { useAuth } from "../../../hooks/useAuth";
import {
  useGetTimetableQuery,
  useGetTeacherColleaguesQuery,
  useGetClassesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const DAYS = [
  { idx: 0, label: "Monday",    short: "Mon" },
  { idx: 1, label: "Tuesday",   short: "Tue" },
  { idx: 2, label: "Wednesday", short: "Wed" },
  { idx: 3, label: "Thursday",  short: "Thu" },
  { idx: 4, label: "Friday",    short: "Fri" },
  { idx: 5, label: "Saturday",  short: "Sat" },
  { idx: 6, label: "Sunday",    short: "Sun" },
];

function fmtTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function durationLabel(start, end) {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const [scope, setScope] = useState("all");        // "all" | "mine"
  const [teacherFilter, setTeacherFilter] = useState("");  // teacher UUID
  const [classFilter, setClassFilter] = useState("");

  const queryParams = useMemo(() => {
    const p = {};
    if (scope === "mine") p.mine = true;
    if (teacherFilter) p.teacher = teacherFilter;
    if (classFilter) p.class_id = classFilter;
    return p;
  }, [scope, teacherFilter, classFilter]);

  const {
    data: entriesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTimetableQuery(queryParams);

  // Load teachers for the dropdown
  const { data: teachersData } = useGetTeacherColleaguesQuery();
  const teachers = useMemo(() => {
    const list = teachersData?.results ?? teachersData ?? [];
    return list.filter((t) => t.role === "teacher");
  }, [teachersData]);

  // Load classes for the dropdown
  const { data: classesData } = useGetClassesQuery();
  const classes = useMemo(() => {
    const list = classesData?.results ?? classesData ?? [];
    return list;
  }, [classesData]);

  if (isLoading) return <LoadingState label="Loading timetable..." />;
  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  const entries = entriesData?.results ?? entriesData ?? [];

  // JS getDay() -> Sunday=0, Monday=1, ... Saturday=6
  // Model uses Monday=0 ... Sunday=6
  const jsDow = new Date().getDay();
  const todayIdx = jsDow === 0 ? 6 : jsDow - 1;
  const todayLabel = DAYS.find((d) => d.idx === todayIdx)?.label || "";

  const totalSessions = entries.filter((e) => e.is_active !== false).length;
  const todaySessions = entries.filter(
    (e) => e.day_of_week === todayIdx && e.is_active !== false,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Full institution timetable — every class, every teacher.
          </p>
        </div>

        {totalSessions > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-card">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-slate-500">
                {totalSessions} session{totalSessions === 1 ? "" : "s"} / week
              </span>
            </div>
            <span className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-slate-500">
                {todaySessions} today
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex items-center gap-1 rounded-full bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => { setScope("all"); setTeacherFilter(""); }}
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition " +
              (scope === "all"
                ? "bg-purple-500 text-white shadow-purple-glow"
                : "text-slate-500 hover:text-navy-950")
            }
          >
            <Users size={12} />
            All Teachers
          </button>
          <button
            type="button"
            onClick={() => { setScope("mine"); setTeacherFilter(""); }}
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition " +
              (scope === "mine"
                ? "bg-purple-500 text-white shadow-purple-glow"
                : "text-slate-500 hover:text-navy-950")
            }
          >
            <User size={12} />
            My Slots
          </button>
        </div>

        {scope === "all" && (
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || t.email}
              </option>
            ))}
          </select>
        )}

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {(teacherFilter || classFilter || scope === "mine") && (
          <button
            type="button"
            onClick={() => { setScope("all"); setTeacherFilter(""); setClassFilter(""); }}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
          >
            Clear filters
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <CalendarDays size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            No timetable yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Your admin will schedule sessions for your classes. They&rsquo;ll appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map(({ idx, label, short }) => {
            const dayEntries = entries
              .filter((e) => e.day_of_week === idx && e.is_active !== false)
              .sort((a, b) =>
                (a.start_time || "").localeCompare(b.start_time || ""),
              );
            const isToday = idx === todayIdx;
            return (
              <section
                key={idx}
                className={
                  "rounded-2xl border bg-white p-4 shadow-card transition " +
                  (isToday
                    ? "border-purple-300 ring-2 ring-purple-100"
                    : "border-slate-200")
                }
              >
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-700">
                    <span className="hidden lg:inline">{label}</span>
                    <span className="lg:hidden">{short}</span>
                  </h2>
                  {isToday && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      Today
                    </span>
                  )}
                </header>

                {dayEntries.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-slate-400">
                    No sessions
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dayEntries.map((e) => {
                      const classId = e.class_course?.id;
                      const duration = durationLabel(e.start_time, e.end_time);
                      const Inner = (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-xs font-bold text-navy-950">
                              {e.class_course?.name || "Class"}
                            </p>
                            <span className="shrink-0 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                              {fmtTime(e.start_time)}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={9} />
                              {fmtTime(e.start_time)}–{fmtTime(e.end_time)}
                            </span>
                            {duration && (
                              <span className="text-slate-400">({duration})</span>
                            )}
                            {e.room && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={9} />
                                {e.room}
                              </span>
                            )}
                          </div>
                        </>
                      );
                      return (
                        <li key={e.id}>
                          {classId ? (
                            <Link
                              to={`/teacher/classes/${classId}`}
                              className={
                                "group block rounded-xl border bg-slate-50/60 p-3 transition hover:border-purple-200 hover:bg-purple-50/50 " +
                                (e.teacher?.id === user?.id
                                  ? "border-purple-200 ring-1 ring-purple-100"
                                  : "border-slate-100")
                              }
                            >
                              {Inner}
                              <ArrowRight
                                size={11}
                                className="mt-1 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-500"
                              />
                            </Link>
                          ) : (
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                              {Inner}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {entries.length > 0 && (
        <p className="text-center text-[11px] text-slate-400">
          Today is <span className="font-semibold text-slate-500">{todayLabel}</span>.
          {todaySessions > 0
            ? ` You have ${todaySessions} session${todaySessions === 1 ? "" : "s"} scheduled.`
            : " No sessions scheduled for today."}
        </p>
      )}
    </div>
  );
}
