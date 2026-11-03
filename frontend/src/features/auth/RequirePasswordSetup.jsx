import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; // Adjust path if needed

export default function RequirePasswordSetup() {
  const { user } = useAuth();

  if (user && user.must_set_password) {
    // If they haven't set their password, redirect to the setup page
    return <Navigate to="/auth/setup-password?force=true" replace />;
  }

  return <Outlet />;
}