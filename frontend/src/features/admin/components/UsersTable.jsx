import { useState } from "react";
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
      // The UI reflects whatever the server returns on refetch. Silent
      // failure is fine here — the row stays where it was.
    } finally {
      setPendingId(null);
    }
  };

  if (!users || users.length === 0) {
    return (
      <div className="rounded-card border border-ink-300 bg-white p-8 text-center text-sm text-ink-500">
        No users match the current filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
      <table className="w-full">
        <thead className="border-b border-ink-200 bg-ink-100/40">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              Institution
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
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            const isPending = pendingId === u.id && isToggling;
            return (
              <tr
                key={u.id}
                className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
              >
                <td className="px-4 py-3">
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
                      <p className="truncate text-sm font-medium text-ink-900">
                        {u.full_name || "—"}
                      </p>
                      <p className="truncate text-xs text-ink-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[u.role] || "neutral"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-ink-700">
                  {u.institution?.name || (
                    <span className="text-ink-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.is_active ? "success" : "danger"} dot>
                    {u.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(u)}
                    >
                      <Pencil size={14} />
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
  );
}