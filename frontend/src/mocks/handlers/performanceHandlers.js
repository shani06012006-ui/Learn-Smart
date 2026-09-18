import { http, HttpResponse } from "msw";

import { emptyPerformance, performanceForStudent } from "../data/performance";
import { findUserById } from "../data/users";
import { getBearerToken, userIdForAccessToken } from "../data/session";
import { delay, simpleError, unauthorized } from "../utils";

const BASE = "/api/v1";

function currentUser(request) {
  const token = getBearerToken(request);
  const userId = token ? userIdForAccessToken(token) : null;
  return userId ? findUserById(userId) : null;
}

export const performanceHandlers = [
  // GET /student/performance/ -- student-only, scoped to the caller.
  // Returns an empty envelope (not 404) when a student has no data yet.
  http.get(`${BASE}/student/performance/`, async ({ request }) => {
    await delay(400); // simulate the analysis latency so loading states are visible
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "student") {
      return simpleError("Only students can access their performance page.", 403);
    }

    const data = performanceForStudent(user.id) || emptyPerformance();
    return HttpResponse.json(data);
  }),
];

