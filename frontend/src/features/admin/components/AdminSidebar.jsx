import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, LogOut } from "lucide-react";

import { useAdminAuth } from "../hooks/useAdminAuth";

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
];

export default function AdminSidebar() {
  const { user, logout } = useAdminAuth();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-900 text-ink-100">
      {/* Brand */}
      <div className="border-b border-ink-800 px-5 py-4">
        <Link to="/admin" className="focus-ring flex items-center gap-2 rounded-md">
          <GraduationCap size={20} className="text-brand-400" />
          <div>
            <p className="text-sm font-semibold text-white">Learn Smart</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-400">
              Admin Console
            </p>
          </div>
        </Link>
      </div>

      {/* Institution */}
      {user?.institution && (
        <div className="border-b border-ink-800 px-5 py-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-500">
            Institution
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-white">
            {user.institution.name}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (isActive
                    ? "bg-brand-600 text-white"
                    : "text-ink-300 hover:bg-ink-800 hover:text-white")
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-ink-800 px-3 py-3">
        <div className="mb-2 px-3">
          <p className="truncate text-xs font-medium text-white">
            {user?.first_name
              ? `${user.first_name} ${user.last_name || ""}`.trim()
              : user?.email}
          </p>
          <p className="truncate text-[10px] text-ink-500">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-800 hover:text-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}