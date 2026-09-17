import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Megaphone,
  BarChart3,
  MessageSquare,
  Video,
  Trophy,
  KeyRound,
} from "lucide-react";

import { sidebarClosed } from "../../store/slices/uiSlice";

const TEACHER_ITEMS = [
  { label: "Dashboard", to: "/teacher", icon: LayoutDashboard, enabled: true, end: true },
  { label: "Classes", to: "/teacher/classes", icon: BookOpen, enabled: true },
  { label: "Materials", to: "/teacher/materials", icon: FileText, enabled: true },
  { label: "Announcements", to: "/teacher/announcements", icon: Megaphone, enabled: true },
  { label: "AI Insights", to: "/teacher/analytics", icon: BarChart3, enabled: false, note: "Module E" },
  { label: "Live Classes", to: "/teacher/live-classes", icon: Video, enabled: false, note: "Module H" },
  { label: "Messages", to: "/teacher/chat", icon: MessageSquare, enabled: false, note: "Module F" },
];

const STUDENT_ITEMS = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard, enabled: true, end: true },
  { label: "My Classes", to: "/student/classes", icon: BookOpen, enabled: true },
  { label: "Join a class", to: "/student/join-class", icon: KeyRound, enabled: true },
  { label: "Materials", to: "/student/materials", icon: FileText, enabled: false, note: "Module C" },
  { label: "Performance", to: "/student/performance", icon: Trophy, enabled: false, note: "Module I" },
  { label: "Live Classes", to: "/student/live-classes", icon: Video, enabled: false, note: "Module H" },
  { label: "Messages", to: "/student/chat", icon: MessageSquare, enabled: false, note: "Module F" },
];

export default function Sidebar({ role }) {
  const items = role === "teacher" ? TEACHER_ITEMS : STUDENT_ITEMS;
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const dispatch = useDispatch();

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
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-ink-300 bg-white pt-16 transition-transform md:static md:translate-x-0 md:pt-0",
          sidebarOpen && "translate-x-0"
        )}
      >
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const Icon = item.icon;
            if (!item.enabled) {
              return (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-300"
                  title={`Coming in ${item.note}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  <span className="text-xs">{item.note}</span>
                </div>
              );
            }
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={!!item.end}
                onClick={() => dispatch(sidebarClosed())}
                className={({ isActive }) =>
                  clsx(
                    "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    isActive ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-100"
                  )
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
