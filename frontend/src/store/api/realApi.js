import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  adminAccessTokenRotated,
  adminLoggedOut,
} from "../slices/adminAuthSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().adminAuth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

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
  tagTypes: [
    "AdminUser",
    "AdminStats",
    "AdminInstitution",
    "AdminCourse",
    "AdminAudit",
    "AdminSession",
    "AdminEnrollment",
    "AdminAttendance",
    "AdminTimetable",
  ],
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

    getAdminUserClasses: builder.query({
      query: (id) => `/admin/users/${id}/classes/`,
      providesTags: (result, error, id) => [
        { type: "AdminUser", id: `classes-${id}` },
      ],
    }),

    getAdminUserEnrollments: builder.query({
      query: (id) => `/admin/users/${id}/enrollments/`,
      providesTags: (result, error, id) => [
        { type: "AdminUser", id: `enrollments-${id}` },
      ],
    }),

    // ---------- admin audit log ------------------------------------

    getAdminAuditLogs: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.action) search.set("action", params.action);
        if (params.resource_type) search.set("resource_type", params.resource_type);
        if (params.actor_id) search.set("actor_id", params.actor_id);
        if (params.since) search.set("since", params.since);
        if (params.until) search.set("until", params.until);
        if (params.q) search.set("q", params.q);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/audit/?${qs}` : "/admin/audit/";
      },
      providesTags: ["AdminAudit"],
    }),

    getAdminAuditActions: builder.query({
      query: () => "/admin/audit/actions/",
      providesTags: ["AdminAudit"],
    }),

    // ---------- admin sessions -------------------------------------

    getAdminSessions: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.user_id) search.set("user_id", params.user_id);
        if (params.status) search.set("status", params.status);
        if (params.q) search.set("q", params.q);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/sessions/?${qs}` : "/admin/sessions/";
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.results || []).map((s) => ({
                type: "AdminSession",
                id: s.id,
              })),
              { type: "AdminSession", id: "LIST" },
            ]
          : [{ type: "AdminSession", id: "LIST" }],
    }),

    revokeAdminSession: builder.mutation({
      query: (id) => ({
        url: `/admin/sessions/${id}/revoke/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdminSession", id },
        { type: "AdminSession", id: "LIST" },
      ],
    }),

    // ---------- admin enrollments ----------------------------------

    getAdminEnrollments: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.status) search.set("status", params.status);
        if (params.class_id) search.set("class_id", params.class_id);
        if (params.student_id) search.set("student_id", params.student_id);
        if (params.q) search.set("q", params.q);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/enrollments/?${qs}` : "/admin/enrollments/";
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.results || []).map((e) => ({
                type: "AdminEnrollment",
                id: e.id,
              })),
              { type: "AdminEnrollment", id: "LIST" },
            ]
          : [{ type: "AdminEnrollment", id: "LIST" }],
    }),

    // ---------- admin attendance -----------------------------------

    getAdminTeacherAttendance: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.date) search.set("date", params.date);
        if (params.status) search.set("status", params.status);
        if (params.institution) search.set("institution", params.institution);
        if (params.q) search.set("q", params.q);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs
          ? `/admin/attendance/teachers/?${qs}`
          : "/admin/attendance/teachers/";
      },
      providesTags: ["AdminAttendance"],
    }),

    getAdminStudentAttendance: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.date) search.set("date", params.date);
        if (params.status) search.set("status", params.status);
        if (params.class_id) search.set("class_id", params.class_id);
        if (params.student_id) search.set("student_id", params.student_id);
        if (params.institution) search.set("institution", params.institution);
        if (params.q) search.set("q", params.q);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs
          ? `/admin/attendance/students/?${qs}`
          : "/admin/attendance/students/";
      },
      providesTags: ["AdminAttendance"],
    }),

    // ---------- admin timetable ------------------------------------

    getAdminTimetable: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.teacher) search.set("teacher", params.teacher);
        if (params.class_id) search.set("class_id", params.class_id);
        if (params.day !== undefined && params.day !== "")
          search.set("day", String(params.day));
        if (params.institution) search.set("institution", params.institution);
        if (params.active !== undefined)
          search.set("active", String(params.active));
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/timetable/?${qs}` : "/admin/timetable/";
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.results || []).map((t) => ({
                type: "AdminTimetable",
                id: t.id,
              })),
              { type: "AdminTimetable", id: "LIST" },
            ]
          : [{ type: "AdminTimetable", id: "LIST" }],
    }),

    createAdminTimetable: builder.mutation({
      query: (body) => ({
        url: "/admin/timetable/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AdminTimetable", id: "LIST" }],
    }),

    updateAdminTimetable: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/timetable/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminTimetable", id },
        { type: "AdminTimetable", id: "LIST" },
      ],
    }),

    deactivateAdminTimetable: builder.mutation({
      query: (id) => ({
        url: `/admin/timetable/${id}/deactivate/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdminTimetable", id },
        { type: "AdminTimetable", id: "LIST" },
      ],
    }),

    // ---------- admin stats -----------------------------------------

    getAdminStats: builder.query({
      query: () => "/admin/stats/",
      providesTags: ["AdminStats"],
    }),

    // ---------- admin courses ---------------------------------------

    getAdminCourses: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.is_archived !== undefined)
          search.set("is_archived", String(params.is_archived));
        if (params.subject) search.set("subject", params.subject);
        if (params.q) search.set("q", params.q);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/courses/?${qs}` : "/admin/courses/";
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.results || []).map((c) => ({
                type: "AdminCourse",
                id: c.id,
              })),
              { type: "AdminCourse", id: "LIST" },
            ]
          : [{ type: "AdminCourse", id: "LIST" }],
    }),

    getAdminCourse: builder.query({
      query: (id) => `/admin/courses/${id}/`,
      providesTags: (result, error, id) => [{ type: "AdminCourse", id }],
    }),

    createAdminCourse: builder.mutation({
      query: (body) => ({
        url: "/admin/courses/",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "AdminCourse", id: "LIST" },
        { type: "AdminStats" },
      ],
    }),

    updateAdminCourse: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/courses/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminCourse", id },
        { type: "AdminCourse", id: "LIST" },
        { type: "AdminStats" },
      ],
    }),

    getAdminCourseStudents: builder.query({
      query: (id) => `/admin/courses/${id}/students/`,
      providesTags: (result, error, id) => [
        { type: "AdminCourse", id: `students-${id}` },
      ],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useGetAdminCoursesQuery,
  useGetAdminCourseQuery,
  useCreateAdminCourseMutation,
  useUpdateAdminCourseMutation,
  useAdminMeQuery,
  useAdminLogoutMutation,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useToggleAdminUserActiveMutation,
  useGetAdminStatsQuery,
  useGetAdminUserClassesQuery,
  useGetAdminUserEnrollmentsQuery,
  useGetAdminCourseStudentsQuery,
  useGetAdminAuditLogsQuery,
  useGetAdminAuditActionsQuery,
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
  useGetAdminEnrollmentsQuery,
  useGetAdminTeacherAttendanceQuery,
  useGetAdminStudentAttendanceQuery,
  useGetAdminTimetableQuery,
  useCreateAdminTimetableMutation,
  useUpdateAdminTimetableMutation,
  useDeactivateAdminTimetableMutation,
} = realApi;
