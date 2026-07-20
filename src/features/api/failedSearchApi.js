"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const FAILED_SEARCH_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/failed-searches`;

export const failedSearchApi = createApi({
    reducerPath: 'failedSearchApi',
    tagTypes: ['Refetch_FailedSearches'],
    baseQuery: fetchBaseQuery({
        baseUrl: FAILED_SEARCH_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        getAllFailedSearches: builder.query({
            query: ({ page = 1, limit = 50, search = '', user = '', createdAt = '' }) => ({
                url: `/searches`,
                method: 'GET',
                params: { page, limit, ...(search ? { search } : {}), ...(user ? { user } : {}), ...(createdAt ? { createdAt } : {}) },
            }),
            providesTags: ['Refetch_FailedSearches'],
            keepUnusedDataFor: 0
        }),
        deleteFailedSearch: builder.mutation({
            query: ({ id }) => ({
                url: `/delete/${id}`,
                method: 'DELETE',
            }),
            async onQueryStarted({ id, page, limit }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    failedSearchApi.util.updateQueryData('getAllFailedSearches', { page, limit }, (draft) => {
                        const index = draft.data.findIndex((search) => search.id === id);
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
    }),
});

export const {
    useGetAllFailedSearchesQuery,
    useDeleteFailedSearchMutation,
} = failedSearchApi;


