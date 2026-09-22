import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { selectIsAdminAuthenticated } from "../../../store/slices/adminAuthSlice";

// Protects the /admin/* routes. Unauthenticated visitors are sent to the
// single shared /login page with a `from` hint, so after a successful
// admin login they land back where they meant to go.
export default function AdminRouteGuard() {
  const isAuthenticated = useSelector(selectIsAdminAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
}