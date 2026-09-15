"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const FACEBOOK_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/facebook`;

export const facebookApi = createApi({
    reducerPath: "facebookApi",
    tagTypes: ["Facebook_Posts"],
    baseQuery: fetchBaseQuery({
        baseUrl: FACEBOOK_API_URL,
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
        createFacebookPost: builder.mutation({
            query: (data) => ({
                url: "/posts",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Facebook_Posts"],
        }),
        getAllFacebookPosts: builder.query({
            query: ({ search = '', page = 1, limit = 20 } = {}) => ({
                url: `/posts?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
            }),
            providesTags: ["Facebook_Posts"],
        }),
        getRecipeFacebookPosts: builder.query({
            query: (recipe_id) => `/posts/${recipe_id}`,
            providesTags: ["Facebook_Posts"],
        }),
        deleteFacebookPost: builder.mutation({
            query: (id) => ({
                url: `/posts/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Facebook_Posts"],
        }),
        generateFacebookCaption: builder.mutation({
            query: (data) => ({
                url: "/generate-caption",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useCreateFacebookPostMutation,
    useGetAllFacebookPostsQuery,
    useGetRecipeFacebookPostsQuery,
    useDeleteFacebookPostMutation,
    useGenerateFacebookCaptionMutation,
} = facebookApi;
