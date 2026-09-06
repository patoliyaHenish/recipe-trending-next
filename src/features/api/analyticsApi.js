"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const analyticsApi = createApi({
    reducerPath: 'analyticsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Analytics'],
    endpoints: (builder) => ({
        getSearchResults: builder.query({
            query: ({ period = '7d', dimension = 'query', startDate, endDate, queryFilter }) => ({
                url: '/analytics/search-results',
                method: 'GET',
                params: { period, dimension, startDate, endDate, queryFilter },
            }),
            providesTags: ['Analytics'],
        }),
        getGa4Data: builder.query({
            query: ({ period = '7d', startDate, endDate }) => ({
                url: '/analytics/ga4-data',
                method: 'GET',
                params: { period, startDate, endDate },
            }),
            providesTags: ['Analytics'],
        }),
        getGa4Trend: builder.query({
            query: ({ period = '7d', startDate, endDate }) => ({
                url: '/analytics/ga4-trend',
                method: 'GET',
                params: { period, startDate, endDate },
            }),
            providesTags: ['Analytics'],
        }),
        getGa4TopRecipes: builder.query({
            query: ({ period = '7d', startDate, endDate, category, subCategory, device }) => ({
                url: '/analytics/ga4-top-recipes',
                method: 'GET',
                params: { period, startDate, endDate, category, subCategory, device },
            }),
            providesTags: ['Analytics'],
        }),
        getGa4RealtimeData: builder.query({
            query: () => ({
                url: '/analytics/ga4-realtime-data',
                method: 'GET',
            }),
            providesTags: ['Analytics'],
        }),
        getGa4RealtimeTrend: builder.query({
            query: () => ({
                url: '/analytics/ga4-realtime-trend',
                method: 'GET',
            }),
            providesTags: ['Analytics'],
        }),
        getGa4RealtimeTopRecipes: builder.query({
            query: ({ device }) => ({
                url: '/analytics/ga4-realtime-top-recipes',
                method: 'GET',
                params: { device },
            }),
            providesTags: ['Analytics'],
        }),
    }),
});

export const { useGetSearchResultsQuery, useGetGa4DataQuery, useGetGa4TrendQuery, useGetGa4TopRecipesQuery, useGetGa4RealtimeDataQuery, useGetGa4RealtimeTrendQuery, useGetGa4RealtimeTopRecipesQuery } = analyticsApi;
