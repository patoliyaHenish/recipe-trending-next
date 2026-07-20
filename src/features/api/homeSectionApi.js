"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const HOME_SECTION_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-home-section`;

export const homeSectionApi = createApi({
    reducerPath: "homeSectionApi",
    tagTypes: ["Refetch_HomeSection"],
    baseQuery: fetchBaseQuery({
        baseUrl: HOME_SECTION_API_URL,
        credentials: "include",
    }),
    endpoints: (builder) => ({
        createHomeSection: builder.mutation({
            query: (inputData) => ({
                url: `/`,
                method: "POST",
                body: inputData,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;
                    if (result.success) {
                        dispatch(
                            homeSectionApi.util.updateQueryData('getHomeSections', undefined, (draft) => {
                                if (Array.isArray(draft)) {
                                    draft.push(result.data);
                                    draft.sort((a, b) => a.position - b.position);
                                } else if (draft.data && Array.isArray(draft.data)) {
                                    draft.data.push(result.data);
                                    draft.data.sort((a, b) => a.position - b.position);
                                }
                            })
                        );
                    }
                } catch {
                }
            },
        }),
        createHomeFeatureSection: builder.mutation({
            query: (inputData) => ({
                url: `/feature`,
                method: "POST",
                body: inputData,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;
                    if (result.success) {
                        dispatch(
                            homeSectionApi.util.updateQueryData('getHomeSections', undefined, (draft) => {
                                if (Array.isArray(draft)) {
                                    draft.push(result.data);
                                    draft.sort((a, b) => a.position - b.position);
                                } else if (draft.data && Array.isArray(draft.data)) {
                                    draft.data.push(result.data);
                                    draft.data.sort((a, b) => a.position - b.position);
                                }
                            })
                        );
                    }
                } catch {
                }
            },
        }),
        updateHomeFeatureSection: builder.mutation({
            query: ({ id, inputData }) => ({
                url: `/feature/${id}`,
                method: "PUT",
                body: inputData,
            }),
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                try {
                    const { data: updatedResponse } = await queryFulfilled;
                    const updatedItem = updatedResponse.data;

                    dispatch(
                        homeSectionApi.util.updateQueryData('getHomeSections', undefined, (draft) => {
                            const updateInArray = (arr) => {
                                const index = arr.findIndex((item) => item.home_section_id === Number(id));
                                if (index !== -1) {
                                    Object.assign(arr[index], updatedItem);
                                }
                            };

                            if (Array.isArray(draft)) updateInArray(draft);
                            if (draft.data && Array.isArray(draft.data)) updateInArray(draft.data);
                        })
                    );
                } catch {
                }
            },
        }),
        getHomeSections: builder.query({
            query: () => ({
                url: `/`,
                method: "GET",
            }),
            providesTags: ["Refetch_HomeSection"],
        }),
        getHomeSectionById: builder.query({
            query: (id) => ({
                url: `/${id}`,
                method: "GET",
            }),
            providesTags: ["Refetch_HomeSection"],
        }),
        getPublicHomeSections: builder.query({
            query: ({ preference = '', page = 1, limit = 2 } = {}) => ({
                url: `/public?${new URLSearchParams({
                    ...(preference ? { preference } : {}),
                    page: String(page),
                    limit: String(limit),
                }).toString()}`,
                method: "GET",
            }),
            providesTags: ["Refetch_HomeSection"],
        }),
        getPublicHomeSectionByName: builder.query({
            query: (name) => ({
                url: `/public/name/${name}`,
                method: "GET",
            }),
            providesTags: ["Refetch_HomeSection"],
        }),
        getPublicCollectionDetails: builder.query({
            query: (slug) => ({
                url: `/public/collection/${slug}`,
                method: "GET",
            }),
            providesTags: ["Refetch_HomeSection"],
        }),
        updateHomeSection: builder.mutation({
            query: ({ id, inputData }) => ({
                url: `/${id}`,
                method: "PUT",
                body: inputData,
            }),
            async onQueryStarted({ id, inputData }, { dispatch, queryFulfilled }) {
                try {
                    const { data: updatedResponse } = await queryFulfilled
                    const updatedItem = updatedResponse.data

                    dispatch(
                        homeSectionApi.util.updateQueryData('getHomeSections', undefined, (draft) => {
                            const updateInArray = (arr) => {
                                const index = arr.findIndex((item) => item.home_section_id === id)
                                if (index !== -1) {
                                    Object.assign(arr[index], updatedItem)
                                }
                            }

                            if (Array.isArray(draft)) {
                                updateInArray(draft)
                            }
                            if (draft.data && Array.isArray(draft.data)) {
                                updateInArray(draft.data)
                            }
                        })
                    )

                    dispatch(
                        homeSectionApi.util.updateQueryData('getHomeSectionById', id, (draft) => {
                            if (draft.data) {
                                Object.assign(draft.data, updatedItem)
                            } else {
                                Object.assign(draft, updatedItem)
                            }
                        })
                    )

                } catch { }
            },
        }),
        deleteHomeSection: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE",
            }),
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    homeSectionApi.util.updateQueryData('getHomeSections', undefined, (draft) => {
                        let deletedPosition = -1;
                        if (Array.isArray(draft)) {
                            const deletedItem = draft.find(item => item.home_section_id === id);
                            if (deletedItem) {
                                deletedPosition = deletedItem.position;
                                const filtered = draft.filter(item => item.home_section_id !== id);
                                filtered.forEach(item => {
                                    if (item.position > deletedPosition) {
                                        item.position -= 1;
                                    }
                                });
                                return filtered;
                            }
                        }
                        if (draft.data && Array.isArray(draft.data)) {
                            const deletedItem = draft.data.find(item => item.home_section_id === id);
                            if (deletedItem) {
                                deletedPosition = deletedItem.position;
                                draft.data = draft.data.filter(item => item.home_section_id !== id);
                                draft.data.forEach(item => {
                                    if (item.position > deletedPosition) {
                                        item.position -= 1;
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
    })
})

export const {
    useCreateHomeSectionMutation,
    useCreateHomeFeatureSectionMutation,
    useUpdateHomeFeatureSectionMutation,
    useGetHomeSectionsQuery,
    useGetHomeSectionByIdQuery,
    useGetPublicHomeSectionsQuery,
    useGetPublicHomeSectionByNameQuery,
    useGetPublicCollectionDetailsQuery,
    useUpdateHomeSectionMutation,
    useDeleteHomeSectionMutation,
} = homeSectionApi;


