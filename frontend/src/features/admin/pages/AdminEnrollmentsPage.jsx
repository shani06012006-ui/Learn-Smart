import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardList, Eye } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Pager from "../../../components/ui/Pager";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import { useGetAdminEnrollmentsQuery } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

const STATUS_VARIANT = {
  active: "success",
  pending: "warning",
  blocked: "danger",
  removed: "neutral",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminEnrollmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const queryParams = { page };
  if (statusFilter) queryParams.status = statusFilter;
  if (search.trim()) queryParams.q = search.trim();

  const { data, isLoading, isError, error, refetch } =
    useGetAdminEnrollmentsQuery(queryParams);

  const enrollments = data?.results || [];
  const count = data?.count || 0;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Enrollments
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Every student enrollment across your institution.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="enrollment-status-filter"
            className="text-sm font-medium text-ink-700"
          >
            Status
          </label>
          <select
            id="enrollment-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
            <option value="removed">Removed</option>
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
            placeholder="Search student or class"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading enrollments..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && enrollments.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No enrollments match the current filter"
          message="Students appear here once they join a class."
        />
      )}

      {!isLoading && !isError && enrollments.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
            <table className="w-full">
              <thead className="border-b border-ink-200 bg-ink-100/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          userId={e.student?.id}
                          initials={
                            (e.student?.full_name || e.student?.email || "?")
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
                            to={`/admin/students/${e.student?.id}`}
                            className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                          >
                            {e.student?.full_name || "—"}
                          </Link>
                          <p className="truncate text-xs text-ink-500">
                            {e.student?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {e.class_course?.id ? (
                        <Link
                          to={`/admin/courses/${e.class_course.id}`}
                          className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                        >
                          {e.class_course.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-ink-700">—</span>
                      )}
                      <p className="truncate text-xs text-ink-500">
                        {e.class_course?.subject}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {e.class_course?.teacher?.full_name || (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={STATUS_VARIANT[e.status] || "neutral"}
                        dot
                      >
                        {e.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                      {formatDate(e.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/students/${e.student?.id}`}>
                          <Button size="sm" variant="secondary">
                            <Eye size={14} />
                            Student
                          </Button>
                        </Link>
                        <Link to={`/admin/courses/${e.class_course?.id}`}>
                          <Button size="sm" variant="secondary">
                            <Eye size={14} />
                            Class
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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