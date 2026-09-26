import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";

import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import Pager from "../../../components/ui/Pager";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetAdminAuditLogsQuery,
  useGetAdminAuditActionsQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

// Action → badge tone. Grouped by prefix so new whitelist entries fall
// back gracefully (e.g. user.* → brand) without touching the UI.
function actionTone(action) {
  if (action.startsWith("auth.login.success")) return "success";
  if (action.startsWith("auth.login.failed")) return "danger";
  if (action.startsWith("auth.login.blocked")) return "danger";
  if (action.startsWith("auth.password_reset")) return "warning";
  if (action.startsWith("auth.")) return "brand";
  if (action.startsWith("user.")) return "brand";
  if (action.startsWith("session")) return "warning";
  if (action.startsWith("course.")) return "success";
  return "neutral";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAuditLogPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, search]);

  const queryParams = { page };
  if (actionFilter) queryParams.action = actionFilter;
  if (search.trim()) queryParams.q = search.trim();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminAuditLogsQuery(queryParams);

  const { data: actionsData } = useGetAdminAuditActionsQuery();

  const rows = data?.results || [];
  const count = data?.count || 0;

  const actionOptions = useMemo(
    () => actionsData?.results || [],
    [actionsData]
  );

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Audit log
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Every privileged action taken in your institution, in order.
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="audit-action-filter"
            className="text-sm font-medium text-ink-700"
          >
            Action
          </label>
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All actions</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
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
            placeholder="Search action or resource type"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading audit log..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          title="No audit events yet"
          message="Privileged actions will appear here as they happen."
        />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
            <table className="w-full">
              <thead className="border-b border-ink-200 bg-ink-100/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    When
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Actor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className="cursor-pointer border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                      {formatDateTime(row.occurred_at)}
                    </td>
                    <td className="px-4 py-3">
                      {row.actor ? (
                        <Link
                          to={`/admin/users/${row.actor.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="focus-ring text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                        >
                          {row.actor.full_name || row.actor.email}
                        </Link>
                      ) : (
                        <span className="text-xs uppercase tracking-wide text-ink-500">
                          {row.actor_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={actionTone(row.action)}>
                        {row.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {row.resource_type ? (
                        <span>
                          {row.resource_type}
                          {row.resource_id && (
                            <span className="ml-1 text-xs text-ink-400">
                              #{row.resource_id.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-500">
                      {row.ip_address || "—"}
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

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-card bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Audit event
                </p>
                <p className="mt-1 text-sm text-ink-900">
                  {formatDateTime(selected.occurred_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="focus-ring rounded p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <dl className="flex flex-col gap-3 text-sm">
              <Row label="Action">
                <Badge variant={actionTone(selected.action)}>
                  {selected.action}
                </Badge>
              </Row>
              <Row label="Actor">
                {selected.actor ? (
                  <Link
                    to={`/admin/users/${selected.actor.id}`}
                    className="text-brand-600 hover:underline"
                  >
                    {selected.actor.full_name || selected.actor.email}
                  </Link>
                ) : (
                  <span className="uppercase tracking-wide text-ink-500">
                    {selected.actor_type}
                  </span>
                )}
              </Row>
              <Row label="Resource">
                {selected.resource_type || "—"}
                {selected.resource_id ? ` #${selected.resource_id}` : ""}
              </Row>
              <Row label="IP address">
                {selected.ip_address || "—"}
              </Row>
              <Row label="User agent">
                <span className="break-all text-xs text-ink-500">
                  {selected.user_agent || "—"}
                </span>
              </Row>
              <Row label="Metadata">
                <pre className="mt-1 max-h-64 overflow-auto rounded bg-ink-100 p-3 text-xs text-ink-700">
                  {JSON.stringify(selected.metadata || {}, null, 2)}
                </pre>
              </Row>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-t border-ink-100 pt-3 first:border-t-0 first:pt-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </dt>
      <dd className="min-w-0 text-ink-900">{children}</dd>
    </div>
  );
}