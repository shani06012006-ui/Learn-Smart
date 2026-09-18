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

    // GET /chat/threads/:id/members/ -- participant list (Group Info).
    getThreadMembers: builder.query({
      query: (threadId) => `/chat/threads/${threadId}/members/`,
      providesTags: (result, error, threadId) => [
        { type: "ThreadMember", id: `LIST-${threadId}` },
      ],
    }),

    // GET /chat/threads/:id/members/:userId/ -- single member profile.
    // Used by both group member click and 1:1 header click. Same access
    // rules: the viewer must be in the thread, and the target must be a
    // participant.
    getThreadMember: builder.query({
      query: ({ threadId, userId }) =>
        `/chat/threads/${threadId}/members/${userId}/`,
      providesTags: (result, error, { threadId, userId }) => [
        { type: "ThreadMember", id: `${threadId}:${userId}` },
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
  useGetThreadMemberQuery,
  useSendMessageMutation,
  useMarkThreadReadMutation,
  useDeleteMessageMutation,
} = chatApi;
