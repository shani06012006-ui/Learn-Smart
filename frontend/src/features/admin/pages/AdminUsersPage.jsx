// frontend/src/features/admin/pages/AdminUsersPage.jsx
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useSelector } from "react-redux";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Pager from "../../../components/ui/Pager";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import UsersTable from "../components/UsersTable";
import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import { useGetAdminUsersQuery } from "../../../store/api/realApi";
import { selectAdminUser } from "../../../store/slices/adminAuthSlice";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const currentUser = useSelector(selectAdminUser);
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, search, activeFilter]);

  const queryParams = {};
  if (roleFilter) queryParams.role = roleFilter;
  if (activeFilter === "active") queryParams.is_active = true;
  if (activeFilter === "inactive") queryParams.is_active = false;
  if (search.trim()) queryParams.q = search.trim();
  queryParams.page = page;

  const { data, isLoading, isError, error, refetch } =
    useGetAdminUsersQuery(queryParams);

  const users = data?.results || [];
  const count = data?.count || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Users
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage teachers, students, and admins on the platform.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          Create user
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex items-center gap-2">
          <label htmlFor="admin-role-filter" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Role
          </label>
          <select
            id="admin-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="admin-status-filter" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Status
          </label>
          <select
            id="admin-status-filter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="relative min-w-[14rem] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading && <LoadingState label="Loading users..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && (
        <>
          <UsersTable
            users={users}
            currentUserId={currentUser?.id}
            onEdit={setEditUser}
          />
          <Pager
            page={page}
            count={count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditUserModal
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
      />
    </div>
  );
}