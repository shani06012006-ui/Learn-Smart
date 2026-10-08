import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  adminAccessTokenRotated,
  adminLoggedOut,
} from "../slices/adminAuthSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const state = getState();
    const token =
      state.adminAuth?.accessToken || state.auth?.accessToken || null;
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
    "AdminGrade",
    "AdminSession",
    "AdminEnrollment",
    "AdminAttendance",
    "AdminTimetable",
    "StudentLeave",
    "TeacherLeave",
    "MyLeave",
    "Class",
    "Enrollment",
    "Material",
    "Announcement",
    "ChatThread",
    "ChatMessage",
    "ClassDetail",
    "ClassRoster",
    "ClassMaterial",
    "MaterialList",
  ],
  endpoints: (builder) => ({
    // ---- Teacher students (real enrollments only) ----
    getTeacherStudents: builder.query({
      query: ({ grade } = {}) => ({
        url: `/teacher/students/`,
        params: { grade },
      }),
      providesTags: ["Attendance"],
    }),

    // ---- Teacher attendance ----
    getTeacherAttendance: builder.query({
      query: ({ klass, grade, date }) => ({
        url: `/teacher/attendance/`,
        params: { klass, grade, date },
      }),
      providesTags: ["Attendance"],
    }),
    markTeacherAttendance: builder.mutation({
      query: (body) => ({
        url: `/teacher/attendance/mark/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),
    getTeacherAttendanceStats: builder.query({
      query: ({ klass, from, to } = {}) => ({
        url: `/teacher/attendance/stats/`,
        params: { klass, from, to },
      }),
      providesTags: ["Attendance"],
    }),
    getTeacherAttendanceSummary: builder.query({
      query: ({ klass, from, to } = {}) => ({
        url: `/teacher/attendance/summary/`,
        params: { klass, from, to },
      }),
      providesTags: ["Attendance"],
    }),

    // ---- Attendance ----
    getAttendanceSummary: builder.query({
      query: ({ klass, grade, from, to } = {}) => ({
        url: `/admin/attendance/summary/`,
        params: { klass, grade, from, to },
      }),
      providesTags: ["Attendance"],
    }),
    getAttendance: builder.query({
      query: ({ klass, grade, date }) => ({
        url: `/admin/attendance/`,
        params: { klass, grade, date },
      }),
      providesTags: ["Attendance"],
    }),
    markAttendance: builder.mutation({
      query: (body) => ({
        url: `/admin/attendance/mark/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),
    getAttendanceStats: builder.query({
      query: ({ klass, from, to } = {}) => ({
        url: `/admin/attendance/stats/`,
        params: { klass, from, to },
      }),
      providesTags: ["Attendance"],
    }),

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

    getGrades: builder.query({
      query: () => `/grades/`,
      providesTags: [{ type: "AdminGrade", id: "LIST" }],
    }),

    getGrade: builder.query({
      query: (id) => `/grades/${id}/`,
      providesTags: (result, error, id) => [{ type: "AdminGrade", id }],
    }),

    createGrade: builder.mutation({
      query: (body) => ({
        url: "/grades/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AdminGrade", id: "LIST" }],
    }),

    updateGrade: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/grades/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: [{ type: "AdminGrade", id: "LIST" }],
    }),

    deleteGrade: builder.mutation({
      query: (id) => ({
        url: `/grades/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminGrade", id: "LIST" }],
    }),

    getAdminUsers: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.role) search.set("role", params.role);
        if (params.q) search.set("q", params.q);
        if (params.grade) search.set("grade", params.grade);
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
        { type: "AdminGrade", id: "LIST" },
      ],
    }),

    removeAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/remove/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
        { type: "AdminGrade", id: "LIST" },
      ],
    }),

    hardDeleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/hard/?confirm=YES`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUser"],
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

    getTimetable: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.day !== undefined && params.day !== "")
          search.set("day", String(params.day));
        if (params.active !== undefined)
          search.set("active", String(params.active));
        const qs = search.toString();
        return qs ? `/timetable/?${qs}` : "/timetable/";
      },
      providesTags: ["AdminTimetable"],
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
        if (params.grade) search.set("grade", params.grade);
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
        { type: "AdminGrade", id: "LIST" },
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
        { type: "AdminGrade", id: "LIST" },
      ],
    }),

    deleteAdminCourse: builder.mutation({
      query: (id) => ({
        url: `/admin/courses/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "AdminCourse", id: "LIST" },
        { type: "AdminStats" },
      ],
    }),

    // ─────────────────────────────────────────────────────────
    // Classes (teacher / student, role-scoped by backend)
    // ─────────────────────────────────────────────────────────

    getClasses: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.page) search.set("page", params.page);
        const qs = search.toString();
        return `/classes/${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "Class", id: "LIST" }],
    }),

    getClass: builder.query({
      query: (id) => `/classes/${id}/`,
      providesTags: (result, error, id) => [{ type: "ClassDetail", id }],
    }),

    createClass: builder.mutation({
      query: (body) => ({
        url: "/classes/",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Class", id: "LIST" },
        { type: "ClassDetail", id: "NEW" },
      ],
    }),

    updateClass: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/classes/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Class", id: "LIST" },
        { type: "ClassDetail", id },
      ],
    }),

    deleteClass: builder.mutation({
      query: (id) => ({
        url: `/classes/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),

    getClassStudents: builder.query({
      query: (id) => `/classes/${id}/students/`,
      providesTags: (result, error, id) => [{ type: "ClassRoster", id }],
    }),

    getClassMaterials: builder.query({
      query: (id) => `/classes/${id}/materials/`,
      providesTags: (result, error, id) => [{ type: "ClassMaterial", id }],
    }),

    getAllMaterials: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.class_course) search.set("class_course", params.class_course);
        if (params.q) search.set("q", params.q);
        const qs = search.toString();
        return `/materials/${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "MaterialList", id: "ALL" }],
    }),

    addClassStudent: builder.mutation({
      query: ({ classId, email, first_name, last_name, grade_id }) => ({
        url: `/classes/${classId}/students/`,
        method: "POST",
        body: {
          email,
          first_name,
          last_name,
          ...(grade_id ? { grade_id } : {}),
        },
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "ClassRoster", id: classId },
        { type: "Class", id: "LIST" },
        { type: "ClassDetail", id: classId },
      ],
    }),

    updateEnrollmentStatus: builder.mutation({
      query: ({ classId, enrollmentId, status }) => ({
        url: `/classes/${classId}/students/${enrollmentId}/`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "ClassRoster", id: classId },
        { type: "ClassDetail", id: classId },
      ],
    }),

    uploadClassMaterial: builder.mutation({
      query: ({ classId, formData }) => ({
        url: `/classes/${classId}/materials/`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "ClassMaterial", id: classId },
        { type: "ClassDetail", id: classId },
      ],
    }),

    deleteMaterial: builder.mutation({
      query: ({ materialId }) => ({
        url: `/materials/${materialId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ClassMaterial", id: "LIST" }],
    }),

    // ─────────────────────────────────────────────────────────
    // Chat — institution teacher group
    // ─────────────────────────────────────────────────────────

    getTeacherGroupThread: builder.query({
      query: () => `/chat/teacher-group/`,
      providesTags: [{ type: "ChatThread", id: "teacher-group" }],
    }),

    getTeacherGroupMembers: builder.query({
      query: () => `/chat/teacher-group/members/`,
      providesTags: [{ type: "ChatThread", id: "teacher-group-members" }],
    }),

    // ─────────────────────────────────────────────────────────
    // My leaves (teacher or student)
    // ─────────────────────────────────────────────────────────

    getMyLeaves: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.status) search.set("status", params.status);
        const qs = search.toString();
        return `/leaves/my/${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "MyLeave", id: "LIST" }],
    }),

    createMyLeave: builder.mutation({
      query: (body) => ({
        url: "/leaves/my/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "MyLeave", id: "LIST" }],
    }),

    cancelMyLeave: builder.mutation({
      query: ({ leaveId }) => ({
        url: `/leaves/${leaveId}/cancel/`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "MyLeave", id: "LIST" }],
    }),

    getMyLeaveSummary: builder.query({
      query: () => `/leaves/summary/`,
      providesTags: [{ type: "MyLeave", id: "SUMMARY" }],
    }),

    getStudentsList: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.scope) search.set("scope", params.scope);
        if (params.grade) search.set("grade", params.grade);
        if (params.q) search.set("q", params.q);
        const qs = search.toString();
        return `/auth/students/${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "AdminUser", id: "STUDENT_LIST" }],
    }),

    createTeacherStudent: builder.mutation({
      query: (body) => ({
        url: "/auth/students/create/",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "AdminUser", id: "STUDENT_LIST" },
        { type: "Class", id: "LIST" },
        { type: "ClassRoster", id: "LIST" },
      ],
    }),


    getTeacherGroupMessages: builder.query({
      query: ({ after } = {}) =>
        `/chat/teacher-group/messages/${after ? `?after=${encodeURIComponent(after)}` : ""}`,
      providesTags: [{ type: "ChatMessage", id: "teacher-group" }],
    }),

    sendTeacherGroupMessage: builder.mutation({
      query: (body) => ({
        url: `/chat/teacher-group/messages/`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: [{ type: "ChatMessage", id: "teacher-group" }],
    }),

    toggleMessageReaction: builder.mutation({
      query: ({ messageId, emoji }) => ({
        url: `/chat/messages/${messageId}/react/`,
        method: "POST",
        body: { emoji },
      }),
      invalidatesTags: [{ type: "ChatMessage", id: "teacher-group" }],
    }),

    removeMessageReaction: builder.mutation({
      query: ({ messageId }) => ({
        url: `/chat/messages/${messageId}/react/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ChatMessage", id: "teacher-group" }],
    }),


    getAdminCourseStudents: builder.query({
      query: (id) => `/admin/courses/${id}/students/`,
      providesTags: (result, error, id) => [
        { type: "AdminCourse", id: `students-${id}` },
      ],
    }),

    addAdminCourseStudent: builder.mutation({
      query: ({ courseId, email, first_name, last_name, grade_id }) => ({
        url: `/admin/courses/${courseId}/students/`,
        method: "POST",
        body: {
          email,
          first_name,
          last_name,
          ...(grade_id ? { grade_id } : {}),
        },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "AdminCourse", id: `students-${courseId}` },
        { type: "AdminCourse", id: courseId },
        { type: "AdminCourse", id: "LIST" },
      ],
    }),

    updateAdminCourseStudentStatus: builder.mutation({
      query: ({ courseId, enrollmentId, status }) => ({
        url: `/admin/courses/${courseId}/students/${enrollmentId}/`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "AdminCourse", id: `students-${courseId}` },
        { type: "AdminCourse", id: courseId },
      ],
    }),

    // ---------- admin leaves (students) ----------------------------

    getStudentLeaves: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.status) search.set("status", params.status);
        if (params.leave_type) search.set("leave_type", params.leave_type);
        if (params.student_id) search.set("student_id", params.student_id);
        if (params.from) search.set("from", params.from);
        if (params.to) search.set("to", params.to);
        if (params.q) search.set("q", params.q);
        if (params.institution) search.set("institution", params.institution);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/leaves/students/?${qs}` : "/admin/leaves/students/";
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.results || []).map((l) => ({ type: "StudentLeave", id: l.id })),
              { type: "StudentLeave", id: "LIST" },
            ]
          : [{ type: "StudentLeave", id: "LIST" }],
    }),

    createStudentLeave: builder.mutation({
      query: (body) => ({ url: "/admin/leaves/students/", method: "POST", body }),
      invalidatesTags: [{ type: "StudentLeave", id: "LIST" }],
    }),

    updateStudentLeave: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/leaves/students/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StudentLeave", id },
        { type: "StudentLeave", id: "LIST" },
      ],
    }),

    approveStudentLeave: builder.mutation({
      query: ({ id, admin_remarks }) => ({
        url: `/admin/leaves/students/${id}/approve/`,
        method: "POST",
        body: { admin_remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StudentLeave", id },
        { type: "StudentLeave", id: "LIST" },
      ],
    }),

    rejectStudentLeave: builder.mutation({
      query: ({ id, admin_remarks }) => ({
        url: `/admin/leaves/students/${id}/reject/`,
        method: "POST",
        body: { admin_remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StudentLeave", id },
        { type: "StudentLeave", id: "LIST" },
      ],
    }),

    cancelStudentLeave: builder.mutation({
      query: ({ id, admin_remarks }) => ({
        url: `/admin/leaves/students/${id}/cancel/`,
        method: "POST",
        body: { admin_remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StudentLeave", id },
        { type: "StudentLeave", id: "LIST" },
      ],
    }),

    // ---------- admin leaves (teachers) ----------------------------

    getTeacherLeaves: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.status) search.set("status", params.status);
        if (params.leave_type) search.set("leave_type", params.leave_type);
        if (params.teacher_id) search.set("teacher_id", params.teacher_id);
        if (params.from) search.set("from", params.from);
        if (params.to) search.set("to", params.to);
        if (params.q) search.set("q", params.q);
        if (params.institution) search.set("institution", params.institution);
        if (params.page) search.set("page", String(params.page));
        const qs = search.toString();
        return qs ? `/admin/leaves/teachers/?${qs}` : "/admin/leaves/teachers/";
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.results || []).map((l) => ({ type: "TeacherLeave", id: l.id })),
              { type: "TeacherLeave", id: "LIST" },
            ]
          : [{ type: "TeacherLeave", id: "LIST" }],
    }),

    createTeacherLeave: builder.mutation({
      query: (body) => ({ url: "/admin/leaves/teachers/", method: "POST", body }),
      invalidatesTags: [{ type: "TeacherLeave", id: "LIST" }],
    }),

    updateTeacherLeave: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/leaves/teachers/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TeacherLeave", id },
        { type: "TeacherLeave", id: "LIST" },
      ],
    }),

    approveTeacherLeave: builder.mutation({
      query: ({ id, admin_remarks }) => ({
        url: `/admin/leaves/teachers/${id}/approve/`,
        method: "POST",
        body: { admin_remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TeacherLeave", id },
        { type: "TeacherLeave", id: "LIST" },
      ],
    }),

    rejectTeacherLeave: builder.mutation({
      query: ({ id, admin_remarks }) => ({
        url: `/admin/leaves/teachers/${id}/reject/`,
        method: "POST",
        body: { admin_remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TeacherLeave", id },
        { type: "TeacherLeave", id: "LIST" },
      ],
    }),

    cancelTeacherLeave: builder.mutation({
      query: ({ id, admin_remarks }) => ({
        url: `/admin/leaves/teachers/${id}/cancel/`,
        method: "POST",
        body: { admin_remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TeacherLeave", id },
        { type: "TeacherLeave", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useHardDeleteAdminUserMutation,
  useGetTeacherStudentsQuery,

  useGetAttendanceSummaryQuery,
  useGetTeacherAttendanceQuery,
  useMarkTeacherAttendanceMutation,
  useGetTeacherAttendanceStatsQuery,
  useGetTeacherAttendanceSummaryQuery,

  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useGetAttendanceStatsQuery,

  useAdminLoginMutation,
  useGetAdminCoursesQuery,
  useGetAdminCourseQuery,
  useCreateAdminCourseMutation,
  useUpdateAdminCourseMutation,
  useDeleteAdminCourseMutation,
  useAdminMeQuery,
  useAdminLogoutMutation,
  useGetAdminUsersQuery,
  useGetGradesQuery,
  useGetGradeQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
  useGetAdminUserQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useToggleAdminUserActiveMutation,
  useRemoveAdminUserMutation,
  useGetAdminStatsQuery,
  useGetAdminUserClassesQuery,
  useGetAdminUserEnrollmentsQuery,
  useGetAdminCourseStudentsQuery,
  useAddAdminCourseStudentMutation,
  useUpdateAdminCourseStudentStatusMutation,
  useGetTeacherGroupThreadQuery,
  useGetTeacherGroupMembersQuery,
  useGetMyLeavesQuery,
  useCreateMyLeaveMutation,
  useCancelMyLeaveMutation,
  useGetMyLeaveSummaryQuery,
  useGetStudentsListQuery,
  useCreateTeacherStudentMutation,
  useGetTeacherGroupMessagesQuery,
  useSendTeacherGroupMessageMutation,
  useToggleMessageReactionMutation,
  useRemoveMessageReactionMutation,
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
  useGetAdminEnrollmentsQuery,
  useGetAdminTeacherAttendanceQuery,
  useGetAdminStudentAttendanceQuery,
  useGetAdminTimetableQuery,
  useGetTimetableQuery,
  useGetClassesQuery,
  useGetClassQuery,
  useGetClassStudentsQuery,
  useGetClassMaterialsQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetAllMaterialsQuery,
  useAddClassStudentMutation,
  useUpdateEnrollmentStatusMutation,
  useUploadClassMaterialMutation,
  useDeleteMaterialMutation,
  useCreateAdminTimetableMutation,
  useUpdateAdminTimetableMutation,
  useGetStudentLeavesQuery,
  useCreateStudentLeaveMutation,
  useUpdateStudentLeaveMutation,
  useApproveStudentLeaveMutation,
  useRejectStudentLeaveMutation,
  useCancelStudentLeaveMutation,
  useGetTeacherLeavesQuery,
  useCreateTeacherLeaveMutation,
  useUpdateTeacherLeaveMutation,
  useApproveTeacherLeaveMutation,
  useRejectTeacherLeaveMutation,
  useCancelTeacherLeaveMutation,
  useDeactivateAdminTimetableMutation,

} = realApi;
