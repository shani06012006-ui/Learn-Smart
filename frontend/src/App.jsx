import { Navigate, Route, Routes } from "react-router-dom";

// Auth
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import RootRoute from "./routes/RootRoute";

// Public
import ShopPage from "./features/shop/ShopPage";
import CoursesPage from "./features/courses/CoursesPage";
import CourseDetailsPage from "./features/course-details/CourseDetailsPage";
import PricingPage from "./features/pricing/PricingPage";
import BlogsPage from "./features/blogs/BlogsPage";
import ContactPage from "./features/contact/ContactPage";

// Admin
import AdminRouteGuard from "./features/admin/components/AdminRouteGuard";
import AdminLayout from "./features/admin/AdminLayout";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import AdminUsersPage from "./features/admin/pages/AdminUsersPage";
import AdminUserDetailPage from "./features/admin/pages/AdminUserDetailPage";
import AdminTeachersPage from "./features/admin/pages/AdminTeachersPage";
import AdminTeacherDetailPage from "./features/admin/pages/AdminTeacherDetailPage";
import AdminStudentsPage from "./features/admin/pages/AdminStudentsPage";
import AdminStudentDetailPage from "./features/admin/pages/AdminStudentDetailPage";
import AdminCoursesPage from "./features/admin/pages/AdminCoursesPage";
import AdminCourseDetailPage from "./features/admin/pages/AdminCourseDetailPage";
import AdminSessionsPage from "./features/admin/pages/AdminSessionsPage";
import AdminAttendancePage from "./features/admin/pages/AdminAttendancePage";
import AdminPlaceholder from "./features/admin/components/AdminPlaceholder";

export default function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────── */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/standard-3" element={<CourseDetailsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/blogs" element={<BlogsPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* ── Admin (protected) ──────────────────────────────────── */}
      <Route element={<AdminRouteGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />

          {/* Sidebar items — real pages restored in later batches */}
          <Route path="users"      element={<AdminUsersPage />} />
          <Route path="users/:id"  element={<AdminUserDetailPage />} />
          <Route path="teachers"       element={<AdminTeachersPage />} />
          <Route path="teachers/:id"   element={<AdminTeacherDetailPage />} />
          <Route path="students"       element={<AdminStudentsPage />} />
          <Route path="students/:id"   element={<AdminStudentDetailPage />} />
          <Route path="courses"       element={<AdminCoursesPage />} />
          <Route path="courses/:id"   element={<AdminCourseDetailPage />} />
          <Route path="attendance"     element={<AdminAttendancePage />} />
          <Route path="timetable"  element={<AdminPlaceholder title="Timetable" />} />
          <Route path="leaves"     element={<AdminPlaceholder title="Leaves" />} />
          <Route path="sessions"       element={<AdminSessionsPage />} />
        </Route>
      </Route>

      {/* ── Catch-all ──────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}