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
            query: (params) => {
                const homeSectionId = typeof params === 'object' ? params.homeSectionId : params;
                const page = typeof params === 'object' ? (params.page || 1) : 1;
                const limit = typeof params === 'object' ? (params.limit || 10) : 10;
                const search = typeof params === 'object' ? (params.search || '') : '';
                return {
                    url: `/${homeSectionId}?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
                    method: "GET",
                };
            },
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
        }),
    }),
});

export const {
    useGetHomeSectionItemsQuery,
    useAddHomeSectionItemsMutation,
    useRemoveHomeSectionItemsMutation,
} = homeSectionItemApi;
