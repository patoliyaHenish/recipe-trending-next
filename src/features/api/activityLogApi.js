"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const ACTIVITY_LOG_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/activity-logs`;

export const activityLogApi = createApi({
    reducerPath: 'activityLogApi',
    tagTypes: ['Refetch_ActivityLogs'],
    baseQuery: fetchBaseQuery({
        baseUrl: ACTIVITY_LOG_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        getAllActivityLogs: builder.query({
            query: ({ page = 1, limit = 50, action, entity_type, created_at }) => ({
                url: `/logs`,
                method: 'GET',
                params: { page, limit, action, entity_type, created_at },
            }),
            providesTags: ['Refetch_ActivityLogs'],
            keepUnusedDataFor: 0
        }),
        deleteActivityLog: builder.mutation({
            query: ({ id }) => ({
                url: `/delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Refetch_ActivityLogs'],
            async onQueryStarted({ id, page, limit }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    activityLogApi.util.updateQueryData('getAllActivityLogs', { page, limit }, (draft) => {
                        const index = draft.data.findIndex((log) => log.id === id);
                        if (index !== -1) {
                            draft.data.splice(index, 1);
                            if (draft.pagination) {
                                draft.pagination.total -= 1;
                            }
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        })
    }),
});

export const {
    useGetAllActivityLogsQuery,
    useDeleteActivityLogMutation,
} = activityLogApi;


