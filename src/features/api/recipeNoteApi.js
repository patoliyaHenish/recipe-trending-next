"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const RECIPE_NOTE_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/recipe-notes`;

export const recipeNoteApi = createApi({
    reducerPath: "recipeNoteApi",
    tagTypes: ["Refetch_Recipe_Notes"],
    baseQuery: fetchBaseQuery({
        baseUrl: RECIPE_NOTE_API_URL,
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
        getRecipeNotes: builder.query({
            query: (recipeId) => ({
                url: `/${recipeId}`,
                method: "GET",
            }),
            providesTags: (result, error, recipeId) => [{ type: "Refetch_Recipe_Notes", id: recipeId }],
        }),
        getAllRecipeNotes: builder.query({
            query: ({ search = '', page = 1, limit = 10, status = '', userId = '', category = '', subCategory = '', created = '' } = {}) => {
                const params = new URLSearchParams({
                    search: search,
                    page: page,
                    limit: limit,
                });
                if (status) params.append('status', status);
                if (userId) params.append('userId', userId);
                if (category) params.append('category', category);
                if (subCategory) params.append('subCategory', subCategory);
                if (created) params.append('created', created);

                return {
                    url: `/get-all-recipe-notes?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Refetch_Recipe_Notes'],
        }),
        getNoteCommenters: builder.query({
            query: () => ({
                url: '/commenters',
                method: 'GET',
            }),
            providesTags: ['Refetch_Recipe_Notes'],
        }),
        addRecipeNote: builder.mutation({
            query: ({ recipeId, message, status, commenterId }) => ({
                url: `/${recipeId}`,
                method: "POST",
                body: { message, status, commenter_id: commenterId },
            }),
            invalidatesTags: (result, error, { recipeId }) => [{ type: "Refetch_Recipe_Notes", id: recipeId }, "Refetch_Recipe_Notes"],
        }),
        updateRecipeNoteStatus: builder.mutation({
            query: ({ noteId, status }) => ({
                url: `/note/${noteId}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: ["Refetch_Recipe_Notes"],
        }),
        updateRecipeNote: builder.mutation({
            query: ({ noteId, message, status, commenterId }) => ({
                url: `/note/${noteId}`,
                method: "PUT",
                body: { message, status, commenterId },
            }),
            invalidatesTags: ["Refetch_Recipe_Notes"],
        }),
        deleteRecipeNote: builder.mutation({
            query: (noteId) => ({
                url: `/note/${noteId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Refetch_Recipe_Notes"],
        }),
    })
});

export const {
    useGetRecipeNotesQuery,
    useGetAllRecipeNotesQuery,
    useGetNoteCommentersQuery,
    useAddRecipeNoteMutation,
    useUpdateRecipeNoteStatusMutation,
    useUpdateRecipeNoteMutation,
    useDeleteRecipeNoteMutation,
} = recipeNoteApi;


