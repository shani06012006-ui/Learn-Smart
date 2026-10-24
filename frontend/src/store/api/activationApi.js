// frontend/src/store/api/activationApi.js
import { realApi } from "./realApi";

/*
  Student account activation — talks to the REAL backend.
  (Same pattern as registrationApi.js: injected into the existing realApi slice,
  so nothing in realApi.js has to change.)

  Public (the student has no password yet, so no login is needed):
    POST /auth/activation/validate/   { token }                                 → { valid, first_name, email_hint, expires_at }
    POST /auth/activation/complete/   { token, new_password, confirm_password } → { access, refresh, user }
    POST /auth/activation/request/    { email }                                 → { detail }   (always 200)

  Admin:
    POST /admin/users/:id/resend-invite/  { send_via?, phone? }                 → { invitation }
*/
export const activationApi = realApi.injectEndpoints({
  endpoints: (builder) => ({
    validateActivation: builder.mutation({
      query: (token) => ({
        url: "/auth/activation/validate/",
        method: "POST",
        body: { token },
      }),
    }),

    completeActivation: builder.mutation({
      // body: { token, new_password, confirm_password }
      query: (body) => ({
        url: "/auth/activation/complete/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUser", "AdminStats"],
    }),

    requestActivationLink: builder.mutation({
      query: (email) => ({
        url: "/auth/activation/request/",
        method: "POST",
        body: { email },
      }),
    }),

    resendStudentInvite: builder.mutation({
      // arg: { id, send_via?, phone? }
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}/resend-invite/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "AdminUser", id }],
    }),
  }),
});

export const {
  useValidateActivationMutation,
  useCompleteActivationMutation,
  useRequestActivationLinkMutation,
  useResendStudentInviteMutation,
} = activationApi;
