import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useSelector } from "react-redux";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import UsersTable from "../components/UsersTable";
import CreateUserModal from "../components/CreateUserModal";
import { useGetAdminUsersQuery } from "../../../store/api/realApi";
import { selectAdminUser } from "../../../store/slices/adminAuthSlice";
import { extractErrorMessage } from "../../../utils/apiError";

export default function AdminUsersPage() {
  const currentUser = useSelector(selectAdminUser);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = {};
  if (roleFilter) queryParams.role = roleFilter;
  if (search.trim()) queryParams.q = search.trim();

  const { data, isLoading, isError, error, refetch } =
    useGetAdminUsersQuery(queryParams);

  const users = data?.results || [];

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Users
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage teachers and students in your institution.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Create user
        </Button>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="admin-role-filter"
            className="text-sm font-medium text-ink-700"
          >
            Role
          </label>
          <select
            id="admin-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="relative flex-1 min-w-[14rem] max-w-sm">
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

      {isLoading && <LoadingState label="Loading users..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && (
        <UsersTable users={users} currentUserId={currentUser?.id} />
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}