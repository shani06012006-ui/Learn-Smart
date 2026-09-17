import { apiSlice } from "./apiSlice";

export const classesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /classes/ -- teacher: own classes, student: active enrollments
    getClasses: builder.query({
      query: () => "/classes/",
      transformResponse: (response) => response.results ?? response,
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: "Class", id: c.id })), { type: "Class", id: "LIST" }]
          : [{ type: "Class", id: "LIST" }],
    }),

    getClassDetail: builder.query({
      query: (classId) => `/classes/${classId}/`,
      providesTags: (result, error, classId) => [{ type: "Class", id: classId }],
    }),

    createClass: builder.mutation({
      // body: { name, subject, description }
      query: (body) => ({ url: "/classes/", method: "POST", body }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),

    updateClass: builder.mutation({
      query: ({ classId, ...patch }) => ({ url: `/classes/${classId}/`, method: "PATCH", body: patch }),
      invalidatesTags: (result, error, { classId }) => [{ type: "Class", id: classId }],
    }),

    deleteClass: builder.mutation({
      // soft-deletes on the real backend -- disappears from lists, doesn't hard-delete
      query: (classId) => ({ url: `/classes/${classId}/`, method: "DELETE" }),
      invalidatesTags: (result, error, classId) => [
        { type: "Class", id: classId },
        { type: "Class", id: "LIST" },
      ],
    }),

    // GET /classes/{id}/students/ -- teacher-only roster
    getRoster: builder.query({
      query: (classId) => `/classes/${classId}/students/`,
      providesTags: (result, error, classId) => [{ type: "Enrollment", id: classId }],
    }),

    // POST /classes/{id}/students/ -- add a student, generates joining code
    addStudent: builder.mutation({
      query: ({ classId, ...body }) => ({
        url: `/classes/${classId}/students/`,
        method: "POST",
        body,
      }),
      // adding a student changes both the roster AND the class's student_count
      invalidatesTags: (result, error, { classId }) => [
        { type: "Enrollment", id: classId },
        { type: "Class", id: classId },
        { type: "Class", id: "LIST" },
      ],
    }),

    // PATCH /classes/{id}/students/{enrollmentId}/ -- block/remove/reactivate
    updateEnrollmentStatus: builder.mutation({
      query: ({ classId, enrollmentId, status }) => ({
        url: `/classes/${classId}/students/${enrollmentId}/`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Enrollment", id: classId },
        { type: "Class", id: classId },
        { type: "Class", id: "LIST" },
      ],
    }),

    // POST /enrollments/join/ -- student redeems a joining code (wired to UI in Step 3)
    joinClass: builder.mutation({
      query: (joining_code) => ({ url: "/enrollments/join/", method: "POST", body: { joining_code } }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useGetClassDetailQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetRosterQuery,
  useAddStudentMutation,
  useUpdateEnrollmentStatusMutation,
  useJoinClassMutation,
} = classesApi;
