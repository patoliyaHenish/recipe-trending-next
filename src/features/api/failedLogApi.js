"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const FAILED_LOG_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/failed-logs`;

export const failedLogApi = createApi({
    reducerPath: 'failedLogApi',
    tagTypes: ['FailedLogs'],
    baseQuery: fetchBaseQuery({
        baseUrl: FAILED_LOG_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        getAllFailedLogs: builder.query({
            query: ({ log_type, page = 1, limit = 50, search = '' }) => ({
                url: `/`,
                method: 'GET',
                params: { log_type, page, limit, search },
            }),
            providesTags: ['FailedLogs'],
            keepUnusedDataFor: 0
        }),
        getFailedLogById: builder.query({
            query: (id) => ({
                url: `/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'FailedLogs', id }],
        }),
        deleteFailedLog: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['FailedLogs']
        }),
        clearFailedLogs: builder.mutation({
            query: (log_type) => ({
                url: `/`,
                method: 'DELETE',
                params: { log_type },
            }),
            invalidatesTags: ['FailedLogs']
        }),
    }),
});

export const {
    useGetAllFailedLogsQuery,
    useGetFailedLogByIdQuery,
    useDeleteFailedLogMutation,
    useClearFailedLogsMutation
} = failedLogApi;


