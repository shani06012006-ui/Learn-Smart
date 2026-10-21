// frontend/src/store/api/registrationApi.js
import { realApi } from "./realApi";

/*
  Teacher sign-up with e-mail verification — talks to the REAL backend.

  (The old register hook in authApi.js is built on `apiSlice`, which only
  talks to the in-memory mock, so sign-up never reached Django.)

    POST /auth/register/          → 202 { email, registration_token, resend_after, ... }
    POST /auth/register/verify/   → 201 { access, refresh, user }   (account created + signed in)
    POST /auth/register/resend/   → 200 { resend_after, ... }
*/
export const registrationApi = realApi.injectEndpoints({
  endpoints: (builder) => ({
    registerTeacher: builder.mutation({
      // body: { first_name, last_name, email, role, password, password_confirm }
      query: (body) => ({ url: "/auth/register/", method: "POST", body }),
    }),
    verifyRegistration: builder.mutation({
      // body: { email, code, registration_token }
      query: (body) => ({ url: "/auth/register/verify/", method: "POST", body }),
      invalidatesTags: ["AdminUser", "AdminStats"],
    }),
    resendRegistrationCode: builder.mutation({
      // body: { email, registration_token }
      query: (body) => ({ url: "/auth/register/resend/", method: "POST", body }),
    }),
  }),
});

export const {
  useRegisterTeacherMutation,
  useVerifyRegistrationMutation,
  useResendRegistrationCodeMutation,
} = registrationApi;
