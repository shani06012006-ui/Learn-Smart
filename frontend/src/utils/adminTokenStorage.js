// Admin token store — deliberately separate from the mock auth's
// `autolearn.*` keys so the two auth systems can never collide. If you
// later migrate the teacher/student flows to the real backend, this is
// the pattern to follow for that migration too.

const ACCESS_KEY = "admin.access";
const REFRESH_KEY = "admin.refresh";
const USER_KEY = "admin.user";

export const adminTokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession: ({ access, refresh, user }) => {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};