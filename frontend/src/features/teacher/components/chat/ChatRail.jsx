// frontend/src/features/teacher/components/chat/ChatRail.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, LayoutDashboard, Calendar, Settings, LogOut, Users } from "lucide-react";
import Avatar from "../../../../components/ui/Avatar";
import { useAuth } from "../../../../hooks/useAuth";

export default function ChatRail() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, path: "/teacher", label: "Dashboard" },
    { icon: Users, path: "/teacher/students", label: "Students" },
    { icon: Calendar, path: "/teacher/timetable", label: "Timetable" },
    { icon: MessageSquare, path: "/teacher/chat", label: "Messages" },
  ];

  return (
    <div className="flex h-full w-[70px] flex-col items-center justify-between border-r border-slate-200 bg-slate-50 py-6">
      <div className="flex flex-col items-center gap-6">
        {/* Brand/User Avatar */}
        <Avatar userId={user?.id} initials={user?.first_name?.[0] || "T"} size="md" />

        {/* Nav Links */}
        <div className="flex flex-col gap-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-all " +
                  (isActive
                    ? "bg-purple-100 text-purple-700 shadow-sm"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700")
                }
              >
                <Icon size={22} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3">
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
          <Settings size={22} />
        </button>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
        >
          <LogOut size={22} />
        </button>
      </div>
    </div>
  );
}