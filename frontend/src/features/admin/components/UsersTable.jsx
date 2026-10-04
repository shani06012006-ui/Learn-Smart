// frontend/src/features/admin/components/UsersTable.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Shield, ShieldOff } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { useToggleAdminUserActiveMutation } from "../../../store/api/realApi";

const ROLE_VARIANT = {
  admin: "brand",
  teacher: "success",
  student: "neutral",
};

export default function UsersTable({ users, currentUserId, onEdit }) {
  const [toggleActive, { isLoading: isToggling }] = useToggleAdminUserActiveMutation();
  const [pendingId, setPendingId] = useState(null);

  const handleToggle = async (user) => {
    setPendingId(user.id);
    try {
      await toggleActive({ id: user.id, is_active: !user.is_active }).unwrap();
    } catch {
      // Silent — the row reflects the server state on next refetch.
    } finally {
      setPendingId(null);
    }
  };

  if (!users || users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-slate-500">
          No users match the current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
      <table className="w-full">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">User</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Institution</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            const isPending = pendingId === u.id && isToggling;
            return (
              <tr
                key={u.id}
                className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/60"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
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
                    <div className="min-w-0">
                      <Link to={`/admin/users/${u.id}`} className="block min-w-0">
                        <p className="truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500">
                          {u.full_name || "—"}
                        </p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={ROLE_VARIANT[u.role] || "neutral"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">
                  {u.institution?.name || <span className="text-slate-400">—</span>}
                </td>
                <td className="px-5 py-3">
                  <Badge variant={u.is_active ? "success" : "danger"} dot>
                    {u.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(u)}>
                      <Pencil size={13} />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={u.is_active ? "secondary" : "primary"}
                      disabled={isSelf}
                      loading={isPending}
                      onClick={() => handleToggle(u)}
                      title={isSelf ? "You cannot change your own status" : ""}
                    >
                      {u.is_active ? (
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
  );
}