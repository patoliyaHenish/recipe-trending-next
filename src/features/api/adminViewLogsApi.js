"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/view-logs`;

export const adminViewLogsApi = createApi({
    reducerPath: 'adminViewLogsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['AdminViewLogs', 'AdminViewKPIs'],
    endpoints: (builder) => ({
        getViewLogs: builder.query({
            query: ({ page = 1, limit = 50, search = '' }) => ({
                url: '/get-view-logs',
                method: 'GET',
                params: { page, limit, search },
            }),
            providesTags: ['AdminViewLogs'],
        }),
        getCategoryViewLogs: builder.query({
            query: ({ page = 1, limit = 50, search = '' }) => ({
                url: '/get-category-view-logs',
                method: 'GET',
                params: { page, limit, search },
            }),
            providesTags: ['AdminViewLogs'],
        }),
        getSubCategoryViewLogs: builder.query({
            query: ({ page = 1, limit = 50, search = '' }) => ({
                url: '/get-sub-category-view-logs',
                method: 'GET',
                params: { page, limit, search },
            }),
            providesTags: ['AdminViewLogs'],
        }),
        getViewAnalyticsKPIs: builder.query({
            query: (type) => ({
                url: '/get-view-analytics-kpis',
                method: 'GET',
                params: { type },
            }),
            providesTags: ['AdminViewKPIs'],
        }),
        getViewAnalyticsTrend: builder.query({
            query: ({ type, range = '30d', startDate, endDate, granularity = 'daily' }) => ({
                url: '/get-view-analytics-trend',
                method: 'GET',
                params: { type, range, startDate, endDate, granularity },
            }),
            providesTags: ['AdminViewTrend'],
        }),
        getTopBottomViewed: builder.query({
            query: (type) => ({
                url: '/get-top-bottom-viewed',
                method: 'GET',
                params: { type },
            }),
            providesTags: ['AdminViewTopBottom'],
        }),
        getNewVsReturning: builder.query({
            query: ({ type, range = '30d', startDate, endDate }) => ({
                url: '/get-new-vs-returning',
                method: 'GET',
                params: { type, range, startDate, endDate },
            }),
            providesTags: ['AdminViewNewVsReturning'],
        }),
        getViewsByPreference: builder.query({
            query: ({ type, range = '30d', startDate, endDate }) => ({
                url: '/get-views-by-preference',
                method: 'GET',
                params: { type, range, startDate, endDate },
            }),
            providesTags: ['AdminViewPreference'],
        }),
    }),
});

export const {
    useGetViewLogsQuery,
    useGetCategoryViewLogsQuery,
    useGetSubCategoryViewLogsQuery,
    useGetViewAnalyticsKPIsQuery,
    useGetViewAnalyticsTrendQuery,
    useGetTopBottomViewedQuery,
    useGetNewVsReturningQuery,
    useGetViewsByPreferenceQuery
} = adminViewLogsApi;


