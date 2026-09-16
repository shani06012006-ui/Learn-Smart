import { HttpResponse, delay as mswDelay } from "msw";

// Matches core.exceptions' custom DRF exception handler:
// { "error": { "detail": {...validation errors by field...}, "status_code": 400 } }
export function validationError(fieldErrors, status = 400) {
  return HttpResponse.json(
    { error: { detail: fieldErrors, status_code: status } },
    { status }
  );
}

// Matches plain DRF responses used for simple 4xx cases:
// { "detail": "human readable message" }
export function simpleError(message, status = 400) {
  return HttpResponse.json({ detail: message }, { status });
}

export function unauthorized(message = "Authentication credentials were not provided.") {
  return simpleError(message, 401);
}

// A couple of handlers use this to simulate real network latency so
// loading states are visible instead of resolving instantly.
export async function delay(ms = 400) {
  await mswDelay(ms);
}
