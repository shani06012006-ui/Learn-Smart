// frontend/src/components/layout/chromeConfig.js

import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  Megaphone,
  MessageSquare,
  Video,
  Trophy,
  KeyRound,
  CalendarDays,
  CalendarX,
  ClipboardCheck,
  Brain,
} from "lucide-react";

/* =================================================================
   NAV ITEMS
   ================================================================= */

const TEACHER_ITEMS = [
  { label: "Dashboard",     to: "/teacher",               icon: LayoutDashboard, end: true },
  { label: "Classes",       to: "/teacher/classes",       icon: BookOpen },
  { label: "Students",      to: "/teacher/students",      icon: GraduationCap },
  { label: "Timetable",     to: "/teacher/timetable",     icon: CalendarDays },
  { label: "Attendance",    to: "/teacher/attendance",    icon: ClipboardCheck },
  { label: "Leaves",        to: "/teacher/leaves",        icon: CalendarX },
  { label: "Quizzes",       to: "/teacher/quizzes",       icon: Brain },
  { label: "Materials",     to: "/teacher/materials",     icon: FileText },
  { label: "Announcements", to: "/teacher/announcements", icon: Megaphone },
  { label: "Live Classes",  to: "/teacher/live-classes",  icon: Video },
  { label: "Messages",      to: "/teacher/chat",          icon: MessageSquare },
];

const STUDENT_ITEMS = [
  { label: "Dashboard",     to: "/student",               icon: LayoutDashboard, end: true },
  { label: "My Classes",    to: "/student/classes",       icon: BookOpen },
  { label: "Timetable",     to: "/student/timetable",     icon: CalendarDays },
  { label: "Join a class",  to: "/student/join-class",    icon: KeyRound },
  { label: "Materials",     to: "/student/materials",     icon: FileText },
  { label: "Announcements", to: "/student/announcements", icon: Megaphone },
  { label: "Performance",   to: "/student/performance",   icon: Trophy },
  { label: "Live Classes",  to: "/student/live-classes",  icon: Video },
  { label: "Messages",      to: "/student/chat",          icon: MessageSquare },
];

/* =================================================================
   SIDEBAR CONFIG — one block per role
   ================================================================= */

export const SIDEBAR_CONFIG = {
  // ─────────────────────────── TEACHER ───────────────────────────
  teacher: {
    items: TEACHER_ITEMS,

    // Glassy white sidebar, purple accents (matches admin brand)
    sidebarClass: "border-slate-200/60 bg-white/80 backdrop-blur-md",

    navItemActive: "bg-purple-600 text-white shadow-sm",
    navItemIdle:   "text-slate-500 hover:bg-purple-50 hover:text-purple-700",

    brandLabelClass: "text-purple-600",
    avatarClass:     "bg-gradient-to-br from-purple-600 to-indigo-700 text-white",
    footerDivider:   "border-slate-100",
    signOutClass:    "text-slate-500 hover:bg-coral-50 hover:text-coral-600",
  },

  // ─────────────────────────── STUDENT ───────────────────────────
  student: {
    items: STUDENT_ITEMS,

    // Fully transparent glass over the background image, blue accents
    sidebarClass: "border-white/20 bg-white/10 backdrop-blur-sm",

    navItemActive: "bg-red-900 text-white shadow-sm",
    navItemIdle:   "text-white hover:bg-white/30 hover:text-black",

    brandLabelClass: "text-blue-600",
    avatarClass:     "bg-gradient-to-br from-blue-600 to-cyan-600 text-white",
    footerDivider:   "border-white/20",
    signOutClass:    "text-slate-600 hover:bg-white/30 hover:text-coral-600",
  },
};

/* =================================================================
   NAVBAR CONFIG — one block per role
   ================================================================= */

export const NAVBAR_CONFIG = {
  // ─────────────────────────── TEACHER ───────────────────────────
  teacher: {
    headerClass: "border-ink-300/60 bg-white/80 backdrop-blur-md",

    brandIconClass: "text-purple-600",
    brandTextClass: "text-ink-900",

    // Purple pill
    roleBadgeClass: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",

    iconButtonClass: "text-ink-700 hover:bg-purple-50 hover:text-purple-700",
  },

  // ─────────────────────────── STUDENT ───────────────────────────
  student: {
    headerClass: "border-white/20 bg-white/10 backdrop-blur-sm",

    brandIconClass: "text-white",
    brandTextClass: "text-red-900 text-xl ",

    // Solid blue pill
    roleBadgeClass: "bg-blue-600 text-white ring-1 ring-blue-500",

    iconButtonClass: "text-slate-700 hover:bg-white/30 hover:text-blue-700",
  },
};

/* =================================================================
   HELPERS
   ================================================================= */

export function getSidebarConfig(role) {
  return SIDEBAR_CONFIG[role] || SIDEBAR_CONFIG.student;
}

export function getNavbarConfig(role) {
  return NAVBAR_CONFIG[role] || NAVBAR_CONFIG.student;
}