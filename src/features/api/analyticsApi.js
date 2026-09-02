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
    }),
});

export const { useGetSearchResultsQuery } = analyticsApi;
