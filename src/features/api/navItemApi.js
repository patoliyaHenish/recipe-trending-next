"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const NAV_ITEM_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-nav-items`

export const navItemApi = createApi({
    reducerPath: 'navItemApi',
    baseQuery: fetchBaseQuery({
        baseUrl: NAV_ITEM_API_URL,
        credentials: "include",
    }),
    tagTypes: ['NavItem'],
    endpoints: (builder) => ({
        getNavItems: builder.query({
            query: () => '/get-all',
            providesTags: ['NavItem'],
        }),
        getNavItemsForNavbar: builder.query({
            query: () => '/get-for-navbar',
            providesTags: ['NavItem'],
        }),
        getNavItemById: builder.query({
            query: (id) => `/get-by-id/${id}`,
            providesTags: (result, error, id) => [{ type: 'NavItem', id }],
        }),
        createNavItem: builder.mutation({
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
                            navItemApi.util.updateQueryData('getNavItems', undefined, (draft) => {
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
        updateNavItem: builder.mutation({
            query: ({ id, ...item }) => ({
                url: `/update/${id}`,
                method: 'PUT',
                body: item,
            }),
            async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    navItemApi.util.updateQueryData('getNavItems', undefined, (draft) => {
                        if (!draft.data) return;

                        const index = draft.data.findIndex((item) => item.id === id);
                        if (index !== -1) {
                            Object.assign(draft.data[index], patch);


                            if (patch.is_active === false) {
                                const deactivateDescendants = (parentId) => {
                                    draft.data.forEach(item => {
                                        if (item.parent_id === parentId) {
                                            item.is_active = false;
                                            item.live_at = null;
                                            deactivateDescendants(item.id);
                                        }
                                    });
                                };
                                deactivateDescendants(id);
                            }

                            draft.data.sort((a, b) => a.order_index - b.order_index);
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
        deleteNavItem: builder.mutation({
            query: (id) => ({
                url: `/delete/${id}`,
                method: 'DELETE',
            }),
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    navItemApi.util.updateQueryData('getNavItems', undefined, (draft) => {
                        if (draft.data) {
                            const deletedItem = draft.data.find(item => item.id === id);
                            if (deletedItem) {
                                const deletedOrder = deletedItem.order_index;
                                draft.data = draft.data.filter(item => item.id !== id);
                                draft.data.forEach(item => {
                                    if (
                                        item.order_index > deletedOrder &&
                                        item.visibility === deletedItem.visibility &&
                                        item.parent_id === deletedItem.parent_id
                                    ) {
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
    useGetNavItemsQuery,
    useGetNavItemsForNavbarQuery,
    useCreateNavItemMutation,
    useUpdateNavItemMutation,
    useDeleteNavItemMutation,
    useLazyGetNavItemByIdQuery,
} = navItemApi


