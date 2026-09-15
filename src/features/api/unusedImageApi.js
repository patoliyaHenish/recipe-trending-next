"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const UNUSED_IMAGE_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/unused-images`;

export const unusedImageApi = createApi({
    reducerPath: 'unusedImageApi',
    tagTypes: ['UnusedImages'],
    baseQuery: fetchBaseQuery({
        baseUrl: UNUSED_IMAGE_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        getUnusedImages: builder.query({
            query: ({ page = 1, limit = 10, search = '' }) => ({
                url: '/',
                method: 'GET',
                params: { page, limit, search },
            }),
            providesTags: ['UnusedImages'],
        }),
        deleteUnusedImages: builder.mutation({
            query: (fileNames) => ({
                url: '/',
                method: 'DELETE',
                body: { fileNames },
            }),
            invalidatesTags: ['UnusedImages'],
        }),
    }),
});

export const {
    useGetUnusedImagesQuery,
    useDeleteUnusedImagesMutation,
} = unusedImageApi;
