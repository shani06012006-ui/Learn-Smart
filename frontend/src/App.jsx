import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ShopPage from "./features/shop/ShopPage";
import CoursesPage from "./features/courses/CoursesPage";
import CourseDetailsPage from "./features/course-details/CourseDetailsPage";
import RootRoute from "./routes/RootRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/standard-3" element={<CourseDetailsPage />} />

      {/* Everything else redirects home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}