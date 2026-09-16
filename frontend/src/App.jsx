import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import TeacherLayout from "./components/layout/TeacherLayout";
import StudentLayout from "./components/layout/StudentLayout";
import TeacherDashboardPage from "./features/teacher/dashboard/TeacherDashboardPage";
import StudentDashboardPage from "./features/student/dashboard/StudentDashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["teacher", "admin"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboardPage />} />
            {/* /teacher/classes, /materials, /analytics, etc. are added
                as their modules are built -- see Sidebar.jsx for the map. */}
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["student"]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
