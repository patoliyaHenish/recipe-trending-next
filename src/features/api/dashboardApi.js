"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['DashboardStats'],
    endpoints: (builder) => ({
        getDashboardStats: builder.query({
            query: () => ({
                url: '/dashboard/stats',
                method: 'GET',
            }),
            providesTags: ['DashboardStats'],
        }),
    }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
