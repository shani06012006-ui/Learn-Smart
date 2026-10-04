// frontend/src/features/admin/pages/AdminTeachersPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCog, Eye, Pencil, Plus, Shield, ShieldOff } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Pager from "../../../components/ui/Pager";
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

export default function AdminTeachersPage() {
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [toggleActive, { isLoading: isToggling }] = useToggleAdminUserActiveMutation();
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  const queryParams = { page, role: "teacher" };
  if (search.trim()) queryParams.q = search.trim();
  if (activeFilter === "active") queryParams.is_active = true;
  if (activeFilter === "inactive") queryParams.is_active = false;

  const { data, isLoading, isError, error, refetch } = useGetAdminUsersQuery(queryParams);

  const teachers = data?.results || [];
  const count = data?.count || 0;

  const handleToggle = async (teacher) => {
    setPendingId(teacher.id);
    try {
      await toggleActive({
        id: teacher.id,
        is_active: !teacher.is_active,
      }).unwrap();
    } catch {
      // Silent — the row will reflect the server state on refetch.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Teachers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage teachers on the platform.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          Add teacher
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex items-center gap-2">
          <label
            htmlFor="teacher-status-filter"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Status
          </label>
          <select
            id="teacher-status-filter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <div className="relative min-w-[14rem] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading && <LoadingState label="Loading teachers..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && teachers.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <UserCog size={22} />
          </span>
          <p className="font-display text-base font-extrabold text-navy-950">
            No teachers yet
          </p>
          <p className="max-w-md text-sm text-slate-500">
            Add the first teacher to your platform.
          </p>
        </div>
      )}

      {!isLoading && !isError && teachers.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Teacher</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Institution</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Joined</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => {
                  const isPending = pendingId === t.id && isToggling;
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            userId={t.id}
                            initials={
                              (t.full_name || t.email || "?")
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
                              to={`/admin/teachers/${t.id}`}
                              className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
                            >
                              {t.full_name || "—"}
                            </Link>
                            <p className="truncate text-xs text-slate-400">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600">
                        {t.institution?.name || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={t.is_active ? "success" : "danger"} dot>
                          {t.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-500">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/teachers/${t.id}`}>
                            <Button size="sm" variant="secondary">
                              <Eye size={13} />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditUser(t)}
                          >
                            <Pencil size={13} />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={t.is_active ? "secondary" : "primary"}
                            disabled={isPending}
                            loading={isPending}
                            onClick={() => handleToggle(t)}
                          >
                            {t.is_active ? (
                              <>
                                <ShieldOff size={13} />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Shield size={13} />
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
        defaultRole="teacher"
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