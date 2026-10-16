// frontend/src/components/layout/Navbar.jsx
import { Menu, LogOut, GraduationCap } from "lucide-react";
import { useDispatch } from "react-redux";

import { useAuth } from "../../hooks/useAuth";
import { sidebarToggled } from "../../store/slices/uiSlice";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import { getRoleConfig } from "../../config/roleConfig";

export default function Navbar({ role = "student" }) {
  const R = getRoleConfig(role);
  const { logout } = useAuth();
  const dispatch = useDispatch();

  return (
    <header
      className={
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-6 " +
        R.navbar.wrapper
      }
    >
      <div className="flex items-center gap-3">
        <button
          className={"rounded-md p-2 md:hidden " + R.navbar.iconButton}
          onClick={() => dispatch(sidebarToggled())}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <div className={"flex items-center gap-2 " + R.navbar.brandText}>
          <GraduationCap size={20} className={R.navbar.brandIcon} />
          <span className="hidden font-semibold sm:inline">Learn Smart</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
            R.navbar.roleBadge
          }
        >
          {R.label}
        </span>

        <NotificationBell />

        <button
          type="button"
          onClick={logout}
          className={
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
            R.navbar.iconButton
          }
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  );
}