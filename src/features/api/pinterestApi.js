"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const PINTEREST_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/pinterest`;

export const pinterestApi = createApi({
    reducerPath: "pinterestApi",
    baseQuery: fetchBaseQuery({
        baseUrl: PINTEREST_API_URL,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        // Check if Pinterest access token is configured & valid
        getPinterestStatus: builder.query({
            query: () => ({
                url: "/status",
                method: "GET",
            }),
        }),

        // Fetch all Pinterest boards for the configured account
        getPinterestBoards: builder.query({
            query: () => ({
                url: "/boards",
                method: "GET",
            }),
            providesTags: ['PinterestBoards'],
        }),

        // Create a new Pinterest board
        createPinterestBoard: builder.mutation({
            query: ({ name, description, privacy }) => ({
                url: "/create-board",
                method: "POST",
                body: { name, description, privacy },
            }),
            invalidatesTags: ['PinterestBoards'],
        }),

        // Post a recipe as a Pinterest Pin
        postToPinterest: builder.mutation({
            query: ({ board_id, title, description, image_url, recipe_url, recipe_id, recipe_name }) => ({
                url: "/post-pin",
                method: "POST",
                body: { board_id, title, description, image_url, recipe_url, recipe_id, recipe_name },
            }),
        }),
    }),
});

export const {
    useGetPinterestStatusQuery,
    useGetPinterestBoardsQuery,
    useCreatePinterestBoardMutation,
    usePostToPinterestMutation,
} = pinterestApi;
