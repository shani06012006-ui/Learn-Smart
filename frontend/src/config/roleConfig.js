// frontend/src/config/roleConfig.js

import {
  LayoutDashboard, BookOpen, GraduationCap, FileText, Megaphone,
  MessageSquare, Video, Trophy, KeyRound, CalendarDays, CalendarX,
  ClipboardCheck, Brain, Layers, UserCog, Monitor, UserCheck,
} from "lucide-react";

/* ================================================================
   ADMIN
   ================================================================ */

const ADMIN_NAV = [
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

const admin = {
  label: "Admin",
  longLabel: "Platform Admin",

  // ---------- Background ----------
  background: {
    imageUrl: "https://i.pinimg.com/1200x/4d/49/bf/4d49bf8b379dd98a55502aa40db6bbfd.jpg",
    opacity: 0.35,
    veil: "from-white/55 via-white/35 to-white/65",
  },

  // ---------- Sidebar ----------
  sidebar: {
    wrapper: "border-slate-800/60 bg-slate-900/85 backdrop-blur-md",
    brandLabel: "text-slate-400",
    sectionLabel: "text-slate-500",
    sectionValue: "text-slate-100",
    navItemActive: "bg-slate-700 text-white shadow-sm ring-1 ring-slate-600",
    navItemIdle: "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100",
    divider: "border-slate-800/60",
    avatarClass: "bg-gradient-to-br from-slate-600 to-slate-800 text-white",
    userName: "text-slate-100",
    userEmail: "text-slate-500",
    signOutClass: "text-slate-400 hover:bg-coral-500/10 hover:text-coral-400",
    navItems: ADMIN_NAV,
  },

  // ---------- Navbar / topbar ----------
  navbar: {
    wrapper: "border-slate-800/60 bg-slate-900/70 backdrop-blur-md",
    brandIcon: "text-slate-300",
    brandText: "text-slate-100",
    roleBadge: "bg-slate-700 text-slate-100 ring-1 ring-slate-600",
    iconButton: "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100",
  },

  // ---------- Page headings ----------
  headings: {
    dashboard:     { title: "Admin Console",    subtitle: "Signed in as admin" },
    courses:       { title: "Courses",           subtitle: "Manage the courses taught on your platform." },
    grades:        { title: "Grades",            subtitle: "Manage grades and their sections." },
    teachers:      { title: "Teachers",          subtitle: "Manage teaching staff." },
    students:      { title: "Students",          subtitle: "Manage enrolled students." },
    attendance:    { title: "Attendance",        subtitle: "Review attendance across the platform." },
    timetable:     { title: "Timetable",         subtitle: "Build and manage class schedules." },
    substitutions: { title: "Substitutions",     subtitle: "Mark absences and assign coverage." },
    leaves:        { title: "Leaves",            subtitle: "Approve or reject leave requests." },
    sessions:      { title: "Sessions",          subtitle: "Live and past class sessions." },
    messages:      { title: "Messages",          subtitle: "Messages across the platform." },
  },

  // ---------- Chrome extras ----------
  emptyStateIcon: "text-slate-400",
};

/* ================================================================
   TEACHER
   ================================================================ */

const TEACHER_NAV = [
  { to: "/teacher",              end: true, label: "Dashboard",     icon: LayoutDashboard },
  { to: "/teacher/classes",                 label: "Classes",       icon: BookOpen },
  { to: "/teacher/students",                label: "Students",      icon: GraduationCap },
  { to: "/teacher/timetable",               label: "Timetable",     icon: CalendarDays },
  { to: "/teacher/attendance",              label: "Attendance",    icon: ClipboardCheck },
  { to: "/teacher/leaves",                  label: "Leaves",        icon: CalendarX },
  { to: "/teacher/quizzes",                 label: "Quizzes",       icon: Brain },
  { to: "/teacher/materials",               label: "Materials",     icon: FileText },
  { to: "/teacher/announcements",           label: "Announcements", icon: Megaphone },
  { to: "/teacher/live-classes",            label: "Live Classes",  icon: Video },
  { to: "/teacher/chat",                    label: "Messages",      icon: MessageSquare },
];

const teacher = {
  label: "Teacher",
  longLabel: "Teacher",

  background: {
    imageUrl: "https://i.pinimg.com/1200x/ad/82/b8/ad82b8b19fb4b7dd4fedecbf64616f6b.jpg",
    opacity: 0.35,
    veil: "from-white/55 via-white/35 to-white/65",
  },

  sidebar: {
    wrapper: "border-slate-200/60 bg-white/80 backdrop-blur-md",
    brandLabel: "text-purple-600",
    sectionLabel: "text-slate-400",
    sectionValue: "text-navy-950",
    navItemActive: "bg-purple-600 text-white shadow-sm",
    navItemIdle: "text-slate-500 hover:bg-purple-50 hover:text-purple-700",
    divider: "border-slate-100",
    avatarClass: "bg-gradient-to-br from-purple-600 to-indigo-700 text-white",
    userName: "text-navy-950",
    userEmail: "text-slate-400",
    signOutClass: "text-slate-500 hover:bg-coral-50 hover:text-coral-600",
    navItems: TEACHER_NAV,
  },

  navbar: {
    wrapper: "border-ink-300/60 bg-white/80 backdrop-blur-md",
    brandIcon: "text-purple-600",
    brandText: "text-ink-900",
    roleBadge: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
    iconButton: "text-ink-700 hover:bg-purple-50 hover:text-purple-700",
  },

  headings: {
    dashboard:  { title: "My Dashboard",   subtitle: "Your classes and students at a glance." },
    classes:    { title: "My classes",      subtitle: "Browse by grade and section, and jump into attendance or the roster." },
    students:   { title: "My students",     subtitle: "Everyone enrolled in your classes." },
    timetable:  { title: "My timetable",    subtitle: "Your weekly teaching schedule." },
    attendance: { title: "Attendance",      subtitle: "Take and review attendance." },
    leaves:     { title: "Leaves",          subtitle: "Approve student leave requests." },
    quizzes:    { title: "Quizzes",         subtitle: "Create and grade quizzes." },
    materials:  { title: "Materials",       subtitle: "Share learning resources." },
    announcements: { title: "Announcements", subtitle: "Broadcast to your classes." },
    liveClasses:   { title: "Live Classes",  subtitle: "Start and manage live sessions." },
    messages:      { title: "Messages",      subtitle: "Chat with students and colleagues." },
  },

  emptyStateIcon: "text-purple-500",
};

/* ================================================================
   STUDENT
   ================================================================ */

const STUDENT_NAV = [
  { to: "/student",              end: true, label: "Dashboard",     icon: LayoutDashboard },
  { to: "/student/classes",                 label: "My Classes",    icon: BookOpen },
  { to: "/student/quizzes",                 label: "Quizzes",       icon: Brain },
  { to: "/student/timetable",               label: "Timetable",     icon: CalendarDays },
  { to: "/student/join-class",              label: "Join a class",  icon: KeyRound },
  { to: "/student/materials",               label: "Materials",     icon: FileText },
  { to: "/student/announcements",           label: "Announcements", icon: Megaphone },
  { to: "/student/performance",             label: "Performance",   icon: Trophy },
  { to: "/student/live-classes",            label: "Live Classes",  icon: Video },
  { to: "/student/chat",                    label: "Messages",      icon: MessageSquare },
];

const student = {
  label: "Student",
  longLabel: "Student",

  background: {
    imageUrl: "https://i.pinimg.com/1200x/2a/e9/a8/2ae9a8ddec1c99cebf5594b3b6462c50.jpg",
    opacity: 0.35,
    veil: "from-white/60 via-white/40 to-white/70", 
  },

  sidebar: {
    // Emerald tinted glass
    wrapper: "border-emerald-200/50 bg-white/40 backdrop-blur-md",
    brandLabel: "text-emerald-700",
    sectionLabel: "text-emerald-600",
    sectionValue: "text-navy-950",
    // Emerald active pill
    navItemActive: "bg-emerald-600 text-white shadow-sm",
    navItemIdle: "text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-700",
    divider: "border-emerald-100/50",
    avatarClass: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    userName: "text-navy-950",
    userEmail: "text-slate-500",
    signOutClass: "text-slate-600 hover:bg-rose-50 hover:text-rose-600",
    navItems: STUDENT_NAV,
  },

  navbar: {
    wrapper: "border-white/20 bg-white/40 backdrop-blur-md",
    brandIcon: "text-emerald-600",
    brandText: "text-navy-950",
    roleBadge: "bg-emerald-600 text-white ring-1 ring-emerald-500",
    iconButton: "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
  },

  headings: {
    dashboard:     { title: "My Dashboard",   subtitle: "Welcome back" },
    classes:       { title: "My Classes",     subtitle: "Classes you're actively enrolled in." },
    quizzes:       { title: "My Quizzes",     subtitle: "Quizzes from your enrolled classes." },
    timetable:     { title: "My Timetable",   subtitle: "Your weekly class schedule." },
    joinClass:     { title: "Join a class",   subtitle: "Enter the code your teacher gave you." },
    materials:     { title: "My Materials",   subtitle: "Resources from your classes." },
    announcements: { title: "Announcements",  subtitle: "Updates from your teachers." },
    performance:   { title: "My Performance", subtitle: "Your grades and progress." },
    liveClasses:   { title: "Live Classes",   subtitle: "Sessions happening now or soon." },
    messages:      { title: "Messages",       subtitle: "Chat with teachers and peers." },

    attendanceSection:  "MY ATTENDANCE",
    classesSection:     "MY CLASSES",
    timetableSection:   "MY TIMETABLE",
    performanceSection: "MY PERFORMANCE",
  },

  emptyStateIcon: "text-emerald-500",
};

/* ================================================================
   EXPORTS
   ================================================================ */

export const ROLE_CONFIG = { admin, teacher, student };

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || student;
}