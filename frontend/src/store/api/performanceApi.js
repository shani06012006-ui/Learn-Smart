import { apiSlice } from "./apiSlice";

export const performanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /student/performance/ -- student-scoped aggregated performance.
    // Tagged with StudentPerformance (distinct from TeacherAnalytics) so
    // invalidating the teacher dashboard's cache can't accidentally affect
    // a student's performance query, and vice versa.
    getStudentPerformance: builder.query({
      query: () => "/student/performance/",
      providesTags: ["StudentPerformance"],
    }),
  }),
});

export const { useGetStudentPerformanceQuery } = performanceApi;
