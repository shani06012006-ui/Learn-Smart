// frontend/src/features/admin/components/AdminSidebar.jsx
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  UserCog,
  BookOpen,
  GraduationCap,
  LogOut,
  Monitor,
  ClipboardCheck,
  CalendarDays,
  CalendarX,
  MessageSquare,
  Layers,
} from "lucide-react";

import { useAdminAuth } from "../../../hooks/useAdminAuth";
import {
  useGetStudentLeavesQuery,
  useGetTeacherLeavesQuery,
} from "../../../store/api/realApi";

const NAV_ITEMS = [
  { to: "/admin",              end: true, label: "Dashboard",  icon: LayoutDashboard },
  { to: "/admin/courses",                 label: "Courses",    icon: BookOpen },
  { to: "/admin/grades",                  label: "Grades",     icon: Layers },
  { to: "/admin/teachers",                label: "Teachers",   icon: UserCog },
  { to: "/admin/students",                label: "Students",   icon: GraduationCap },
  { to: "/admin/attendance",              label: "Attendance", icon: ClipboardCheck },
  { to: "/admin/timetable",               label: "Timetable",  icon: CalendarDays },
  { to: "/admin/leaves",                  label: "Leaves",     icon: CalendarX, badgeKey: "leaves" },
  { to: "/admin/sessions",                label: "Sessions",   icon: Monitor },
  { to: "/admin/messages",                label: "Messages",   icon: MessageSquare },
];

export default function AdminSidebar() {
  const { user, logout } = useAdminAuth();

  const { data: pendingStudentLeaves } = useGetStudentLeavesQuery({ status: "pending", page: 1 });
  const { data: pendingTeacherLeaves } = useGetTeacherLeavesQuery({ status: "pending", page: 1 });
  const pendingLeaves =
    (pendingStudentLeaves?.count ?? 0) + (pendingTeacherLeaves?.count ?? 0);
  const badgeCounts = { leaves: pendingLeaves };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="border-b border-slate-100 px-5 py-5">
        <Link to="/admin" className="flex items-center gap-2.5">
          {/* HERE IS YOUR IMAGE — logo mark — paste a URL over the gradient below */}
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 shadow-coral-glow">
            <span className="text-sm font-black leading-none text-white">M</span>
          </span>
          <div>
            <p className="font-display text-sm font-extrabold text-navy-950">
              Learn Smart
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Platform Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Platform info */}
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Platform
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">
          Learn Smart Platform
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, badgeKey }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors " +
                  (isActive
                    ? "bg-purple-500 text-white shadow-purple-glow"
                    : "text-slate-500 hover:bg-purple-50 hover:text-navy-950")
                }
              >
                <Icon size={16} />
                <span className="flex-1 truncate">{label}</span>
                {badgeKey && badgeCounts[badgeKey] > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">
                    {badgeCounts[badgeKey]}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-100 px-3 py-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-[10px] font-bold text-white">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-navy-950">
              {user?.first_name
                ? `${user.first_name} ${user.last_name || ""}`.trim()
                : user?.email}
            </p>
            <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-coral-50 hover:text-coral-600"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}