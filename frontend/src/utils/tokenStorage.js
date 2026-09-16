// Centralized so there's exactly one place that knows the storage keys.
// Swap this for httpOnly-cookie-based storage later without touching
// anything else if you decide to harden auth further.

const ACCESS_KEY = "autolearn.access";
const REFRESH_KEY = "autolearn.refresh";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: ({ access, refresh }) => {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
