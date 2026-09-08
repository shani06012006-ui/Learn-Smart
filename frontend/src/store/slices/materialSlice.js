// frontend/src/store/slices/materialSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  materials: [],
  currentMaterial: null,
  announcements: [],
  isLoading: false,
  error: null,
};

const materialSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    setMaterials: (state, action) => {
      state.materials = action.payload;
    },
    setCurrentMaterial: (state, action) => {
      state.currentMaterial = action.payload;
    },
    addMaterial: (state, action) => {
      state.materials.unshift(action.payload);
    },
    removeMaterial: (state, action) => {
      state.materials = state.materials.filter(m => m.id !== action.payload);
      if (state.currentMaterial?.id === action.payload) {
        state.currentMaterial = null;
      }
    },
    setAnnouncements: (state, action) => {
      state.announcements = action.payload;
    },
    addAnnouncement: (state, action) => {
      state.announcements.unshift(action.payload);
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
  setMaterials,
  setCurrentMaterial,
  addMaterial,
  removeMaterial,
  setAnnouncements,
  addAnnouncement,
  setLoading,
  setError,
  clearError,
} = materialSlice.actions;

export default materialSlice.reducer;