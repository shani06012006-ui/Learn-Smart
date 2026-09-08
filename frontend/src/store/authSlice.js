// frontend/src/store/authSlice.js



import { createSlice } from '@reduxjs/toolkit';

// Helper function to get stored token
const getStoredToken = () => {
  return localStorage.getItem('token') || null;
};

// Helper function to get stored user
const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Initial state - try to restore from localStorage
const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isLoading: false,
  error: null,
};

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set credentials (called after successful login/register)
    setCredentials: (state, action) => {
      const { user, access } = action.payload;
      state.user = user;
      state.token = access;
      state.error = null;
      state.isLoading = false;
      
      // Store in localStorage for persistence
      localStorage.setItem('token', access);
      localStorage.setItem('user', JSON.stringify(user));
    },
    
    // Clear credentials (called on logout)
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
      
      // Remove from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    // Set loading state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    // Set error
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const {
  setCredentials,
  clearCredentials,
  setLoading,
  setError,
  clearError,
} = authSlice.actions;

// Export selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectIsTeacher = (state) => state.auth.user?.role === 'teacher';
export const selectIsStudent = (state) => state.auth.user?.role === 'student';

// Export the reducer
export default authSlice.reducer;