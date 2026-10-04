// frontend/src/features/admin/components/RecentUsersTable.jsx
import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";

const ROLE_COLORS = {
  admin:   "bg-purple-50 text-purple-600",
  teacher: "bg-emerald-50 text-emerald-600",
  student: "bg-coral-50 text-coral-600",
};

const ROLE_DOT_GRADIENTS = {
  admin:   "from-purple-500 to-purple-700",
  teacher: "from-emerald-500 to-teal-600",
  student: "from-coral-500 to-coral-700",
};

export default function RecentUsersTable({ users }) {
  const rows = users || [];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Recent users
        </h2>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-500 transition-transform hover:translate-x-0.5"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Users size={22} className="text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No users yet</p>
          <p className="text-xs text-slate-400">
            Create the first teacher or student to see them here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((u) => {
            const initials =
              (u.full_name || u.email || "?")
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase() || "?";
            const roleColor = ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600";
            const dotGrad = ROLE_DOT_GRADIENTS[u.role] || "from-slate-400 to-slate-600";

            return (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${dotGrad} text-[10px] font-bold text-white`}>
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-950">
                    {u.full_name || "—"}
                  </p>
                  <p className="truncate text-xs text-slate-400">{u.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
                  {u.role}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                    u.is_active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}