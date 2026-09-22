import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

// Wrap inside ProtectedRoute — assumes auth is already confirmed.
// Wrong-role access redirects to that user's own dashboard rather than
// showing a dead end, since DRF permissions are the real enforcement
// layer regardless of what this route guard does.
//
// The admin fallback matters because the mock `/login` flow can bounce
// an admin through a stale `state.from` path. Without an /admin fallback
// they'd land on /teacher, which would then send them back to /login in
// a loop.
export default function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allow.includes(user.role)) {
    const fallback =
      user.role === "admin"
        ? "/admin"
        : user.role === "teacher"
        ? "/teacher"
        : "/student";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}