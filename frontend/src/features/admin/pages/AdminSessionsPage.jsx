import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Monitor, X } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Pager from "../../../components/ui/Pager";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

const STATUS_VARIANT = {
  active: "success",
  revoked: "danger",
  expired: "neutral",
};

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

function shortUserAgent(ua) {
  if (!ua) return "—";
  // First token is usually enough to identify browser/OS.
  return ua.split(" ")[0] || ua;
}

export default function AdminSessionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const queryParams = { page };
  if (statusFilter) queryParams.status = statusFilter;
  if (search.trim()) queryParams.q = search.trim();

  const { data, isLoading, isError, error, refetch } =
    useGetAdminSessionsQuery(queryParams);

  const [revokeSession, { isLoading: isRevoking }] =
    useRevokeAdminSessionMutation();

  const rows = data?.results || [];
  const count = data?.count || 0;

  const handleRevoke = async (session) => {
    try {
      await revokeSession(session.id).unwrap();
      setConfirmRevoke(null);
    } catch {
      // Silent — the table refetches via tag invalidation.
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Sessions
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Every active login across your institution. Revoke any session to
            sign the device out immediately.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="session-status-filter"
            className="text-sm font-medium text-ink-700"
          >
            Status
          </label>
          <select
            id="session-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
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
            placeholder="Search device, IP, or user email"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading sessions..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          icon={Monitor}
          title="No sessions match the current filter"
          message="Active logins will appear here."
        />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
            <table className="w-full">
              <thead className="border-b border-ink-200 bg-ink-100/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Device
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Issued
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          userId={s.user?.id}
                          initials={
                            (s.user?.full_name || s.user?.email || "?")
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
                            to={`/admin/users/${s.user?.id}`}
                            className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                          >
                            {s.user?.full_name || "—"}
                          </Link>
                          <p className="truncate text-xs text-ink-500">
                            {s.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-ink-900">
                        {s.device_label || "—"}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {shortUserAgent(s.user_agent)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {s.ip_address || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                      {formatDateTime(s.issued_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[s.status] || "neutral"} dot>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "active" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmRevoke(s)}
                          disabled={isRevoking}
                        >
                          <X size={14} />
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
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

      {/* Confirm revoke dialog */}
      {confirmRevoke && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
          onClick={() => !isRevoking && setConfirmRevoke(null)}
        >
          <div
            className="w-full max-w-sm rounded-card bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-ink-900">
              Revoke this session?
            </h3>
            <p className="mt-2 text-sm text-ink-600">
              The user will be signed out on this device immediately. They can
              sign back in with their password.
            </p>
            <div className="mt-4 rounded-lg bg-ink-100 p-3 text-xs text-ink-700">
              <p>
                <span className="font-semibold">Device:</span>{" "}
                {confirmRevoke.device_label || "—"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">IP:</span>{" "}
                {confirmRevoke.ip_address || "—"}
              </p>
              <p className="mt-1 truncate">
                <span className="font-semibold">User:</span>{" "}
                {confirmRevoke.user?.email || "—"}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmRevoke(null)}
                disabled={isRevoking}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRevoke(confirmRevoke)}
                loading={isRevoking}
              >
                Revoke session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}