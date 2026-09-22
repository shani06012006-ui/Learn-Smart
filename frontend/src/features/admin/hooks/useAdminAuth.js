import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useAdminLogoutMutation } from "../../../store/api/realApi";
import {
  adminLoggedOut,
  selectAdminUser,
  selectAdminStatus,
  selectIsAdminAuthenticated,
} from "../../../store/slices/adminAuthSlice";

// Note: no `login` here anymore. Admin login goes through the shared
// `/login` page (see features/auth/LoginPage.jsx), which dispatches
// adminCredentialsReceived directly. This hook is used by the admin layout
// and sidebar to read the current admin and to sign out.

export function useAdminAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAdminUser);
  const status = useSelector(selectAdminStatus);
  const isAuthenticated = useSelector(selectIsAdminAuthenticated);

  const [logoutMutation] = useAdminLogoutMutation();

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("admin.refresh");
    try {
      if (refresh) await logoutMutation(refresh).unwrap();
    } catch {
      // best-effort — clearing local state is what matters
    } finally {
      dispatch(adminLoggedOut());
      navigate("/login", { replace: true });
    }
  }, [dispatch, logoutMutation, navigate]);

  return {
    user,
    status,
    isAuthenticated,
    isBootstrapping: status === "loading",
    logout,
  };
}