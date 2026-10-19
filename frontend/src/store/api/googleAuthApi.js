// frontend/src/store/api/googleAuthApi.js
import { realApi } from "./realApi";

/*
  "Sign in with Google": POST /api/v1/auth/google/  { credential, remember_me }
  → { access, refresh, user, remember_me }   (same shape as the email login)

  Injected into the existing realApi slice so it shares the same base URL and
  store wiring — no changes to realApi.js are needed.
*/
export const googleAuthApi = realApi.injectEndpoints({
  endpoints: (builder) => ({
    googleLogin: builder.mutation({
      query: (body) => ({ url: "/auth/google/", method: "POST", body }),
      invalidatesTags: ["AdminUser", "AdminStats"],
    }),
  }),
});

export const { useGoogleLoginMutation } = googleAuthApi;