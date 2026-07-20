"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const FOOTER_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-footer-items`

export const footerApi = createApi({
    reducerPath: 'footerApi',
    baseQuery: fetchBaseQuery({
        baseUrl: FOOTER_API_URL,
        credentials: "include",
    }),
    tagTypes: ['Footer'],
    endpoints: (builder) => ({
        getFooterItems: builder.query({
            query: () => '/get-all',
            providesTags: ['Footer'],
        }),
        getLiveFooterItems: builder.query({
            query: () => '/get-for-footer',
        }),
        createFooterItem: builder.mutation({
            query: (item) => ({
                url: '/create',
                method: 'POST',
                body: item,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;
                    if (result.success) {
                        dispatch(
                            footerApi.util.updateQueryData('getFooterItems', undefined, (draft) => {
                                if (draft.data) {
                                    draft.data.push(result.data);
                                    draft.data.sort((a, b) => a.order_index - b.order_index);
                                }
                            })
                        );
                    }
                } catch {
                }
            },
        }),
        updateFooterItem: builder.mutation({
            query: ({ id, ...item }) => ({
                url: `/update/${id}`,
                method: 'PUT',
                body: item,
            }),
            async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    footerApi.util.updateQueryData('getFooterItems', undefined, (draft) => {
                        const index = draft.data.findIndex((item) => item.id === id)
                        if (index !== -1) {
                            Object.assign(draft.data[index], patch)
                        }
                    })
                )
                try {
                    await queryFulfilled
                } catch {
                    patchResult.undo()
                }
            },
        }),
        deleteFooterItem: builder.mutation({
            query: (id) => ({
                url: `/delete/${id}`,
                method: 'DELETE',
            }),
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    footerApi.util.updateQueryData('getFooterItems', undefined, (draft) => {
                        if (draft.data) {
                            const deletedItem = draft.data.find(item => item.id === id);
                            if (deletedItem) {
                                const deletedOrder = deletedItem.order_index;
                                draft.data = draft.data.filter(item => item.id !== id);
                                draft.data.forEach(item => {
                                    if (item.order_index > deletedOrder) {
                                        item.order_index -= 1;
                                    }
                                });
                            }
                        }
                    })
                )
                try {
                    await queryFulfilled
                } catch {
                    patchResult.undo()
                }
            },
        }),
    }),
})

export const {
    useGetFooterItemsQuery,
    useGetLiveFooterItemsQuery,
    useCreateFooterItemMutation,
    useUpdateFooterItemMutation,
    useDeleteFooterItemMutation,
} = footerApi


