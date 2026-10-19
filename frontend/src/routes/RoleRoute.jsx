import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";


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