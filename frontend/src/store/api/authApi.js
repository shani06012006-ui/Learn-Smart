import { apiSlice } from "./apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      // body: { email, first_name, last_name, role, password, password_confirm }
      query: (body) => ({ url: "/auth/register/", method: "POST", body }),
    }),

    login: builder.mutation({
      // body: { email, password }
      // response: { access, refresh, user }
      query: (body) => ({ url: "/auth/login/", method: "POST", body }),
    }),

    logout: builder.mutation({
      query: (refresh) => ({ url: "/auth/logout/", method: "POST", body: { refresh } }),
    }),

    getMe: builder.query({
      query: () => "/auth/me/",
      providesTags: ["Me"],
    }),

    updateMe: builder.mutation({
      query: (patch) => ({ url: "/auth/me/", method: "PATCH", body: patch }),
      invalidatesTags: ["Me"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateMeMutation,
} = authApi;
