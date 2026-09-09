"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BANNER_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-banner`;
const PUBLIC_BANNER_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/banner`;

export const bannerApi = createApi({
    reducerPath: "bannerApi",
    tagTypes: ["Refetch_Banner"],
    baseQuery: fetchBaseQuery({
        baseUrl: BANNER_API_URL,
        credentials: "include",
    }),
    endpoints: (builder) => ({
        createBanner: builder.mutation({
            query: (inputData) => ({
                url: `/`,
                method: "POST",
                body: inputData,
            }),
            invalidatesTags: ["Refetch_Banner"],
        }),
        getBanners: builder.query({
            query: () => ({
                url: `/`,
                method: "GET",
            }),
            providesTags: ["Refetch_Banner"],
        }),
        getBannerById: builder.query({
            query: (id) => ({
                url: `/${id}`,
                method: "GET",
            }),
            providesTags: ["Refetch_Banner"],
        }),
        updateBanner: builder.mutation({
            query: ({ id, inputData }) => ({
                url: `/${id}`,
                method: "PUT",
                body: inputData,
            }),
            invalidatesTags: ["Refetch_Banner"],
        }),
        deleteBanner: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Refetch_Banner"],
        }),
        getHeroBanner: builder.query({
            query: () => ({
                url: `/hero`,
                baseUrl: PUBLIC_BANNER_API_URL,
                method: "GET",
            }),
            providesTags: ["Refetch_Banner"],
        }),
        getPublicBannerRecipes: builder.query({
            query: (params) => {
                let title = '';
                let preference = '';
                let page = 1;
                let limit = 20;
                if (typeof params === 'object' && params !== null) {
                    title = params.title || '';
                    preference = params.preference || '';
                    page = params.page || 1;
                    limit = params.limit || 20;
                } else {
                    title = params || '';
                }
                const searchParams = new URLSearchParams();
                if (title) searchParams.append('title', title);
                if (preference) searchParams.append('preference', preference);
                if (page) searchParams.append('page', String(page));
                if (limit) searchParams.append('limit', String(limit));
                return {
                    url: `${PUBLIC_BANNER_API_URL}/recipes?${searchParams.toString()}`,
                    method: "GET",
                };
            },
            providesTags: ["Refetch_Banner"],
        }),
        getBannerRecipesById: builder.query({
            query: (params) => {
                let id = '';
                let search = '';
                let food_type = '';
                let page = 1;
                let limit = 20;

                if (typeof params === 'object' && params !== null) {
                    id = params.id || '';
                    search = params.search || '';
                    food_type = params.food_type || '';
                    page = params.page || 1;
                    limit = params.limit || 20;
                } else {
                    id = params || '';
                }

                const searchParams = new URLSearchParams();
                if (search) searchParams.append('search', search);
                if (food_type) searchParams.append('food_type', food_type);
                if (page) searchParams.append('page', page);
                if (limit) searchParams.append('limit', limit);

                return {
                    url: `/${id}/recipes?${searchParams.toString()}`,
                    method: "GET",
                };
            },
            providesTags: ["Refetch_Banner"],
        }),
    })
})

export const {
    useCreateBannerMutation,
    useGetBannersQuery,
    useGetBannerByIdQuery,
    useUpdateBannerMutation,
    useDeleteBannerMutation,
    useGetHeroBannerQuery,
    useGetPublicBannerRecipesQuery,
    useGetBannerRecipesByIdQuery
} = bannerApi;
