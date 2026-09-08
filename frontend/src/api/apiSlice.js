// frontend/src/api/apiSlice.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['Class', 'Enrollment', 'Exam', 'Material', 'Announcement', 'Student'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register/',
        method: 'POST',
        body: userData,
      }),
    }),
    getProfile: builder.query({
      query: () => '/auth/profile/',
    }),
    
    // Class endpoints
    getClasses: builder.query({
      query: () => '/classes/',
      providesTags: ['Class'],
    }),
    createClass: builder.mutation({
      query: (data) => ({
        url: '/classes/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),
    joinClass: builder.mutation({
      query: (joinCode) => ({
        url: '/classes/join/',
        method: 'POST',
        body: { join_code: joinCode },
      }),
      invalidatesTags: ['Class', 'Enrollment'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useGetClassesQuery,
  useCreateClassMutation,
  useJoinClassMutation,
} = apiSlice;