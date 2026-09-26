import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, GraduationCap, Eye, Pencil, Plus, Shield, ShieldOff } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Pager from "../../../components/ui/Pager";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import {
  useGetAdminUsersQuery,
  useToggleAdminUserActiveMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminStudentsPage() {
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [toggleActive, { isLoading: isToggling }] =
    useToggleAdminUserActiveMutation();
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  const queryParams = { page, role: "student" };
  if (search.trim()) queryParams.q = search.trim();
  if (activeFilter === "active") queryParams.is_active = true;
  if (activeFilter === "inactive") queryParams.is_active = false;

  const { data, isLoading, isError, error, refetch } =
    useGetAdminUsersQuery(queryParams);

  const students = data?.results || [];
  const count = data?.count || 0;

  const handleToggle = async (student) => {
    setPendingId(student.id);
    try {
      await toggleActive({
        id: student.id,
        is_active: !student.is_active,
      }).unwrap();
    } catch {
      // Silent — the row will reflect the server state on refetch.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Students
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage students in your institution.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Add student
        </Button>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="student-status-filter"
            className="text-sm font-medium text-ink-700"
          >
            Status
          </label>
          <select
            id="student-status-filter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
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
            placeholder="Search by email or name"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading students..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && students.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No students yet"
          message="Add a student or wait for one to join using a class code."
        />
      )}

      {!isLoading && !isError && students.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
            <table className="w-full">
              <thead className="border-b border-ink-200 bg-ink-100/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Institution
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
                {students.map((s) => {
                  const isPending = pendingId === s.id && isToggling;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            userId={s.id}
                            initials={
                              (s.full_name || s.email || "?")
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
                              to={`/admin/students/${s.id}`}
                              className="focus-ring block truncate text-sm font-medium text-ink-900 hover:text-brand-600 hover:underline"
                            >
                              {s.full_name || "—"}
                            </Link>
                            <p className="truncate text-xs text-ink-500">
                              {s.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-700">
                        {s.institution?.name || (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={s.is_active ? "success" : "danger"}
                          dot
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/students/${s.id}`}>
                            <Button size="sm" variant="secondary">
                              <Eye size={14} />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditUser(s)}
                          >
                            <Pencil size={14} />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={s.is_active ? "secondary" : "primary"}
                            disabled={isPending}
                            loading={isPending}
                            onClick={() => handleToggle(s)}
                          >
                            {s.is_active ? (
                              <>
                                <ShieldOff size={14} />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Shield size={14} />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultRole="student"
      />

      <EditUserModal
        open={!!editUser}
        user={editUser}
        onClose={() => {
          setEditUser(null);
          refetch();
        }}
      />
    </div>
  );
}