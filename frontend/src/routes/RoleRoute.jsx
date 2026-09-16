import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

// Wrap inside ProtectedRoute — assumes auth is already confirmed.
// Wrong-role access redirects to that user's own dashboard rather than
// showing a dead end, since DRF permissions are the real enforcement
// layer regardless of what this route guard does.
export default function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return <Outlet />;
}
