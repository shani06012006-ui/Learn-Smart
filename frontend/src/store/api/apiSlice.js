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
  tagTypes: ["Me", "Class", "Enrollment", "Material", "Announcement"],
  endpoints: () => ({}),
});
