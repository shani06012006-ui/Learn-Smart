import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import RootRoute from "./routes/RootRoute";
import TeacherLayout from "./components/layout/TeacherLayout";
import StudentLayout from "./components/layout/StudentLayout";
import TeacherDashboardPage from "./features/teacher/dashboard/TeacherDashboardPage";
import StudentDashboardPage from "./features/student/dashboard/StudentDashboardPage";
import ClassListPage from "./features/teacher/classes/ClassListPage";
import ClassDetailPage from "./features/teacher/classes/ClassDetailPage";
import MaterialsPage from "./features/teacher/materials/MaterialsPage";
import AnnouncementsPage from "./features/teacher/announcements/AnnouncementsPage";
import LiveClassesPage from "./features/teacher/live-classes/LiveClassesPage";
import StudentClassListPage from "./features/student/classes/ClassListPage";
import StudentMaterialsPage from "./features/student/materials/MaterialsPage";
import StudentAnnouncementsPage from "./features/student/announcements/AnnouncementsPage";
import PerformancePage from "./features/student/performance/PerformancePage";
import JoinClassPage from "./features/student/join-class/JoinClassPage";
import StudentLiveClassesPage from "./features/student/live-classes/LiveClassesPage";
import LiveSessionPage from "./features/student/live-classes/LiveSessionPage";
import ChatPage from "./features/chat/ChatPage";
import FeaturesPage from "./features/features-page/FeaturesPage";
import MaterialDetailPage from "./features/materials/MaterialDetailPage";
import AdminLayout from "./features/admin/AdminLayout";
import AdminRouteGuard from "./features/admin/components/AdminRouteGuard";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import AdminUsersPage from "./features/admin/pages/AdminUsersPage";
import AdminCoursesPage from "./features/admin/pages/AdminCoursesPage";
import AdminUserDetailPage from "./features/admin/pages/AdminUserDetailPage";
import AdminCourseDetailPage from "./features/admin/pages/AdminCourseDetailPage";
import AdminAuditLogPage from "./features/admin/pages/AdminAuditLogPage";
import AdminSessionsPage from "./features/admin/pages/AdminSessionsPage";
import AdminStudentsPage from "./features/admin/pages/AdminStudentsPage";
import AdminStudentDetailPage from "./features/admin/pages/AdminStudentDetailPage";



export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/features" element={<FeaturesPage />} />


      <Route element={<AdminRouteGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/:id" element={<AdminCourseDetailPage />} />
          <Route path="audit" element={<AdminAuditLogPage />} />
          <Route path="sessions" element={<AdminSessionsPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="students/:id" element={<AdminStudentDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["teacher", "admin"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="classes" element={<ClassListPage />} />
            <Route path="classes/:classId" element={<ClassDetailPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="materials/:materialId" element={<MaterialDetailPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="live-classes" element={<LiveClassesPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:threadId" element={<ChatPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["student"]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="classes" element={<StudentClassListPage />} />
            <Route path="join-class" element={<JoinClassPage />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="materials/:materialId" element={<MaterialDetailPage />} />
            <Route path="announcements" element={<StudentAnnouncementsPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="live-classes" element={<StudentLiveClassesPage />} />
            <Route path="live-classes/:liveClassId" element={<LiveSessionPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:threadId" element={<ChatPage />} />
          </Route>
        </Route>
      </Route>

      {/* Unknown routes â†’ land on the public entry (RootRoute will then
          decide: landing page or role-based dashboard redirect). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}