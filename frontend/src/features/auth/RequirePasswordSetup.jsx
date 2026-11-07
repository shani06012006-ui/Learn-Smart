import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/*
  Mandatory password setup (requirement: students cannot reach the dashboard
  before choosing their own password).

  In practice a student with `must_set_password` can never obtain a session —
  the backend refuses password / PIN / OTP sign-in (403 `password_setup_required`)
  and rejects any token held by a pending account. This guard is the last line of
  defence: if a pending account ever does reach a protected route, send it to the
  activation page, which either completes setup (when opened from the invite link)
  or offers to request a fresh link.
*/
export default function RequirePasswordSetup() {
  const { user } = useAuth();

  if (user && user.must_set_password) {
    return <Navigate to="/activate" replace />;
  }

  return <Outlet />;
}
