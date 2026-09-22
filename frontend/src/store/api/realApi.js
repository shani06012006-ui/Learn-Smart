import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  adminAccessTokenRotated,
  adminLoggedOut,
} from "../slices/adminAuthSlice";

// Real backend API slice — separate from the mock-backed `apiSlice`. Talks
// to Django via the Vite proxy at /api/v1/*. Different reducer path, own
// cache, own tag model, own middleware. It never touches the mock slice.

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().adminAuth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Refresh-on-401, mirroring the mock slice's pattern. Only the auth
// endpoints are exempt (a 401 from /auth/login/ is a real credential
// failure, not an expired session).
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args?.url || "";
  const isAuthEndpoint =
    url.includes("/auth/login/") || url.includes("/auth/refresh/");

  if (result.error?.status === 401 && !isAuthEndpoint) {
    const refreshToken = api.getState().adminAuth.refreshToken;

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: "/auth/refresh/",
          method: "POST",
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        api.dispatch(adminAccessTokenRotated(refreshResult.data));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(adminLoggedOut());
      }
    } else {
      api.dispatch(adminLoggedOut());
    }
  }

  return result;
};

export const realApi = createApi({
  reducerPath: "realApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AdminUser", "AdminStats", "AdminInstitution"],
  endpoints: (builder) => ({
    // ---------- auth -------------------------------------------------

    adminLogin: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login/",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["AdminUser", "AdminStats"],
    }),

    adminMe: builder.query({
      query: () => "/auth/me/",
      providesTags: ["AdminUser"],
    }),

    adminLogout: builder.mutation({
      query: (refresh) => ({
        url: "/auth/logout/",
        method: "POST",
        body: { refresh },
      }),
    }),

    // ---------- admin users -----------------------------------------

    getAdminUsers: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.role) search.set("role", params.role);
        if (params.q) search.set("q", params.q);
        if (params.is_active !== undefined)
          search.set("is_active", String(params.is_active));
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/users/?${qs}` : "/admin/users/";
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.results || []).map((u) => ({
                type: "AdminUser",
                id: u.id,
              })),
              { type: "AdminUser", id: "LIST" },
            ]
          : [{ type: "AdminUser", id: "LIST" }],
    }),

    getAdminUser: builder.query({
      query: (id) => `/admin/users/${id}/`,
      providesTags: (result, error, id) => [{ type: "AdminUser", id }],
    }),

    createAdminUser: builder.mutation({
      query: (body) => ({
        url: "/admin/users/",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "AdminUser", id: "LIST" },
        { type: "AdminStats" },
      ],
    }),

    updateAdminUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/users/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
      ],
    }),

    toggleAdminUserActive: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `/admin/users/${id}/toggle-active/`,
        method: "POST",
        body: { is_active },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
        { type: "AdminStats" },
      ],
    }),

    // ---------- admin stats -----------------------------------------

    getAdminStats: builder.query({
      query: () => "/admin/stats/",
      providesTags: ["AdminStats"],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useAdminMeQuery,
  useAdminLogoutMutation,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useToggleAdminUserActiveMutation,
  useGetAdminStatsQuery,
} = realApi;