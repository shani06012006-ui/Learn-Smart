import { configureStore } from "@reduxjs/toolkit";

import { apiSlice } from "../store/api/apiSlice";
import { realApi } from "../store/api/realApi";
import authReducer from "../store/slices/authSlice";
import adminAuthReducer from "../store/slices/adminAuthSlice";
import uiReducer from "../store/slices/uiSlice";

// Two RTK Query instances live side by side:
//   - `apiSlice`  — mock-backed. Teacher/student app uses this.
//   - `realApi`   — real Django backend. Only the admin app uses this.
// They have separate reducer paths, separate caches, and separate tag
// models. Nothing shared, nothing that can collide.

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
    ui: uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [realApi.reducerPath]: realApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(realApi.middleware),
});

if (import.meta.env.DEV) window.store = store;