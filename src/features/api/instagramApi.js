"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const INSTAGRAM_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/instagram`;

export const instagramApi = createApi({
    reducerPath: "instagramApi",
    tagTypes: ["Instagram_Posts"],
    baseQuery: fetchBaseQuery({
        baseUrl: INSTAGRAM_API_URL,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        createInstagramPost: builder.mutation({
            query: (data) => ({
                url: "/posts",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Instagram_Posts"],
        }),
        getAllInstagramPosts: builder.query({
            query: ({ search = '', recipe = '', page = 1, limit = 20 } = {}) => ({
                url: `/posts?search=${encodeURIComponent(search)}&recipe=${encodeURIComponent(recipe)}&page=${page}&limit=${limit}`,
            }),
            providesTags: ["Instagram_Posts"],
        }),
        getRecipeInstagramPosts: builder.query({
            query: (recipe_id) => `/posts/${recipe_id}`,
            providesTags: ["Instagram_Posts"],
        }),
        getScheduledPostsByRecipe: builder.query({
            query: (recipe_id) => `/schedule/posts/recipe/${recipe_id}`,
            providesTags: ["Scheduled_Posts"],
        }),
        deleteInstagramPost: builder.mutation({
            query: ({ id, permanent = false }) => ({
                url: `/posts/${id}?permanent=${permanent}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Instagram_Posts"],
        }),
        generateInstagramCaption: builder.mutation({
            query: (data) => ({
                url: "/generate-caption",
                method: "POST",
                body: data,
            }),
        }),
        scheduleInstagramPost: builder.mutation({
            query: (data) => ({
                url: "/schedule/posts",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Instagram_Posts", "Scheduled_Posts"],
        }),
        getAllScheduledPosts: builder.query({
            query: ({ status, page = 1, limit = 20 } = {}) => ({
                url: `/schedule/posts?status=${encodeURIComponent(status || '')}&page=${page}&limit=${limit}`,
            }),
            providesTags: ["Scheduled_Posts"],
        }),
        cancelScheduledPost: builder.mutation({
            query: (id) => ({
                url: `/schedule/posts/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Scheduled_Posts"],
        }),
    }),
});

export const {
    useCreateInstagramPostMutation,
    useGetAllInstagramPostsQuery,
    useGetRecipeInstagramPostsQuery,
    useDeleteInstagramPostMutation,
    useGenerateInstagramCaptionMutation,
    useScheduleInstagramPostMutation,
    useGetAllScheduledPostsQuery,
    useCancelScheduledPostMutation,
    useGetScheduledPostsByRecipeQuery,
} = instagramApi;
