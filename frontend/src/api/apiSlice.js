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
  tagTypes: ['Class', 'Enrollment', 'Material', 'Announcement'],
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
    getClassDetail: builder.query({
      query: (id) => `/classes/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Class', id }],
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
    leaveClass: builder.mutation({
      query: (classId) => ({
        url: `/classes/${classId}/leave/`,
        method: 'POST',
      }),
      invalidatesTags: ['Class', 'Enrollment'],
    }),

    // Material endpoints
    getMaterials: builder.query({
      query: (classId) => `/classes/${classId}/materials/`,
      providesTags: ['Material'],
    }),
    getMaterialDetail: builder.query({
      query: (id) => `/materials/${id}/`,
    }),
    createMaterial: builder.mutation({
      query: ({ classId, ...data }) => {
        // If data is FormData, use it directly
        const body = data instanceof FormData ? data : data;
        return {
          url: `/classes/${classId}/materials/`,
          method: 'POST',
          body: body,
        };
      },
      invalidatesTags: ['Material'],
    }),
    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Material'],
    }),

    // Announcement endpoints
    getAnnouncements: builder.query({
      query: (classId) => `/classes/${classId}/announcements/`,
      providesTags: ['Announcement'],
    }),
    createAnnouncement: builder.mutation({
      query: ({ classId, ...data }) => ({
        url: `/classes/${classId}/announcements/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Announcement'],
    }),
    deleteAnnouncement: builder.mutation({
      query: (id) => ({
        url: `/announcements/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Announcement'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useGetClassesQuery,
  useGetClassDetailQuery,
  useCreateClassMutation,
  useJoinClassMutation,
  useLeaveClassMutation,
  useGetMaterialsQuery,
  useGetMaterialDetailQuery,
  useCreateMaterialMutation,
  useDeleteMaterialMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = apiSlice;