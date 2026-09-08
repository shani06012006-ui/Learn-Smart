// frontend/src/store/slices/examSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  exams: [],
  currentExam: null,
  questions: [],
  attempts: [],
  currentAttempt: null,
  isLoading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {
    setExams: (state, action) => {
      state.exams = action.payload;
    },
    setCurrentExam: (state, action) => {
      state.currentExam = action.payload;
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    addExam: (state, action) => {
      state.exams.unshift(action.payload);
    },
    updateExam: (state, action) => {
      const index = state.exams.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.exams[index] = action.payload;
      }
      if (state.currentExam?.id === action.payload.id) {
        state.currentExam = action.payload;
      }
    },
    removeExam: (state, action) => {
      state.exams = state.exams.filter(e => e.id !== action.payload);
      if (state.currentExam?.id === action.payload) {
        state.currentExam = null;
      }
    },
    setAttempts: (state, action) => {
      state.attempts = action.payload;
    },
    setCurrentAttempt: (state, action) => {
      state.currentAttempt = action.payload;
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
    resetExamState: (state) => {
      state.currentExam = null;
      state.questions = [];
      state.currentAttempt = null;
    },
  },
});

export const {
  setExams,
  setCurrentExam,
  setQuestions,
  addExam,
  updateExam,
  removeExam,
  setAttempts,
  setCurrentAttempt,
  setLoading,
  setError,
  clearError,
  resetExamState,
} = examSlice.actions;

export default examSlice.reducer;