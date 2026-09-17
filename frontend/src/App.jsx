import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import TeacherLayout from "./components/layout/TeacherLayout";
import StudentLayout from "./components/layout/StudentLayout";
import TeacherDashboardPage from "./features/teacher/dashboard/TeacherDashboardPage";
import StudentDashboardPage from "./features/student/dashboard/StudentDashboardPage";
import ClassListPage from "./features/teacher/classes/ClassListPage";
import ClassDetailPage from "./features/teacher/classes/ClassDetailPage";
import MaterialsPage from "./features/teacher/materials/MaterialsPage";
import AnnouncementsPage from "./features/teacher/announcements/AnnouncementsPage";
import StudentClassListPage from "./features/student/classes/ClassListPage";
import JoinClassPage from "./features/student/join-class/JoinClassPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["teacher", "admin"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="classes" element={<ClassListPage />} />
            <Route path="classes/:classId" element={<ClassDetailPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["student"]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="classes" element={<StudentClassListPage />} />
            <Route path="join-class" element={<JoinClassPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
