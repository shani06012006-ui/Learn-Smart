import { apiSlice } from "./apiSlice";

export const liveClassesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /live-classes/ -- caller-scoped: teacher sees their own classes'
    // sessions; student sees sessions for their actively-enrolled classes.
    getLiveClasses: builder.query({
      query: () => "/live-classes/",
      providesTags: (result) =>
        result
          ? [
              ...result.map((l) => ({ type: "LiveClass", id: l.id })),
              { type: "LiveClass", id: "LIST" },
            ]
          : [{ type: "LiveClass", id: "LIST" }],
    }),

    // GET /classes/:classId/live-classes/ -- sessions for one class.
    getLiveClassesForClass: builder.query({
      query: (classId) => `/classes/${classId}/live-classes/`,
      providesTags: (result, error, classId) =>
        result
          ? [
              ...result.map((l) => ({ type: "LiveClass", id: l.id })),
              { type: "LiveClass", id: `LIST-${classId}` },
            ]
          : [{ type: "LiveClass", id: `LIST-${classId}` }],
    }),

    // POST /classes/:classId/live-classes/ -- teacher schedules a session.
    scheduleLiveClass: builder.mutation({
      query: ({ classId, ...body }) => ({
        url: `/classes/${classId}/live-classes/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "LiveClass", id: "LIST" },
        { type: "LiveClass", id: `LIST-${classId}` },
        { type: "Notification", id: "LIST" },
      ],
    }),

    // PATCH /live-classes/:id/ -- edit or cancel.
    updateLiveClass: builder.mutation({
      query: ({ liveClassId, ...patch }) => ({
        url: `/live-classes/${liveClassId}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { liveClassId, classId }) => [
        { type: "LiveClass", id: liveClassId },
        { type: "LiveClass", id: "LIST" },
        ...(classId ? [{ type: "LiveClass", id: `LIST-${classId}` }] : []),
      ],
    }),

    // DELETE /live-classes/:id/ -- soft delete.
    deleteLiveClass: builder.mutation({
      query: ({ liveClassId }) => ({
        url: `/live-classes/${liveClassId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { liveClassId, classId }) => [
        { type: "LiveClass", id: liveClassId },
        { type: "LiveClass", id: "LIST" },
        ...(classId ? [{ type: "LiveClass", id: `LIST-${classId}` }] : []),
      ],
    }),
  }),
});

export const {
  useGetLiveClassesQuery,
  useGetLiveClassesForClassQuery,
  useScheduleLiveClassMutation,
  useUpdateLiveClassMutation,
  useDeleteLiveClassMutation,
} = liveClassesApi;
