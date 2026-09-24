import { Link } from "react-router-dom";
import { Users } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";

const ROLE_VARIANT = {
  admin: "brand",
  teacher: "success",
  student: "neutral",
};


export default function RecentUsersTable({ users }) {
  const rows = users || [];

  return (
    <section className="rounded-card border border-ink-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-2 border-b border-ink-200 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Recent users
        </h2>
        <Link
          to="/admin/users"
          className="focus-ring rounded text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View all
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Users}
            title="No users yet"
            message="Create the first teacher or student to see them here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {rows.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar
                userId={u.id}
                initials={
                  (u.full_name || u.email || "?")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase() || "?"
                }
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">
                  {u.full_name || "—"}
                </p>
                <p className="truncate text-xs text-ink-500">{u.email}</p>
              </div>
              <Badge variant={ROLE_VARIANT[u.role] || "neutral"}>
                {u.role}
              </Badge>
              <Badge variant={u.is_active ? "success" : "danger"} dot>
                {u.is_active ? "Active" : "Inactive"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}