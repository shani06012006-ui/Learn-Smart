// frontend/src/api/apiSlice.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['Class', 'Enrollment', 'Exam', 'Material', 'Announcement', 'Student'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register/',
        method: 'POST',
        body: userData,
      }),
    }),
    getProfile: builder.query({
      query: () => '/auth/profile/',
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile/',
        method: 'PUT',
        body: data,
      }),
    }),

    // Class endpoints
    getClasses: builder.query({
      query: () => '/classes/',
      providesTags: ['Class'],
    }),
    getClassDetail: builder.query({
      query: (id) => `/classes/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Class', id }],
    }),
    createClass: builder.mutation({
      query: (data) => ({
        url: '/classes/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),
    updateClass: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/classes/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),
    deleteClass: builder.mutation({
      query: (id) => ({
        url: `/classes/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Class'],
    }),
    joinClass: builder.mutation({
      query: (joinCode) => ({
        url: '/classes/join/',
        method: 'POST',
        body: { join_code: joinCode },
      }),
      invalidatesTags: ['Class', 'Enrollment'],
    }),
    leaveClass: builder.mutation({
      query: (classId) => ({
        url: `/classes/${classId}/leave/`,
        method: 'POST',
      }),
      invalidatesTags: ['Class', 'Enrollment'],
    }),

    // Student management
    getClassStudents: builder.query({
      query: (classId) => `/classes/${classId}/students/`,
      providesTags: ['Student'],
    }),
    getStudentStatus: builder.query({
      query: (classId) => `/classes/${classId}/students/status/`,
    }),
    blockStudent: builder.mutation({
      query: ({ classId, studentId }) => ({
        url: `/classes/${classId}/students/${studentId}/block/`,
        method: 'POST',
      }),
      invalidatesTags: ['Student'],
    }),

    // Material endpoints
    getMaterials: builder.query({
      query: (classId) => `/classes/${classId}/materials/`,
      providesTags: ['Material'],
    }),
    createMaterial: builder.mutation({
      query: ({ classId, ...data }) => ({
        url: `/classes/${classId}/materials/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Material'],
    }),
    getMaterialDetail: builder.query({
      query: (id) => `/materials/${id}/`,
    }),
    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Material'],
    }),

    // Announcement endpoints
    getAnnouncements: builder.query({
      query: (classId) => `/classes/${classId}/announcements/`,
      providesTags: ['Announcement'],
    }),
    createAnnouncement: builder.mutation({
      query: ({ classId, ...data }) => ({
        url: `/classes/${classId}/announcements/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Announcement'],
    }),

    // Exam endpoints
    getExams: builder.query({
      query: (classId) => `/classes/${classId}/exams/`,
      providesTags: ['Exam'],
    }),
    getExamDetail: builder.query({
      query: (id) => `/exams/${id}/`,
      providesTags: ['Exam'],
    }),
    createExam: builder.mutation({
      query: ({ classId, ...data }) => ({
        url: `/classes/${classId}/exams/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Exam'],
    }),
    updateExam: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exams/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Exam'],
    }),
    deleteExam: builder.mutation({
      query: (id) => ({
        url: `/exams/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exam'],
    }),

    // Question endpoints
    getQuestions: builder.query({
      query: (examId) => `/exams/${examId}/questions/`,
    }),
    createQuestion: builder.mutation({
      query: ({ examId, ...data }) => ({
        url: `/exams/${examId}/questions/`,
        method: 'POST',
        body: data,
      }),
    }),
    deleteQuestion: builder.mutation({
      query: (questionId) => ({
        url: `/questions/${questionId}/`,
        method: 'DELETE',
      }),
    }),

    // Exam taking
    startExam: builder.mutation({
      query: (examId) => ({
        url: `/exams/${examId}/start/`,
        method: 'POST',
      }),
    }),
    submitAnswer: builder.mutation({
      query: ({ attemptId, data }) => ({
        url: `/attempts/${attemptId}/answer/`,
        method: 'POST',
        body: data,
      }),
    }),
    submitExam: builder.mutation({
      query: (attemptId) => ({
        url: `/attempts/${attemptId}/submit/`,
        method: 'POST',
      }),
    }),
    getExamResults: builder.query({
      query: (attemptId) => `/attempts/${attemptId}/results/`,
    }),

    // AI endpoints
    generateQuestions: builder.mutation({
      query: (data) => ({
        url: '/ai/generate-questions/',
        method: 'POST',
        body: data,
      }),
    }),
    gradeAnswer: builder.mutation({
      query: ({ questionId, data }) => ({
        url: `/ai/grade/${questionId}/`,
        method: 'POST',
        body: data,
      }),
    }),
    analyzePerformance: builder.query({
      query: (studentId) => `/ai/analyze/${studentId}/`,
    }),
    generatePractice: builder.mutation({
      query: (data) => ({
        url: '/ai/practice-questions/',
        method: 'POST',
        body: data,
      }),
    }),

    // Analytics endpoints
    getClassAnalytics: builder.query({
      query: (classId) => `/analytics/class/${classId}/`,
    }),
    getTeacherAnalytics: builder.query({
      query: () => '/analytics/teacher/dashboard/',
    }),

    // Live class endpoints
    getLiveClasses: builder.query({
      query: (classId) => `/classes/${classId}/live-classes/`,
    }),
    createLiveClass: builder.mutation({
      query: ({ classId, ...data }) => ({
        url: `/classes/${classId}/live-classes/`,
        method: 'POST',
        body: data,
      }),
    }),
    joinLiveClass: builder.mutation({
      query: (classId) => ({
        url: `/live-classes/${classId}/join/`,
        method: 'POST',
      }),
    }),
    leaveLiveClass: builder.mutation({
      query: (classId) => ({
        url: `/live-classes/${classId}/leave/`,
        method: 'POST',
      }),
    }),
  }),
});

// Export all hooks
export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,

  // Classes
  useGetClassesQuery,
  useGetClassDetailQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useJoinClassMutation,
  useLeaveClassMutation,

  // Students
  useGetClassStudentsQuery,
  useGetStudentStatusQuery,
  useBlockStudentMutation,

  // Materials
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useGetMaterialDetailQuery,
  useDeleteMaterialMutation,

  // Announcements
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,

  // Exams
  useGetExamsQuery,
  useGetExamDetailQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,

  // Questions
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useDeleteQuestionMutation,

  // Exam Taking
  useStartExamMutation,
  useSubmitAnswerMutation,
  useSubmitExamMutation,
  useGetExamResultsQuery,

  // AI
  useGenerateQuestionsMutation,
  useGradeAnswerMutation,
  useAnalyzePerformanceQuery,
  useGeneratePracticeMutation,

  // Analytics
  useGetClassAnalyticsQuery,
  useGetTeacherAnalyticsQuery,

  // Live Classes
  useGetLiveClassesQuery,
  useCreateLiveClassMutation,
  useJoinLiveClassMutation,
  useLeaveLiveClassMutation,
} = apiSlice;