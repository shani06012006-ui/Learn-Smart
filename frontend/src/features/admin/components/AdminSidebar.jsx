// frontend/src/features/admin/components/AdminSidebar.jsx
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Layers, UserCog, GraduationCap,
  ClipboardCheck, CalendarDays, CalendarX, Monitor, MessageSquare,
  UserCheck, LogOut,
} from "lucide-react";
import { useAdminAuth } from "../../../hooks/useAdminAuth";
import {
  useGetStudentLeavesQuery,
  useGetTeacherLeavesQuery,
} from "../../../store/api/realApi";

const NAV_ITEMS = [
  { to: "/admin",              end: true, label: "Dashboard",     icon: LayoutDashboard },
  { to: "/admin/courses",                 label: "Courses",       icon: BookOpen },
  { to: "/admin/grades",                  label: "Grades",        icon: Layers },
  { to: "/admin/teachers",                label: "Teachers",      icon: UserCog },
  { to: "/admin/students",                label: "Students",      icon: GraduationCap },
  { to: "/admin/attendance",              label: "Attendance",    icon: ClipboardCheck },
  { to: "/admin/timetable",               label: "Timetable",     icon: CalendarDays },
  { to: "/admin/substitutions",           label: "Substitutions", icon: UserCheck },
  { to: "/admin/leaves",                  label: "Leaves",        icon: CalendarX, badgeKey: "leaves" },
  { to: "/admin/sessions",                label: "Sessions",      icon: Monitor },
  { to: "/admin/messages",                label: "Messages",      icon: MessageSquare },
];

/* =================================================================
   ADMIN PALETTE — slate / dark charcoal
   Change these 5 strings to restyle the entire admin sidebar.
   ================================================================= */
const ADMIN_PALETTE = {
  // Sidebar wrapper
  sidebarBg: "border-slate-800/60 bg-slate-900/85 backdrop-blur-md",

  // Brand + section text
  brandLabel: "text-slate-400",
  sectionLabel: "text-slate-500",
  sectionValue: "text-slate-100",

  // Nav links
  navItemActive: "bg-slate-700 text-white shadow-sm ring-1 ring-slate-600",
  navItemIdle: "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100",

  // Dividers
  divider: "border-slate-800/60",

  // Avatar
  avatarClass: "bg-gradient-to-br from-slate-600 to-slate-800 text-white",

  // User info
  userName: "text-slate-100",
  userEmail: "text-slate-500",

  // Sign out
  signOutClass: "text-slate-400 hover:bg-coral-500/10 hover:text-coral-400",
};

export default function AdminSidebar() {
  const { user, logout } = useAdminAuth();
  const P = ADMIN_PALETTE;

  const { data: pendingStudentLeaves } = useGetStudentLeavesQuery({ status: "pending", page: 1 });
  const { data: pendingTeacherLeaves } = useGetTeacherLeavesQuery({ status: "pending", page: 1 });
  const pendingLeaves =
    (pendingStudentLeaves?.count ?? 0) + (pendingTeacherLeaves?.count ?? 0);
  const badgeCounts = { leaves: pendingLeaves };

  return (
    <aside
      className={
        "flex h-full w-64 shrink-0 flex-col border-r " + P.sidebarBg
      }
    >
      {/* Brand */}
      <div className={"border-b px-5 py-5 " + P.divider}>
        <Link to="/admin" className="flex items-center gap-2.5">
          <img
            src="/learn-smart-logo.png"
            alt="Learn Smart"
            className="h-20 w-auto object-contain"
          />
          <div>
            <p className={"text-[10px] font-semibold uppercase tracking-wider " + P.brandLabel}>
              Platform Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Platform info */}
      <div className={"border-b px-5 py-3 " + P.divider}>
        <p className={"text-[10px] font-bold uppercase tracking-wider " + P.sectionLabel}>
          Platform
        </p>
        <p className={"mt-0.5 truncate text-sm font-semibold " + P.sectionValue}>
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
                  (isActive ? P.navItemActive : P.navItemIdle)
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
      <div className={"border-t px-3 py-3 " + P.divider}>
        <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
          <div
            className={
              "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold " +
              P.avatarClass
            }
          >
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className={"truncate text-xs font-bold " + P.userName}>
              {user?.first_name
                ? `${user.first_name} ${user.last_name || ""}`.trim()
                : user?.email}
            </p>
            <p className={"truncate text-[10px] " + P.userEmail}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className={
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors " +
            P.signOutClass
          }
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}