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
        getRecipeInstagramPosts: builder.query({
            query: (recipe_id) => `/posts/${recipe_id}`,
            providesTags: ["Instagram_Posts"],
        }),
        deleteInstagramPost: builder.mutation({
            query: (id) => ({
                url: `/posts/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Instagram_Posts"],
        }),
    }),
});

export const {
    useCreateInstagramPostMutation,
    useGetRecipeInstagramPostsQuery,
    useDeleteInstagramPostMutation,
} = instagramApi;
