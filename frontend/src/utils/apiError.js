// frontend/src/utils/apiError.js

export function extractErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;

  const data = error.data;

  if (data?.error?.detail) {
    const detail = data.error.detail;
    if (typeof detail === "string") return detail;
    if (typeof detail === "object") {
      const firstField = Object.keys(detail)[0];
      const firstMessage = Array.isArray(detail[firstField])
        ? detail[firstField][0]
        : detail[firstField];
      return firstMessage || fallback;
    }
  }

  if (typeof data?.detail === "string") return data.detail;

  if (error.error) return error.error; // network-level FETCH_ERROR

  return fallback;
}

export function extractFieldErrors(error) {
  const detail = error?.data?.error?.detail;
  if (!detail || typeof detail !== "object") return {};

  return Object.fromEntries(
    Object.entries(detail).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : messages,
    ])
  );
}