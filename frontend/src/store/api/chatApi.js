import { apiSlice } from "./apiSlice";

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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

    getMessages: builder.query({
      query: (threadId) => `/chat/threads/${threadId}/messages/`,
      providesTags: (result, error, threadId) => [
        { type: "Message", id: `LIST-${threadId}` },
      ],
    }),

    // GET /chat/threads/:id/members/ -- participant list for Group Info.
    // Never called for direct threads (they have only 2 participants).
    getThreadMembers: builder.query({
      query: (threadId) => `/chat/threads/${threadId}/members/`,
      providesTags: (result, error, threadId) => [
        { type: "ThreadMember", id: threadId },
      ],
    }),

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

    deleteMessage: builder.mutation({
      query: ({ messageId }) => ({
        url: `/chat/messages/${messageId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { messageId, threadId }) => [
        { type: "Message", id: `LIST-${threadId}` },
        { type: "Thread", id: threadId },
        { type: "Thread", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetThreadsQuery,
  useGetMessagesQuery,
  useGetThreadMembersQuery,
  useSendMessageMutation,
  useMarkThreadReadMutation,
  useDeleteMessageMutation,
} = chatApi;
