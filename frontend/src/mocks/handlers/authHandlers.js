import { http, HttpResponse } from "msw";

import {
  addUser,
  findUserByEmail,
  findUserById,
  serializeUser,
  updateUser,
} from "../data/users";
import {
  getBearerToken,
  issueTokenPair,
  revokeRefreshToken,
  rotateAccessToken,
  userIdForAccessToken,
} from "../data/session";
import { delay, simpleError, unauthorized, validationError } from "../utils";

const BASE = "/api/v1"; // same-origin path -- see apiSlice.js for why mock mode must stay same-origin

function requireAuth(request) {
  const token = getBearerToken(request);
  const userId = token ? userIdForAccessToken(token) : null;
  if (!userId) return null;
  return findUserById(userId);
}

export const authHandlers = [
  // POST /auth/register/ â€” teacher/admin self-registration only.
  // Student accounts are created only via classes/{id}/students/ (Module B).
  http.post(`${BASE}/auth/register/`, async ({ request }) => {
        const body = await request.json();
    const { email, first_name, last_name, role, password, password_confirm } = body;

    const errors = {};
    if (!email) errors.email = ["This field is required."];
    else if (findUserByEmail(email)) errors.email = ["user with this email already exists."];
    if (!first_name) errors.first_name = ["This field is required."];
    if (!last_name) errors.last_name = ["This field is required."];
    if (!password) errors.password = ["This field is required."];
    if (password && password.length < 8) {
      errors.password = ["This password is too short. It must contain at least 8 characters."];
    }
    if (password !== password_confirm) {
      errors.password_confirm = ["Passwords do not match."];
    }
    if (role && role !== "teacher" && role !== "admin") {
      errors.role = ["Self-registration is only available for teacher or admin accounts."];
    }
    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const user = addUser({
      id: `usr-${Math.random().toString(36).slice(2, 10)}`,
      email,
      password,
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`,
      role: role || "teacher",
      institution: null, // nullable until Module J â€” matches the real backend
      phone: "",
      avatar: null,
      is_blocked: false,
      is_online: false,
      date_joined: new Date().toISOString(),
    });

    return HttpResponse.json(serializeUser(user), { status: 201 });
  }),

  // POST /auth/login/
  http.post(`${BASE}/auth/login/`, async ({ request }) => {
        const { email, password } = await request.json();
    const user = email ? findUserByEmail(email) : null;

    if (!user || user.password !== password) {
      return unauthorized("No active account found with the given credentials.");
    }
    if (user.is_blocked) {
      return simpleError("This account has been blocked. Contact your institution admin.", 400);
    }

    const tokens = issueTokenPair(user.id);
    return HttpResponse.json({ ...tokens, user: serializeUser(user) }, { status: 200 });
  }),

  // POST /auth/token/refresh/
  http.post(`${BASE}/auth/token/refresh/`, async ({ request }) => {
        const { refresh } = await request.json();
    const rotated = refresh ? rotateAccessToken(refresh) : null;

    if (!rotated) {
      return simpleError("Token is invalid or expired", 401);
    }
    return HttpResponse.json(rotated, { status: 200 });
  }),

  // POST /auth/logout/ â€” blacklists the refresh token.
  http.post(`${BASE}/auth/logout/`, async ({ request }) => {
    const { refresh } = await request.json();
    if (refresh) revokeRefreshToken(refresh);
    return new HttpResponse(null, { status: 205 });
  }),

  // GET /auth/me/
  http.get(`${BASE}/auth/me/`, ({ request }) => {
    const user = requireAuth(request);
    if (!user) return unauthorized();
    return HttpResponse.json(serializeUser(user), { status: 200 });
  }),

  // PATCH /auth/me/ â€” role is intentionally read-only, same as the real API.
  http.patch(`${BASE}/auth/me/`, async ({ request }) => {
        const user = requireAuth(request);
    if (!user) return unauthorized();

    const body = await request.json();
    // eslint-disable-next-line no-unused-vars
    const { role, id, email, ...editable } = body; // strip read-only fields
    const updated = updateUser(user.id, editable);
    return HttpResponse.json(serializeUser(updated), { status: 200 });
  }),
];

