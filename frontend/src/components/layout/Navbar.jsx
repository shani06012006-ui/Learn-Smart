import { useCrossTabSync } from "../../hooks/useCrossTabSync";
import { Menu, LogOut, GraduationCap } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { sidebarToggled } from "../../store/slices/uiSlice";
import Badge from "../ui/Badge";
import NotificationBell from "../../features/notifications/components/NotificationBell";

export default function Navbar() {
  useCrossTabSync();
  const { user, logout } = useAuth();
  const dispatch = useDispatch();

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-300 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="focus-ring rounded-md p-2 text-ink-700 hover:bg-ink-100 md:hidden"
          onClick={() => dispatch(sidebarToggled())}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 text-ink-900">
          <GraduationCap size={20} className="text-brand-600" />
          <span className="hidden font-semibold sm:inline">Learn Smart</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink-900">{user?.full_name}</p>
          <Badge
            variant={user?.role === "teacher" ? "brand" : "neutral"}
            className="capitalize"
          >
            {user?.role}
          </Badge>
        </div>
        <NotificationBell />
        <button
          onClick={logout}
          className="focus-ring flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

