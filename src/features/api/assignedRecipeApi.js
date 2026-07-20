"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const ASSIGNED_RECIPE_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-assigned-recipes`;

export const assignedRecipeApi = createApi({
    reducerPath: 'assignedRecipeApi',
    tagTypes: ['Refetch_AssignedRecipe'],
    baseQuery: fetchBaseQuery({
        baseUrl: ASSIGNED_RECIPE_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        createAssignedRecipe: builder.mutation({
            query: (inputData) => ({
                url: '/create-assigned-recipe',
                method: 'POST',
                body: inputData,
            }),
            invalidatesTags: ['Refetch_AssignedRecipe'],
        }),
        getAssignedRecipes: builder.query({
            query: ({ search = '', page = 1, limit = 10, status = '', assignedTo = '', category = '', subCategory = '', created = '' } = {}) => {
                const params = new URLSearchParams({
                    search: search,
                    page: page,
                    limit: limit,
                });
                if (status) params.append('status', status);
                if (assignedTo) params.append('assignedTo', assignedTo);
                if (category) params.append('category', category);
                if (subCategory) params.append('subCategory', subCategory);
                if (created) params.append('created', created);
                
                return {
                    url: `/get-assigned-recipes?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Refetch_AssignedRecipe'],
        }),
        getAssignedUsers: builder.query({
            query: () => ({
                url: '/assigned-users',
                method: 'GET',
            }),
            providesTags: ['Refetch_AssignedRecipe'],
        }),
        getAssignedRecipeById: builder.query({
            query: (id) => ({
                url: `/get/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Refetch_AssignedRecipe', id }],
        }),
        updateAssignedRecipeById: builder.mutation({
            query: ({ id, inputData }) => ({
                url: `/update-assigned-recipe/${id}`,
                method: 'PUT',
                body: inputData,
            }),
            invalidatesTags: ['Refetch_AssignedRecipe'],
        }),
        deleteAssignedRecipeById: builder.mutation({
            query: (id) => ({
                url: `/delete-assigned-recipe/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Refetch_AssignedRecipe'],
        }),
    }),
});

export const {
    useCreateAssignedRecipeMutation,
    useGetAssignedRecipesQuery,
    useGetAssignedUsersQuery,
    useGetAssignedRecipeByIdQuery,
    useLazyGetAssignedRecipeByIdQuery,
    useUpdateAssignedRecipeByIdMutation,
    useDeleteAssignedRecipeByIdMutation,
} = assignedRecipeApi;


