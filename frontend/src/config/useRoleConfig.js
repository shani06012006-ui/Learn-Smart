// frontend/src/config/useRoleConfig.js

import { useAuth } from "../hooks/useAuth";
import { useAdminAuth } from "../hooks/useAdminAuth"; 
import { getRoleConfig } from "./roleConfig";

export function useRoleConfig(forcedRole) {
  // Admin check — useAdminAuth returns a user only on the admin side.
  const { user: adminUser } = useAdminAuth?.() ?? { user: null };
  const { user: normalUser } = useAuth();

  const role =
    forcedRole ||
    (adminUser ? "admin" : normalUser?.role) ||
    "student";

  return getRoleConfig(role);
}