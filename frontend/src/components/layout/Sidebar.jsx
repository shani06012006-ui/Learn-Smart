// frontend/src/components/layout/Sidebar.jsx
import { NavLink, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { LogOut } from "lucide-react";

import { sidebarClosed } from "../../store/slices/uiSlice";
import { useAuth } from "../../hooks/useAuth";
import { getRoleConfig } from "../../config/roleConfig";

export default function Sidebar({ role }) {
  const R = getRoleConfig(role);
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const displayName =
    user?.full_name ||
    (user?.first_name
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : null) ||
    user?.email ||
    "User";

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/50 md:hidden"
          onClick={() => dispatch(sidebarClosed())}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r transition-transform md:static md:translate-x-0",
          R.sidebar.wrapper,
          sidebarOpen && "translate-x-0",
        )}
      >
        {/* Brand */}
        <div className={clsx("border-b px-5 py-5", R.sidebar.divider)}>
          <Link
            to={role === "teacher" ? "/teacher" : "/student"}
            className="flex items-center gap-2.5"
          >
            <img
              src="/learn-smart-logo.png"
              alt="Learn Smart"
              className="h-20 w-auto object-contain"
            />
            <div>
              <p
                className={
                  "text-[10px] font-semibold uppercase tracking-wider " +
                  R.sidebar.brandLabel
                }
              >
                {R.longLabel}
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {R.sidebar.navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    end={!!item.end}
                    onClick={() => dispatch(sidebarClosed())}
                    className={({ isActive }) =>
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors " +
                      (isActive
                        ? R.sidebar.navItemActive
                        : R.sidebar.navItemIdle)
                    }
                  >
                    <Icon size={16} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + logout */}
        <div className={clsx("border-t px-3 py-3", R.sidebar.divider)}>
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div
              className={
                "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold " +
                R.sidebar.avatarClass
              }
            >
              {user?.first_name?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className={"truncate text-xs font-bold " + R.sidebar.userName}>
                {displayName}
              </p>
              <p className={"truncate text-[10px] " + R.sidebar.userEmail}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className={
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors " +
              R.sidebar.signOutClass
            }
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}