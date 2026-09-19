import { apiSlice } from "./apiSlice";

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /notifications/ -- the caller's own notifications, newest first.
    getNotifications: builder.query({
      query: () => "/notifications/",
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({ type: "Notification", id: n.id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    // POST /notifications/:id/read/
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, notificationId) => [
        { type: "Notification", id: notificationId },
        { type: "Notification", id: "LIST" },
      ],
    }),

    // POST /notifications/read-all/
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all/",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
