"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const MY_WORK_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/my-work`;

export const myWorkApi = createApi({
  reducerPath: 'myWorkApi',
  tagTypes: ['Refetch_MyWork'],
  baseQuery: fetchBaseQuery({
    baseUrl: MY_WORK_API_URL,
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    getMyWork: builder.query({
      query: ({ assignedTo = '' } = {}) => {
        const params = new URLSearchParams();
        if (assignedTo) params.append('assignedTo', assignedTo);

        return {
          url: `/?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Refetch_MyWork'],
    }),
  }),
});

export const { useGetMyWorkQuery, useLazyGetMyWorkQuery } = myWorkApi;
