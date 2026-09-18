import { apiSlice } from "./apiSlice";

export const examsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ---------- lists ------------------------------------------------------

    // GET /quizzes/ -- student-only: every published quiz across the
    // student's enrolled classes. Backs the /student/quizzes page.
    getAllQuizzes: builder.query({
      query: () => "/quizzes/",
      providesTags: (result) =>
        result
          ? [...result.map((q) => ({ type: "Quiz", id: q.id })), { type: "Quiz", id: "LIST" }]
          : [{ type: "Quiz", id: "LIST" }],
    }),

    // GET /classes/{classId}/quizzes/ -- teacher: all quizzes in class;
    // student: published only.
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

    // GET /quizzes/{id}/ -- teacher: full (is_correct included);
    // student: published only (is_correct stripped server-side).
    getQuizDetail: builder.query({
      query: (quizId) => `/quizzes/${quizId}/`,
      providesTags: (result, error, quizId) => [{ type: "Quiz", id: quizId }],
    }),

    createQuiz: builder.mutation({
      // body: { title, description, duration_minutes }
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
      // body: partial { title, description, duration_minutes, is_published }
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
      // body: { text, marks, choices: [{ text, is_correct }] }
      query: ({ quizId, ...body }) => ({
        url: `/quizzes/${quizId}/questions/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }],
    }),

    updateQuestion: builder.mutation({
      // body MUST include quiz_id so the handler can authorize ownership.
      // body: { quiz_id, text?, marks?, choices? }
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }],
    }),

    deleteQuestion: builder.mutation({
      // body MUST include quiz_id (see handler).
      query: ({ questionId, quizId }) => ({
        url: `/questions/${questionId}/`,
        method: "DELETE",
        body: { quiz_id: quizId },
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }],
    }),

    // ---------- submissions -----------------------------------------------

    submitQuiz: builder.mutation({
      // body: { answers: { [questionId]: [choiceId] } }
      query: ({ quizId, answers }) => ({
        url: `/quizzes/${quizId}/submit/`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: (result, error, { quizId }) => [
        { type: "Quiz", id: quizId },
        { type: "Submission", id: "LIST" },
      ],
    }),

    // GET /submissions/{id}/ -- result review
    getSubmission: builder.query({
      query: (submissionId) => `/submissions/${submissionId}/`,
      providesTags: (result, error, submissionId) => [
        { type: "Submission", id: submissionId },
      ],
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
} = examsApi;
