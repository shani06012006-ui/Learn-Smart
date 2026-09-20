import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import LoadingState from "../components/feedback/LoadingState";
import LandingPage from "../features/landing/LandingPage";

// Public root route. Renders the marketing landing page for unauthenticated
// visitors; redirects already-authenticated users to their dashboard.
// Uses the same bootstrapping pattern as ProtectedRoute so there is no
// flash of the wrong page while the session is being validated.
export default function RootRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <LoadingState label="Loading..." />;
  }

  if (isAuthenticated) {
    const target = user?.role === "teacher" ? "/teacher" : "/student";
    return <Navigate to={target} replace />;
  }

  return <LandingPage />;
}
