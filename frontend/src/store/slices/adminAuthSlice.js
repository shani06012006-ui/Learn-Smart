import { createSlice } from "@reduxjs/toolkit";

import { adminTokenStorage } from "../../utils/adminTokenStorage";

// Admin auth state. Entirely separate from the mock `auth` slice used by
// teachers and students — different storage keys, different reducer path,
// different token lifecycle. Nothing in this slice reads or writes the
// mock auth slice, and vice versa.

const initialState = {
  user: adminTokenStorage.getUser(),
  accessToken: adminTokenStorage.getAccess(),
  refreshToken: adminTokenStorage.getRefresh(),
  status: adminTokenStorage.getAccess() ? "authenticated" : "unauthenticated",
  // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    adminCredentialsReceived: (state, action) => {
      const { user, access, refresh } = action.payload;
      state.user = user;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.status = "authenticated";
      adminTokenStorage.setSession({ access, refresh, user });
    },
    adminUserLoaded: (state, action) => {
      state.user = action.payload;
      state.status = "authenticated";
      adminTokenStorage.setSession({ user: action.payload });
    },
    adminAccessTokenRotated: (state, action) => {
      state.accessToken = action.payload.access;
      if (action.payload.refresh) state.refreshToken = action.payload.refresh;
      adminTokenStorage.setSession({
        access: action.payload.access,
        refresh: action.payload.refresh || undefined,
      });
    },
    adminSessionCheckStarted: (state) => {
      state.status = "loading";
    },
    adminLoggedOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "unauthenticated";
      adminTokenStorage.clear();
    },
  },
});

export const {
  adminCredentialsReceived,
  adminUserLoaded,
  adminAccessTokenRotated,
  adminSessionCheckStarted,
  adminLoggedOut,
} = adminAuthSlice.actions;

export default adminAuthSlice.reducer;

// Selectors
export const selectAdminUser = (state) => state.adminAuth.user;
export const selectAdminStatus = (state) => state.adminAuth.status;
export const selectAdminAccessToken = (state) => state.adminAuth.accessToken;
export const selectAdminRefreshToken = (state) => state.adminAuth.refreshToken;
export const selectIsAdminAuthenticated = (state) =>
  state.adminAuth.status === "authenticated" && !!state.adminAuth.accessToken;