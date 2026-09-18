import { apiSlice } from "./apiSlice";

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /teacher/dashboard/analytics/ -- aggregated data for the teacher
    // dashboard (all six widgets come from this single response).
    getTeacherDashboardAnalytics: builder.query({
      query: () => "/teacher/dashboard/analytics/",
      providesTags: ["TeacherAnalytics"],
    }),
  }),
});

export const { useGetTeacherDashboardAnalyticsQuery } = analyticsApi;
