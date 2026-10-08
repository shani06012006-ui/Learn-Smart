// frontend/src/features/admin/components/AdminRouteGuard.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../../hooks/useAdminAuth";
import LoadingState from "../../../components/feedback/LoadingState";

export default function AdminRouteGuard() {
  const { user, isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) return <LoadingState label="Checking permissions..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only platform admins can access /admin/*. Teachers/students get
  // bounced to their own dashboard.
  const role = user?.role;
  if (role !== "admin") {
    if (role === "teacher") return <Navigate to="/teacher" replace />;
    if (role === "student") return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}