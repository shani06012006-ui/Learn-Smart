import { apiSlice } from "./apiSlice";

export const materialsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ---------- materials --------------------------------------------------

    getMaterials: builder.query({
      query: (classId) => `/classes/${classId}/materials/`,
      providesTags: (result, error, classId) =>
        result
          ? [
              ...result.map((m) => ({ type: "Material", id: m.id })),
              { type: "Material", id: `LIST-${classId}` },
            ]
          : [{ type: "Material", id: `LIST-${classId}` }],
    }),

    getMaterial: builder.query({
      query: (materialId) => `/materials/${materialId}/`,
      providesTags: (result, error, materialId) => [
        { type: "Material", id: materialId },
      ],
    }),

    uploadMaterial: builder.mutation({
      query: ({ classId, formData }) => ({
        url: `/classes/${classId}/materials/`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Material", id: `LIST-${classId}` },
        { type: "Notification", id: "LIST" },
      ],
    }),

    deleteMaterial: builder.mutation({
      query: ({ materialId }) => ({
        url: `/materials/${materialId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { materialId, classId }) => [
        { type: "Material", id: materialId },
        { type: "Material", id: `LIST-${classId}` },
      ],
    }),

    // ---------- announcements ---------------------------------------------

    getAnnouncements: builder.query({
      query: (classId) => `/classes/${classId}/announcements/`,
      providesTags: (result, error, classId) =>
        result
          ? [
              ...result.map((a) => ({ type: "Announcement", id: a.id })),
              { type: "Announcement", id: `LIST-${classId}` },
            ]
          : [{ type: "Announcement", id: `LIST-${classId}` }],
    }),

    // GET /announcements/ -- the student's aggregated announcements across
    // every class they're actively enrolled in. Backs the dashboard widget.
    getMyAnnouncements: builder.query({
      query: () => "/announcements/",
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "Announcement", id: a.id })),
              { type: "Announcement", id: "MY-LIST" },
            ]
          : [{ type: "Announcement", id: "MY-LIST" }],
    }),

    createAnnouncement: builder.mutation({
      query: ({ classId, ...body }) => ({
        url: `/classes/${classId}/announcements/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Announcement", id: `LIST-${classId}` },
        { type: "Announcement", id: "MY-LIST" },
        { type: "Notification", id: "LIST" },
      ],
    }),

    deleteAnnouncement: builder.mutation({
      query: ({ announcementId }) => ({
        url: `/announcements/${announcementId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { announcementId, classId }) => [
        { type: "Announcement", id: announcementId },
        { type: "Announcement", id: `LIST-${classId}` },
        { type: "Announcement", id: "MY-LIST" },
      ],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialQuery,
  useUploadMaterialMutation,
  useDeleteMaterialMutation,
  useGetAnnouncementsQuery,
  useGetMyAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = materialsApi;


