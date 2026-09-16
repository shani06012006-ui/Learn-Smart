import { createSlice } from "@reduxjs/toolkit";

import { tokenStorage } from "../../utils/tokenStorage";

const initialState = {
  user: null,
  accessToken: tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  // True only once we've either confirmed a session (via /auth/me/) or
  // confirmed there isn't one — prevents a flash of the login page while
  // a stored token is still being validated on app load.
  status: "idle", // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    credentialsReceived: (state, action) => {
      const { user, access, refresh } = action.payload;
      state.user = user;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.status = "authenticated";
      tokenStorage.setTokens({ access, refresh });
    },
    userLoaded: (state, action) => {
      state.user = action.payload;
      state.status = "authenticated";
    },
    accessTokenRotated: (state, action) => {
      state.accessToken = action.payload.access;
      tokenStorage.setTokens({ access: action.payload.access });
    },
    sessionCheckStarted: (state) => {
      state.status = "loading";
    },
    loggedOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "unauthenticated";
      tokenStorage.clear();
    },
  },
});

export const {
  credentialsReceived,
  userLoaded,
  accessTokenRotated,
  sessionCheckStarted,
  loggedOut,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectIsAuthenticated = (state) => state.auth.status === "authenticated";
export const selectAccessToken = (state) => state.auth.accessToken;
