import { configureStore } from "@reduxjs/toolkit";

import { apiSlice } from "../store/api/apiSlice";
import authReducer from "../store/slices/authSlice";
import uiReducer from "../store/slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});
