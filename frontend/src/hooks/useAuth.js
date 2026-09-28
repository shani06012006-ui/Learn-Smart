// frontend/src/hooks/useAuth.js

import { useAdminAuth } from "../features/admin/hooks/useAdminAuth";

/**
 * Role-agnostic auth hook.
 *
 * Historically this read from the mock `auth` slice (backed by the mock
 * teacher/student login and `autolearn.*` localStorage keys). It now
 * delegates to the real `adminAuth` slice via `useAdminAuth`, which is
 * backed by the real Django backend and `admin.*` storage.
 *
 * The public shape is intentionally preserved so consumers
 * (ProtectedRoute, RoleRoute, Navbar) need no changes.
 */
export function useAuth() {
  const {
    user,
    status,
    isAuthenticated,
    isBootstrapping,
    logout,
  } = useAdminAuth();

  return {
    user,
    status,
    isAuthenticated,
    isBootstrapping,
    // Login now happens directly in LoginPage against the real backend.
    // This hook no longer needs to expose a login method, but the field
    // is kept for backward compatibility with any component that destructures it.
    login: null,
    loginState: { isLoading: false, error: null },
    logout,
  };
}