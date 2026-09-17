import { http, HttpResponse } from "msw";

import { buildRecommendations, dashboardAnalytics } from "../data/analytics";
import { findUserById } from "../data/users";
import { getBearerToken, userIdForAccessToken } from "../data/session";
import { delay, simpleError, unauthorized } from "../utils";

const BASE = "/api/v1";

function currentUser(request) {
  const token = getBearerToken(request);
  const userId = token ? userIdForAccessToken(token) : null;
  return userId ? findUserById(userId) : null;
}

export const analyticsHandlers = [
  // GET /teacher/dashboard/analytics/ -- teacher-only aggregated dashboard data
  http.get(`${BASE}/teacher/dashboard/analytics/`, async ({ request }) => {
    await delay(400); // simulate the analysis latency so loading states are visible
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can access the analytics dashboard.", 403);
    }

    const recommendations = buildRecommendations(dashboardAnalytics);

    return HttpResponse.json({
      ...dashboardAnalytics,
      recommendations,
    });
  }),
];
