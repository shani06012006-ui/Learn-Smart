// frontend/src/features/auth/authErrors.js
import { extractErrorMessage } from "../../utils/apiError";

/**
 * Turn an RTK Query error into a sentence a person can act on.
 * Unlike extractErrorMessage alone it never shows raw parser text when the
 * server sends back an HTML error page (Django's 500), and it words
 * "server unreachable" sensibly.
 */
export function friendlyAuthError(err, fallback = "Something went wrong. Please try again.") {
  const isNetwork =
    err?.status === "FETCH_ERROR" ||
    (typeof err?.error === "string" && err.error.includes("fetch"));
  if (isNetwork) return "Couldn't reach the server. Please try again.";

  // A Django 500 page is HTML, which RTK Query reports as PARSING_ERROR + originalStatus.
  const httpStatus = typeof err?.status === "number" ? err.status : err?.originalStatus;
  if (typeof httpStatus === "number" && httpStatus >= 500 && httpStatus !== 503) {
    return "Something went wrong on our side. Please try again in a moment.";
  }

  if (err?.status === "PARSING_ERROR") return fallback;
  return extractErrorMessage(err, fallback);
}
