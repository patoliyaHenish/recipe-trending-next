"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const KEYWORD_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-keywords`;

export const keywordApi = createApi({
    reducerPath: "keywordApi",
    tagTypes: ["Keywords"],
    baseQuery: fetchBaseQuery({
        baseUrl: KEYWORD_API_URL,
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
        getAllKeywords: builder.query({
            query: ({ search = '', usage = 'all', page = 1, limit = 50 } = {}) => ({
                url: `/get-all-keywords`,
                params: { search, usage, page, limit }
            }),
            providesTags: ["Keywords"],
        }),
        createKeyword: builder.mutation({
            query: (data) => ({
                url: "/create-keyword",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Keywords"],
        }),
        updateKeyword: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/update-keyword/${id}`,
                method: "PUT",
                body: data,
            }),
        }),
        deleteKeyword: builder.mutation({
            query: (id) => ({
                url: `/delete-keyword/${id}`,
                method: "DELETE",
            }),
        }),
        getKeywordById: builder.query({
            query: (id) => ({
                url: `/get-keyword-by-id/${id}`
            }),
            providesTags: (result, error, id) => [{ type: "Keywords", id }],
        }),
    }),
});

export const {
    useGetAllKeywordsQuery,
    useCreateKeywordMutation,
    useUpdateKeywordMutation,
    useDeleteKeywordMutation,
    useLazyGetKeywordByIdQuery,
} = keywordApi;


