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
          <Route path="users"      element={<AdminPlaceholder title="Users" />} />
          <Route path="teachers"   element={<AdminPlaceholder title="Teachers" />} />
          <Route path="students"   element={<AdminPlaceholder title="Students" />} />
          <Route path="courses"    element={<AdminPlaceholder title="Courses" />} />
          <Route path="attendance" element={<AdminPlaceholder title="Attendance" />} />
          <Route path="timetable"  element={<AdminPlaceholder title="Timetable" />} />
          <Route path="leaves"     element={<AdminPlaceholder title="Leaves" />} />
          <Route path="sessions"   element={<AdminPlaceholder title="Sessions" />} />
        </Route>
      </Route>

      {/* ── Catch-all ──────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}