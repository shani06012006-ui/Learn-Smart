import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  CalendarDays,
  CalendarX,
  ArrowRight,
  MessageSquare,
  Clock,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import StatCard from "../../admin/components/StatCard";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import { useAuth } from "../../../hooks/useAuth";
import {
  useGetClassesQuery,
  useGetTimetableQuery,
  useGetTeacherLeavesQuery,
  useGetTeacherGroupMessagesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();

  const {
    data: classesData,
    isLoading: classesLoading,
    isError: classesError,
    error: classesErr,
    refetch: refetchClasses,
  } = useGetClassesQuery();

  const { data: timetableData, isLoading: timetableLoading } =
    useGetTimetableQuery();

  const { data: leavesData, isLoading: leavesLoading } =
    useGetTeacherLeavesQuery({ status: "pending", page: 1 });

  const { data: messagesData } = useGetTeacherGroupMessagesQuery({});

  if (classesLoading) return <LoadingState label="Loading dashboard..." />;

  if (classesError) {
    return (
      <ErrorState
        message={extractErrorMessage(classesErr)}
        onRetry={refetchClasses}
      />
    );
  }

  const classes = classesData?.results ?? classesData ?? [];
  const totalStudents = classes.reduce(
    (acc, c) => acc + (c.student_count || 0),
    0,
  );

  const allEntries = timetableData?.results ?? timetableData ?? [];
  const todayDow = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todaySessions = allEntries
    .filter((e) => e.day_of_week === todayDow && e.is_active !== false)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  const pendingLeaves = leavesData?.count ?? (leavesData?.results ?? []).length;

  const recentMessages = (messagesData?.results ?? []).slice(-3).reverse();

  const displayName =
    user?.first_name?.trim()
    || user?.full_name?.trim()
    || user?.email
    || "Teacher";

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-purple-700 p-6 text-white shadow-elevated sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-coral-500/10 blur-3xl" />

        <div className="relative mt-1 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {getGreeting()}, <span className="text-coral-300">{displayName}</span>!
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Here&rsquo;s your teaching overview for today.
            </p>
          </div>
          <p className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
            {getFormattedDate()}
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="My classes"
          value={classes.length}
          tone="purple"
        />
        <StatCard
          icon={GraduationCap}
          label="Total students"
          value={totalStudents}
          tone="mint"
        />
        <StatCard
          icon={CalendarDays}
          label="Today's sessions"
          value={todaySessions.length}
          tone="amber"
        />
        <StatCard
          icon={CalendarX}
          label="Pending leaves"
          value={leavesLoading ? "—" : pendingLeaves}
          tone="coral"
        />
      </div>

      {/* Two-column: today's sessions + recent messages */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Today's sessions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Today's sessions
            </h2>
            <Link
              to="/teacher/timetable"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-600"
            >
              Full timetable
              <ArrowRight size={11} />
            </Link>
          </div>

          {timetableLoading ? (
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : todaySessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No sessions scheduled for today.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {todaySessions.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-950">
                      {s.class_course?.name || "Untitled class"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fmtTime(s.start_time)} — {fmtTime(s.end_time)}
                      {s.room ? ` · ${s.room}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent messages */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Recent messages
            </h2>
            <Link
              to="/teacher/chat"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-600"
            >
              Open chat
              <ArrowRight size={11} />
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No messages yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentMessages.map((m) => (
                <li key={m.id} className="flex gap-3">
                  <Avatar
                    userId={m.sender?.id}
                    initials={m.sender?.initials || "?"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-xs font-semibold text-navy-950">
                        {m.sender?.full_name || m.sender?.email}
                      </p>
                      {m.sender?.role === "admin" && (
                        <Badge variant="brand">Admin</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                      {m.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/teacher/chat"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <MessageSquare size={14} />
            Go to messages
          </Link>
        </section>
      </div>

      {/* My classes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
            My classes
          </h2>
          <Link
            to="/teacher/classes"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-600"
          >
            See all
            <ArrowRight size={11} />
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-navy-950">
              No classes yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Ask your admin to assign you a class.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                to={`/teacher/classes/${c.id}`}
                className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
                    {c.subject || "Class"}
                  </span>
                  <ArrowRight size={14} className="mt-0.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-500" />
                </div>
                <p className="line-clamp-2 text-sm font-bold text-navy-950">
                  {c.name}
                </p>
                <p className="line-clamp-2 text-[11px] text-slate-500">
                  {c.description || "No description"}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <GraduationCap size={12} />
                  {c.student_count} student{c.student_count === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
