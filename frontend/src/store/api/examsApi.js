import { apiSlice } from "./apiSlice";

export const examsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ---------- lists ------------------------------------------------------

    getAllQuizzes: builder.query({
      query: () => "/quizzes/",
      providesTags: (result) =>
        result
          ? [...result.map((q) => ({ type: "Quiz", id: q.id })), { type: "Quiz", id: "LIST" }]
          : [{ type: "Quiz", id: "LIST" }],
    }),

    getQuizzesForClass: builder.query({
      query: (classId) => `/classes/${classId}/quizzes/`,
      providesTags: (result, error, classId) =>
        result
          ? [
              ...result.map((q) => ({ type: "Quiz", id: q.id })),
              { type: "Quiz", id: `LIST-${classId}` },
            ]
          : [{ type: "Quiz", id: `LIST-${classId}` }],
    }),

    // ---------- single quiz ------------------------------------------------

    getQuizDetail: builder.query({
      query: (quizId) => `/quizzes/${quizId}/`,
      providesTags: (result, error, quizId) => [{ type: "Quiz", id: quizId }],
    }),

    createQuiz: builder.mutation({
      query: ({ classId, ...body }) => ({
        url: `/classes/${classId}/quizzes/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Quiz", id: `LIST-${classId}` },
        { type: "Class", id: classId },
      ],
    }),

    updateQuiz: builder.mutation({
      query: ({ quizId, classId, ...patch }) => ({
        url: `/quizzes/${quizId}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { quizId, classId }) => [
        { type: "Quiz", id: quizId },
        { type: "Quiz", id: `LIST-${classId}` },
        { type: "Quiz", id: "LIST" },
      ],
    }),

    deleteQuiz: builder.mutation({
      query: ({ quizId, classId }) => ({
        url: `/quizzes/${quizId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { quizId, classId }) => [
        { type: "Quiz", id: quizId },
        { type: "Quiz", id: `LIST-${classId}` },
        { type: "Quiz", id: "LIST" },
      ],
    }),

    // ---------- questions -------------------------------------------------

    addQuestion: builder.mutation({
      query: ({ quizId, ...body }) => ({
        url: `/quizzes/${quizId}/questions/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }],
    }),

    updateQuestion: builder.mutation({
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }],
    }),

    deleteQuestion: builder.mutation({
      query: ({ questionId, quizId }) => ({
        url: `/questions/${questionId}/`,
        method: "DELETE",
        body: { quiz_id: quizId },
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }],
    }),

    // ---------- submissions -----------------------------------------------

    submitQuiz: builder.mutation({
      query: ({ quizId, answers }) => ({
        url: `/quizzes/${quizId}/submit/`,
        method: "POST",
        body: { answers },
      }),
      // Invalidate the quiz tag (so the list re-fetches the already_submitted
      // flag) and the submission list (so a future submissions-list UI
      // updates). Also drops any cached detail of this specific quiz so
      // the redirect-to-result flow doesn't render a stale "not submitted"
      // detail page.
      invalidatesTags: (result, error, { quizId }) => [
        { type: "Quiz", id: quizId },
        { type: "Quiz", id: "LIST" },
        { type: "Submission", id: "LIST" },
      ],
    }),

    getSubmission: builder.query({
      query: (submissionId) => `/submissions/${submissionId}/`,
      providesTags: (result, error, submissionId) => [
        { type: "Submission", id: submissionId },
      ],
    }),

    // GET /submissions/ -- the student's own submissions (optionally
    // filtered by ?quiz=<id>). Used to check already-submitted state
    // without triggering a fake submit attempt.
    getMySubmissions: builder.query({
      query: ({ quizId } = {}) =>
        quizId ? `/submissions/?quiz=${quizId}` : "/submissions/",
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: "Submission", id: s.id })),
              { type: "Submission", id: "LIST" },
            ]
          : [{ type: "Submission", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllQuizzesQuery,
  useGetQuizzesForClassQuery,
  useGetQuizDetailQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useSubmitQuizMutation,
  useGetSubmissionQuery,
  useGetMySubmissionsQuery,
} = examsApi;
