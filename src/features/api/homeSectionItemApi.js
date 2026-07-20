"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const HOME_SECTION_ITEMS_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-home-section-items`;

export const homeSectionItemApi = createApi({
    reducerPath: "homeSectionItemApi",
    tagTypes: ["Refetch_HomeSectionItems"],
    baseQuery: fetchBaseQuery({
        baseUrl: HOME_SECTION_ITEMS_API_URL,
        credentials: "include",
    }),
    endpoints: (builder) => ({
        getHomeSectionItems: builder.query({
            query: (homeSectionId) => ({
                url: `/${homeSectionId}`,
                method: "GET",
            }),
            providesTags: ["Refetch_HomeSectionItems"],
        }),
        addHomeSectionItems: builder.mutation({
            query: (inputData) => ({
                url: `/add`,
                method: "POST",
                body: inputData,
            }),
            invalidatesTags: ["Refetch_HomeSectionItems"],
        }),
        removeHomeSectionItems: builder.mutation({
            query: (inputData) => ({
                url: `/remove`,
                method: "DELETE",
                body: inputData,
            }),
            invalidatesTags: ["Refetch_HomeSectionItems"],
            async onQueryStarted(inputData, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    homeSectionItemApi.util.updateQueryData('getHomeSectionItems', String(inputData.home_section_id), (draft) => {
                        if (draft.data && Array.isArray(draft.data)) {
                            draft.data = draft.data.filter(item => {
                                const itemId = String(item.recipe_id || item.category_id || item.sub_category_id || item.keyword_id || item.id);
                                return !inputData.item_ids.map(id => String(id)).includes(itemId);
                            });
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
});

export const {
    useGetHomeSectionItemsQuery,
    useAddHomeSectionItemsMutation,
    useRemoveHomeSectionItemsMutation,
} = homeSectionItemApi;


