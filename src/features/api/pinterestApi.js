"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const PINTEREST_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/pinterest`;

export const pinterestApi = createApi({
    reducerPath: "pinterestApi",
    tagTypes: ["Pinterest_Posts"],
    baseQuery: fetchBaseQuery({
        baseUrl: PINTEREST_API_URL,
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
        getPinterestBoards: builder.query({
            query: () => "/boards",
        }),
        createPinterestPin: builder.mutation({
            query: (data) => ({
                url: "/pins",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Pinterest_Posts"],
        }),
        getRecipePinterestPosts: builder.query({
            query: (recipe_id) => `/posts/${recipe_id}`,
            providesTags: ["Pinterest_Posts"],
        }),
    }),
});

export const {
    useGetPinterestBoardsQuery,
    useCreatePinterestPinMutation,
    useGetRecipePinterestPostsQuery,
} = pinterestApi;
