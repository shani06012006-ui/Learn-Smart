import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { accessTokenRotated, loggedOut } from "../slices/authSlice";

// In mock mode, requests must stay same-origin as the page (http://localhost:5173/...)
// for MSW's service worker to intercept them -- a relative handler path
// resolves against the PAGE's origin, not as a cross-origin wildcard, so
// pointing straight at VITE_API_BASE_URL (a different port) would bypass
// MSW entirely and hit a real (nonexistent) server. In real mode we point
// at the actual backend origin, which needs CORS configured there.
const baseUrl =
  import.meta.env.VITE_USE_MOCKS === "true" ? "/api/v1" : import.meta.env.VITE_API_BASE_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Wraps the base query so a single 401 transparently attempts one token
// refresh and retries the original request — every feature's api slice
// gets this for free just by injecting into `apiSlice`, no per-endpoint
// retry logic needed.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const isAuthEndpoint =
    typeof args === "object" &&
    (args.url === "/auth/login/" || args.url === "/auth/token/refresh/");

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
        result = await rawBaseQuery(args, api, extraOptions); // retry original request
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
  // Every domain's tag types are declared here as that domain is built,
  // so RTK Query's cache invalidation works uniformly across the app.
  // NOTE: TeacherAnalytics and StudentPerformance are deliberately distinct
  // even though both are "analytics-shaped" -- sharing one tag would let
  // invalidating one endpoint's cache accidentally invalidate the other.
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
  ],
  endpoints: () => ({}),
  // Reset every cached query + mutation the moment the user logs out, so
  // the next session never reads the previous user's data. Without this,
  // RTK Query keys caches by endpoint name + argument, and endpoints like
  // getStudentPerformance take no argument (they rely on the auth token to
  // scope the response), so Rahul's cached result looks identical to
  // Meera's and would be served to Meera after login.
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => action.type === loggedOut.type,
      () => ({})
    );
  },
});
