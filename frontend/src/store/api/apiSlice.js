import { createApi } from "@reduxjs/toolkit/query/react";

import { accessTokenRotated, loggedOut } from "../slices/authSlice";
import { localDispatcher } from "../../mocks/dispatcher";

// MOCK MODE: every endpoint routes through `localDispatcher`, which reads
// and writes the in-memory stores under `mocks/data/`. No fetch, no MSW,
// no service worker.

function normalizeArgs(args) {
  if (typeof args === "string") return { url: args, method: "GET" };
  return { method: "GET", ...args };
}

const rawBaseQuery = async (args, api, extraOptions) => {
  const normalized = normalizeArgs(args);
  const state = api.getState();
  const token = state.auth.accessToken;
  const headers = {
    ...(normalized.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return localDispatcher({ ...normalized, headers }, api, extraOptions);
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const normalized = normalizeArgs(args);
  let result = await rawBaseQuery(normalized, api, extraOptions);

  const isAuthEndpoint =
    normalized.url === "/auth/login/" || normalized.url === "/auth/token/refresh/";

  if (result.error?.status === 401 && !isAuthEndpoint) {
    const refreshToken = api.getState().auth.refreshToken;

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        { url: "/auth/token/refresh/", method: "POST", body: { refresh: refreshToken } },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        api.dispatch(accessTokenRotated(refreshResult.data));
        result = await rawBaseQuery(normalized, api, extraOptions);
      } else {
        api.dispatch(loggedOut());
      }
    } else {
      api.dispatch(loggedOut());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Me",
    "Class",
    "Enrollment",
    "Material",
    "Announcement",
    "TeacherAnalytics",
    "StudentPerformance",
    "Quiz",
    "Question",
    "Submission",
    "Thread",
    "ThreadMember",
    "Message",
  ],
  endpoints: () => ({}),
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => action.type === loggedOut.type,
      () => ({})
    );
  },
});
