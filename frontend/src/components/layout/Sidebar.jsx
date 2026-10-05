import { NavLink, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  Megaphone,
  BarChart3,
  MessageSquare,
  Video,
  Trophy,
  KeyRound,
  CalendarDays,
  LogOut,
} from "lucide-react";

import { sidebarClosed } from "../../store/slices/uiSlice";
import { useAuth } from "../../hooks/useAuth";

const TEACHER_ITEMS = [
  { label: "Dashboard",     to: "/teacher",                    icon: LayoutDashboard, end: true },
  { label: "Classes",       to: "/teacher/classes",            icon: BookOpen },
  { label: "Students",      to: "/teacher/students",           icon: GraduationCap },
  { label: "Timetable",     to: "/teacher/timetable",          icon: CalendarDays },
  { label: "Materials",     to: "/teacher/materials",          icon: FileText },
  { label: "Announcements", to: "/teacher/announcements",      icon: Megaphone },
  { label: "AI Insights",   to: "/teacher/analytics",          icon: BarChart3, disabled: true, note: "Module E" },
  { label: "Live Classes",  to: "/teacher/live-classes",       icon: Video },
  { label: "Messages",      to: "/teacher/chat",               icon: MessageSquare },
];

const STUDENT_ITEMS = [
  { label: "Dashboard",     to: "/student",                    icon: LayoutDashboard, end: true },
  { label: "My Classes",    to: "/student/classes",            icon: BookOpen },
  { label: "Timetable",     to: "/student/timetable",          icon: CalendarDays },
  { label: "Join a class",  to: "/student/join-class",         icon: KeyRound },
  { label: "Materials",     to: "/student/materials",          icon: FileText },
  { label: "Announcements", to: "/student/announcements",      icon: Megaphone },
  { label: "Performance",   to: "/student/performance",        icon: Trophy },
  { label: "Live Classes",  to: "/student/live-classes",       icon: Video },
  { label: "Messages",      to: "/student/chat",               icon: MessageSquare },
];

export default function Sidebar({ role }) {
  const items = role === "teacher" ? TEACHER_ITEMS : STUDENT_ITEMS;
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const displayName = user?.full_name
    || (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : null)
    || user?.email
    || "User";

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
          "fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0",
          sidebarOpen && "translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="border-b border-slate-100 px-5 py-5">
          <Link to={role === "teacher" ? "/teacher" : "/student"} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-glow">
              <span className="text-sm font-black leading-none text-white">E</span>
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-navy-950">
                Eduvi
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {role === "teacher" ? "Teacher" : "Student"}
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <li key={item.label}>
                    <div
                      className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300"
                      title={`Coming in ${item.note}`}
                    >
                      <Icon size={16} />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="text-[10px]">{item.note}</span>
                    </div>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    end={!!item.end}
                    onClick={() => dispatch(sidebarClosed())}
                    className={({ isActive }) =>
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors " +
                      (isActive
                        ? "bg-purple-500 text-white shadow-purple-glow"
                        : "text-slate-500 hover:bg-purple-50 hover:text-navy-950")
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
        <div className="border-t border-slate-100 px-3 py-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-[10px] font-bold text-white">
              {user?.first_name?.[0]?.toUpperCase()
                || user?.email?.[0]?.toUpperCase()
                || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-navy-950">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {user?.email}
              </p>
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
    </>
  );
}
