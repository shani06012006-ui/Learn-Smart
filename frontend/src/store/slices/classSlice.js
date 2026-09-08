// frontend/src/store/slices/classSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  classes: [],
  currentClass: null,
  isLoading: false,
  error: null,
};

const classSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    setClasses: (state, action) => {
      state.classes = action.payload;
    },
    setCurrentClass: (state, action) => {
      state.currentClass = action.payload;
    },
    addClass: (state, action) => {
      state.classes.unshift(action.payload);
    },
    updateClass: (state, action) => {
      const index = state.classes.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.classes[index] = action.payload;
      }
      if (state.currentClass?.id === action.payload.id) {
        state.currentClass = action.payload;
      }
    },
    removeClass: (state, action) => {
      state.classes = state.classes.filter(c => c.id !== action.payload);
      if (state.currentClass?.id === action.payload) {
        state.currentClass = null;
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setClasses,
  setCurrentClass,
  addClass,
  updateClass,
  removeClass,
  setLoading,
  setError,
  clearError,
} = classSlice.actions;

export default classSlice.reducer;