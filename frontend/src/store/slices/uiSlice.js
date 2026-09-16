import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: false, // mobile sidebar drawer
    toasts: [], // { id, type: 'success'|'error'|'info', message }
  },
  reducers: {
    sidebarToggled: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    sidebarClosed: (state) => {
      state.sidebarOpen = false;
    },
    toastPushed: (state, action) => {
      state.toasts.push({ id: crypto.randomUUID(), ...action.payload });
    },
    toastDismissed: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { sidebarToggled, sidebarClosed, toastPushed, toastDismissed } = uiSlice.actions;
export default uiSlice.reducer;
