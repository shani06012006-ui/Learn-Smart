// frontend/src/components/layout/Navbar.jsx
import { Menu, LogOut, GraduationCap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../../hooks/useAuth";
import { sidebarToggled } from "../../store/slices/uiSlice";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import { getNavbarConfig } from "./chromeConfig";

export default function Navbar({ role = "student" }) {
  const config = getNavbarConfig(role);
  const { user, logout } = useAuth();
  const dispatch = useDispatch();

  return (
    <header
      className={
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-6 " +
        config.headerClass
      }
    >
      <div className="flex items-center gap-3">
        <button
          className={
            "rounded-md p-2 md:hidden " + config.iconButtonClass
          }
          onClick={() => dispatch(sidebarToggled())}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <div className={"flex items-center gap-2 " + config.brandTextClass}>
          <GraduationCap size={20} className={config.brandIconClass} />
          <span className="hidden font-semibold sm:inline">Learn Smart</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
            config.roleBadgeClass
          }
        >
          {role}
        </span>

        <NotificationBell />

        <button
          type="button"
          onClick={logout}
          className={
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
            config.iconButtonClass
          }
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  );
}
