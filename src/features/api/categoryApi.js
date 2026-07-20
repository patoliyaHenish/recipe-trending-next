"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const CATEGORY_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-recipe-category`;

export const categoryApi = createApi({
    reducerPath: "categoryApi",
    tagTypes: ["Refetch_Category"],
    baseQuery: fetchBaseQuery({
        baseUrl: CATEGORY_API_URL,
        credentials: "include",
    }),
    endpoints: (builder) => ({
        getRecipeCategoryDropdown: builder.query({
            query: () => ({
                url: '/dropdown',
                method: 'GET',
            }),
        }),
        createRecipeCategory: builder.mutation({
            query: (inputData) => {
                const isFormData = inputData instanceof FormData;
                return {
                    url: "/create-recipe-category",
                    method: "POST",
                    body: inputData,
                    ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
                };
            },
            invalidatesTags: ["Refetch_Category"],
        }),
        getRecipeCategories: builder.query({
            query: ({ search = '', page = 1, limit = 10, status = '', sortBy = '' } = {}) => ({
                url: `/get-recipe-categories?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}${status ? `&status=${status}` : ''}${sortBy ? `&sortBy=${sortBy}` : ''}`,
                method: "GET",
            }),
            providesTags: ["Refetch_Category"],
        }),
        deleteRecipeCategoryById: builder.mutation({
            query: (id) => ({
                url: `/delete-recipe-category/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [],
        }),
        updateRecipeCategoryById: builder.mutation({
            query: ({ id, inputData }) => {
                const isFormData = inputData instanceof FormData;
                return {
                    url: `/update-recipe-category/${id}`,
                    method: "PUT",
                    body: inputData,
                    ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
                };
            },
            invalidatesTags: (result, error, { id }) => [
                "Refetch_Category",
                { type: "Refetch_Category", id }
            ],
        }),
        getAllActiveRecipeCategoriesSimple: builder.query({
            query: () => ({
                url: '/get-all-recipe-categories-simple',
                method: 'GET',
            }),
            providesTags: ["Refetch_Category"],
        }),
        getRecipeCategoryById: builder.query({
            query: (id) => ({
                url: `/get/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: "Refetch_Category", id }],
        }),
    })
})

export const {
    useCreateRecipeCategoryMutation,
    useGetRecipeCategoriesQuery,
    useDeleteRecipeCategoryByIdMutation,
    useUpdateRecipeCategoryByIdMutation,
    useGetRecipeCategoryDropdownQuery,
    useGetAllActiveRecipeCategoriesSimpleQuery,
    useGetRecipeCategoryByIdQuery,
    useLazyGetRecipeCategoryByIdQuery
} = categoryApi;


