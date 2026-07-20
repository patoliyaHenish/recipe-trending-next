"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const CRON_LOG_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/cron-logs`;

export const cronLogApi = createApi({
    reducerPath: 'cronLogApi',
    tagTypes: ['Refetch_CronLogs'],
    baseQuery: fetchBaseQuery({
        baseUrl: CRON_LOG_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        getAllCronLogs: builder.query({
            query: ({ page = 1, limit = 50, job_name, status, created_at }) => ({
                url: `/logs`,
                method: 'GET',
                params: { page, limit, job_name, status, created_at },
            }),
            providesTags: ['Refetch_CronLogs'],
            keepUnusedDataFor: 0
        }),
        deleteCronLog: builder.mutation({
            query: ({ id }) => ({
                url: `/delete/${id}`,
                method: 'DELETE',
            }),
            async onQueryStarted({ id, page, limit }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    cronLogApi.util.updateQueryData('getAllCronLogs', { page, limit }, (draft) => {
                        const index = draft.data.findIndex((log) => log.id === id);
                        if (index !== -1) {
                            draft.data.splice(index, 1);
                            draft.pagination.total -= 1;
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
        getRecentCronLogsSummary: builder.query({
            query: () => ({
                url: `/recent-summary`,
                method: 'GET',
            }),
            providesTags: ['Refetch_CronLogs'],
            keepUnusedDataFor: 0
        }),
        markNotificationsAsRead: builder.mutation({
            query: () => ({
                url: `/mark-read`,
                method: 'PUT',
            }),
            invalidatesTags: ['Refetch_CronLogs']
        }),
    }),
});

export const {
    useGetAllCronLogsQuery,
    useDeleteCronLogMutation,
    useGetRecentCronLogsSummaryQuery,
    useMarkNotificationsAsReadMutation,
} = cronLogApi;


