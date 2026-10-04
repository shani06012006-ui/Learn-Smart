// frontend/src/features/admin/pages/AdminAttendancePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ClipboardCheck, GraduationCap, UserCog, X,
  UserCheck, Clock, Calendar as CalendarIcon, BookOpen, User,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Pager from "../../../components/ui/Pager";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetAdminTeacherAttendanceQuery,
  useGetAdminStudentAttendanceQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

const STATUS_VARIANT = {
  present: "success",
  late: "warning",
  absent: "danger",
};

function todayIso() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/* Small stat card */
function StatMini({ label, value, tone = "purple", icon: Icon }) {
  const TONE = {
    purple:  { chip: "bg-purple-50 text-purple-600",  bar: "bg-purple-500" },
    emerald: { chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
    coral:   { chip: "bg-coral-50 text-coral-600",     bar: "bg-coral-500" },
  };
  const t = TONE[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar} opacity-70 group-hover:opacity-100`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-navy-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.chip}`}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}

/* One attendance row */
function AttendanceRow({ row, type }) {
  const isTeacher = type === "teachers";
  const person = isTeacher ? row.teacher : row.student;
  const linkPrefix = isTeacher ? "/admin/teachers" : "/admin/students";

  if (!person) return null;

  const initials =
    (person.full_name || person.email || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <li className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 lg:flex-row lg:items-center lg:gap-5">
      {/* Person */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar userId={person.id} initials={initials} size="md" />
        <div className="min-w-0 flex-1">
          <Link
            to={`${linkPrefix}/${person.id}`}
            className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
          >
            {person.full_name || "—"}
          </Link>
          <p className="truncate text-xs text-slate-400">{person.email}</p>
        </div>
      </div>

      {/* Context (class for students) */}
      {!isTeacher && row.class_course && (
        <div className="flex min-w-0 items-center gap-2 lg:w-56">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <BookOpen size={12} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            {row.class_course.id ? (
              <Link
                to={`/admin/courses/${row.class_course.id}`}
                className="block truncate text-xs font-bold text-navy-950 transition-colors hover:text-purple-500"
              >
                {row.class_course.name}
              </Link>
            ) : (
              <p className="truncate text-xs font-bold text-navy-950">
                {row.class_course.name}
              </p>
            )}
            <p className="truncate text-[10px] text-slate-400">
              {row.class_course.subject}
              {row.class_course.teacher?.full_name ? ` · ${row.class_course.teacher.full_name}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Time chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {isTeacher ? (
          <>
            <TimeChip icon={Clock} label="First" value={formatTime(row.first_seen_at)} />
            <TimeChip icon={Clock} label="Last" value={formatTime(row.last_seen_at)} />
            <TimeChip icon={UserCheck} label="Duration" value={formatDuration(row.duration_seconds)} />
          </>
        ) : (
          <>
            <TimeChip icon={Clock} label="Joined" value={formatTime(row.joined_at)} />
            <TimeChip icon={Clock} label="Left" value={formatTime(row.left_at)} />
            <TimeChip icon={UserCheck} label="Duration" value={formatDuration(row.duration_seconds)} />
          </>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between gap-3 lg:w-32 lg:justify-end">
        <Badge variant={STATUS_VARIANT[row.status] || "neutral"} dot>
          {row.status}
        </Badge>
      </div>
    </li>
  );
}

function TimeChip({ icon: Icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100">
      <Icon size={11} className="text-slate-400" />
      <span className="text-slate-400">{label}:</span>
      <span className="tabular-nums text-navy-950">{value}</span>
    </span>
  );
}

/* Page */
export default function AdminAttendancePage() {
  const [tab, setTab] = useState("teachers");
  const [date, setDate] = useState(todayIso());
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [tab, date, statusFilter, search]);

  const queryParams = { page, date };
  if (statusFilter) queryParams.status = statusFilter;
  if (search.trim()) queryParams.q = search.trim();

  const teachers = useGetAdminTeacherAttendanceQuery(queryParams, {
    skip: tab !== "teachers",
  });
  const students = useGetAdminStudentAttendanceQuery(queryParams, {
    skip: tab !== "students",
  });

  const active = tab === "teachers" ? teachers : students;
  const { data, isLoading, isError, error, refetch } = active;

  const rows = data?.results || [];
  const count = data?.count || 0;

  const presentCount = rows.filter((r) => r.status === "present").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Daily attendance across your platform. Rows are created automatically
            when users are active.
          </p>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatMini label={`Total ${tab}`} value={count} tone="purple" icon={ClipboardCheck} />
        <StatMini label="Present (this page)" value={presentCount} tone="emerald" icon={UserCheck} />
        <StatMini
          label="Selected date"
          value={new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          tone="coral"
          icon={CalendarIcon}
        />
      </div>

      {/* Tabs — pill style */}
      <div className="flex items-center gap-1.5 rounded-full bg-slate-50 p-1 self-start">
        <TabPill
          active={tab === "teachers"}
          onClick={() => setTab("teachers")}
          icon={UserCog}
        >
          Teachers
        </TabPill>
        <TabPill
          active={tab === "students"}
          onClick={() => setTab("students")}
          icon={GraduationCap}
        >
          Students
        </TabPill>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date */}
          <div className="flex items-center gap-2">
            <label htmlFor="attendance-date" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Date
            </label>
            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 p-1">
            {[{v:"",l:"All"},{v:"present",l:"Present"}].map(({v,l}) => {
              const isActive = statusFilter === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setStatusFilter(v)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-purple-500 text-white shadow-purple-glow"
                      : "text-slate-500 hover:text-navy-950"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative min-w-[14rem] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "teachers" ? "Search teacher by name or email" : "Search student or class"}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-950"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-block">
            {count} {count === 1 ? "record" : "records"}
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoading && <LoadingState label="Loading attendance..." />}

      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && rows.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <ClipboardCheck size={26} strokeWidth={2} />
          </span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">
            {tab === "teachers"
              ? "No teacher attendance for this date"
              : "No student attendance for this date"}
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Records appear here when users are active on the platform. Try a
            different date.
          </p>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => (
                <AttendanceRow key={row.id} row={row} type={tab} />
              ))}
            </ul>
          </div>

          <Pager page={page} count={count} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

/* Pill-style tab */
function TabPill({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
        active
          ? "bg-purple-500 text-white shadow-purple-glow"
          : "text-slate-500 hover:text-navy-950"
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}