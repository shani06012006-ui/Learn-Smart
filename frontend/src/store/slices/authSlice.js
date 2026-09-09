// frontend/src/store/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper functions for localStorage
const getStoredToken = () => {
  return localStorage.getItem('token') || null;
};

const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Initial state
const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isLoading: false,
  error: null,
  isAuthenticated: !!getStoredToken(),
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login/`, { 
        email, 
        password 
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.error || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/`, userData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.error || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(`${API_URL}/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return rejectWithValue('Session expired. Please login again.');
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to get profile');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');
      
      if (token) {
        await axios.post(`${API_URL}/auth/logout/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      return true;
    } catch (error) {
      return true;
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, access } = action.payload;
      state.user = user;
      state.token = access;
      state.isAuthenticated = true;
      state.error = null;
      state.isLoading = false;
      
      localStorage.setItem('token', access);
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.isAuthenticated = true;
        state.error = null;
        
        localStorage.setItem('token', action.payload.access);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        
        toast.success('Welcome back!');
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        toast.error(state.error);
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        toast.success('Account created successfully! Please login.');
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
        toast.error(state.error);
      })
      
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get profile';
        if (action.payload === 'Session expired. Please login again.' || 
            action.payload === 'No token found') {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast.success('Logged out successfully');
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
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
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsTeacher = (state) => state.auth.user?.user_type === 'teacher';
export const selectIsStudent = (state) => state.auth.user?.user_type === 'student';
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;