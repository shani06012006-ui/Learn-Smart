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
import QuizBuilderPage from "./features/teacher/quizzes/QuizBuilderPage";
import MaterialsPage from "./features/teacher/materials/MaterialsPage";
import AnnouncementsPage from "./features/teacher/announcements/AnnouncementsPage";
import StudentClassListPage from "./features/student/classes/ClassListPage";
import StudentMaterialsPage from "./features/student/materials/MaterialsPage";
import PerformancePage from "./features/student/performance/PerformancePage";
import JoinClassPage from "./features/student/join-class/JoinClassPage";
import StudentQuizListPage from "./features/student/quizzes/QuizListPage";
import TakeQuizPage from "./features/student/quizzes/TakeQuizPage";
import ResultReviewPage from "./features/student/quizzes/ResultReviewPage";

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
            <Route
              path="classes/:classId/quizzes/:quizId"
              element={<QuizBuilderPage />}
            />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["student"]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="classes" element={<StudentClassListPage />} />
            <Route path="join-class" element={<JoinClassPage />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="quizzes" element={<StudentQuizListPage />} />
            <Route path="quizzes/:quizId" element={<TakeQuizPage />} />
            <Route path="submissions/:submissionId" element={<ResultReviewPage />} />
            <Route path="performance" element={<PerformancePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
