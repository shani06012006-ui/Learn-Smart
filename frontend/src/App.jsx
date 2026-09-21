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

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/features" element={<FeaturesPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["teacher", "admin"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="classes" element={<ClassListPage />} />
            <Route path="classes/:classId" element={<ClassDetailPage />} />
            <Route
            />
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

      {/* Catch-all: unknown routes redirect to the landing page for
          unauthenticated visitors, or to /login for authenticated users
          (ProtectedRoute handles the redirect once they hit a protected
          route, but a bare 404 sends them to landing which then sends
          them to their dashboard via RootRoute). */}
      {/* Unknown routes → land on the public entry (RootRoute will then
          decide: landing page or role-based dashboard redirect). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}







