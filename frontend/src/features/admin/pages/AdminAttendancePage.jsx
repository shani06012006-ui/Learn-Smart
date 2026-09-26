import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ClipboardCheck,
  GraduationCap,
  UserCog,
  Eye,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Pager from "../../../components/ui/Pager";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetAdminTeacherAttendanceQuery,
  useGetAdminStudentAttendanceQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

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

const STATUS_VARIANT = {
  present: "success",
};

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

  // Both hooks always run; the unused one stays skipped via `skip`.
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

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Daily attendance for your institution. Rows are created
            automatically when users are active on the platform.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-ink-200">
        <TabButton
          active={tab === "teachers"}
          onClick={() => setTab("teachers")}
          icon={UserCog}
        >
          Teachers
        </TabButton>
        <TabButton
          active={tab === "students"}
          onClick={() => setTab("students")}
          icon={GraduationCap}
        >
          Students
        </TabButton>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="attendance-date"
            className="text-sm font-medium text-ink-700"
          >
            Date
          </label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="attendance-status"
            className="text-sm font-medium text-ink-700"
          >
            Status
          </label>
          <select
            id="attendance-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
          </select>
        </div>

        <div className="relative min-w-[14rem] max-w-sm flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === "teachers"
                ? "Search teacher by email or name"
                : "Search student or class"
            }
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading attendance..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          icon={ClipboardCheck}
          title={
            tab === "teachers"
              ? "No teacher attendance for this date"
              : "No student attendance for this date"
          }
          message="Records appear here when users are active on the platform."
        />
      )}

      {!isLoading && !isError && rows.length > 0 && tab === "teachers" && (
        <>
          <TeacherTable rows={rows} />
          <Pager
            page={page}
            count={count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {!isLoading && !isError && rows.length > 0 && tab === "students" && (
        <>
          <StudentTable rows={rows} />
          <Pager
            page={page}
            count={count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- tables

function TeacherTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
      <table className="w-full">
        <thead className="border-b border-ink-200 bg-ink-100/40">
          <tr>
            <Th>Teacher</Th>
            <Th>Date</Th>
            <Th>First online</Th>
            <Th>Last online</Th>
            <Th>Duration</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
            >
              <td className="px-4 py-3">
                <UserCell user={row.teacher} linkPrefix="/admin/teachers" />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {row.date}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {formatTime(row.first_seen_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {formatTime(row.last_seen_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {formatDuration(row.duration_seconds)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[row.status] || "neutral"} dot>
                  {row.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Link to={`/admin/teachers/${row.teacher.id}`}>
                  <Button size="sm" variant="secondary">
                    <Eye size={14} />
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
      <table className="w-full">
        <thead className="border-b border-ink-200 bg-ink-100/40">
          <tr>
            <Th>Student</Th>
            <Th>Class</Th>
            <Th>Date</Th>
            <Th>Joined</Th>
            <Th>Left</Th>
            <Th>Duration</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
            >
              <td className="px-4 py-3">
                <UserCell user={row.student} linkPrefix="/admin/students" />
              </td>
              <td className="px-4 py-3">
                {row.class_course?.id ? (
                  <Link
                    to={`/admin/courses/${row.class_course.id}`}
                    className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                  >
                    {row.class_course.name}
                  </Link>
                ) : (
                  <span className="text-sm text-ink-700">—</span>
                )}
                <p className="truncate text-xs text-ink-500">
                  {row.class_course?.subject}
                  {row.class_course?.teacher?.full_name
                    ? ` · ${row.class_course.teacher.full_name}`
                    : ""}
                </p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {row.date}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {formatTime(row.joined_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {formatTime(row.left_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                {formatDuration(row.duration_seconds)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[row.status] || "neutral"} dot>
                  {row.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Link to={`/admin/students/${row.student.id}`}>
                  <Button size="sm" variant="secondary">
                    <Eye size={14} />
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------------------- helpers

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "focus-ring flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors " +
        (active
          ? "-mb-px border border-b-white border-ink-200 bg-white text-ink-900"
          : "text-ink-500 hover:text-ink-900")
      }
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

function Th({ children, align = "left" }) {
  const alignment = align === "right" ? "text-right" : "text-left";
  return (
    <th
      className={`px-4 py-3 ${alignment} text-xs font-semibold uppercase tracking-wide text-ink-500`}
    >
      {children}
    </th>
  );
}

function UserCell({ user, linkPrefix }) {
  if (!user) return <span className="text-ink-400">—</span>;
  return (
    <div className="flex items-center gap-3">
      <Avatar
        userId={user.id}
        initials={
          (user.full_name || user.email || "?")
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase() || "?"
        }
        size="sm"
      />
      <div className="min-w-0">
        <Link
          to={`${linkPrefix}/${user.id}`}
          className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
        >
          {user.full_name || "—"}
        </Link>
        <p className="truncate text-xs text-ink-500">{user.email}</p>
      </div>
    </div>
  );
}