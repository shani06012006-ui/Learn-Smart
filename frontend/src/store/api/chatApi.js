import { apiSlice } from "./apiSlice";

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /chat/threads/
    getThreads: builder.query({
      query: () => "/chat/threads/",
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "Thread", id: t.id })),
              { type: "Thread", id: "LIST" },
            ]
          : [{ type: "Thread", id: "LIST" }],
    }),

    // GET /chat/threads/{id}/messages/
    getMessages: builder.query({
      query: (threadId) => `/chat/threads/${threadId}/messages/`,
      providesTags: (result, error, threadId) => [
        { type: "Message", id: `LIST-${threadId}` },
      ],
    }),

    // POST /chat/threads/{id}/messages/
    sendMessage: builder.mutation({
      query: ({ threadId, body }) => ({
        url: `/chat/threads/${threadId}/messages/`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: (result, error, { threadId }) => [
        { type: "Message", id: `LIST-${threadId}` },
        { type: "Thread", id: threadId },
        { type: "Thread", id: "LIST" },
      ],
    }),

    // POST /chat/threads/{id}/read/
    markThreadRead: builder.mutation({
      query: (threadId) => ({
        url: `/chat/threads/${threadId}/read/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, threadId) => [
        { type: "Thread", id: threadId },
        { type: "Thread", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetThreadsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkThreadReadMutation,
} = chatApi;
