import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

// Handler paths are relative ("/api/v1/...") which MSW resolves against
// the PAGE's own origin -- this only works because apiSlice.js forces
// requests to stay same-origin while mocks are enabled. Flipping
// VITE_USE_MOCKS=false switches the base URL to the real backend's own
// origin instead, where CORS (not MSW) takes over.
export const worker = setupWorker(...handlers);
