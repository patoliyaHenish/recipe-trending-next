"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const SUB_CATEGORY_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-recipe-sub-category`;

export const subCategoryApi = createApi({
    reducerPath: "subCategoryApi",
    tagTypes: ["Refetch_SubCategory"],
    baseQuery: fetchBaseQuery({
        baseUrl: SUB_CATEGORY_API_URL,
        credentials: "include",
    }),
    endpoints: (builder) => ({
        createRecipeSubCategory: builder.mutation({
            query: (inputData) => {
                const isFormData = inputData instanceof FormData;
                return {
                    url: "create-recipe-sub-category",
                    method: "POST",
                    body: inputData,
                    ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
                };
            },
            invalidatesTags: ["Refetch_SubCategory"],
        }),
        updateRecipeSubCategory: builder.mutation({
            query: (inputData) => {
                const isFormData = inputData instanceof FormData;
                return {
                    url: "/update-recipe-sub-category",
                    method: "PUT",
                    body: inputData,
                    ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
                };
            },
            invalidatesTags: ["Refetch_SubCategory"],
        }),
        deleteRecipeSubCategory: builder.mutation({
            query: (data) => ({
                url: "/delete-recipe-sub-category",
                method: "DELETE",
                body: data,
            }),
        }),
        getAllRecipeSubCategorieDetails: builder.query({
            query: (params) => ({
                url: "/get-all-recipe-sub-category-details",
                method: "GET",
                params,
            }),
            providesTags: ["Refetch_SubCategory"],
        }),
        getRecipeSubCategoryById: builder.query({
            query: (id) => ({
                url: `/get/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: "Refetch_SubCategory", id }],
        }),
    }),
});

export const {
    useCreateRecipeSubCategoryMutation,
    useUpdateRecipeSubCategoryMutation,
    useDeleteRecipeSubCategoryMutation,
    useGetAllRecipeSubCategorieDetailsQuery,
    useGetRecipeSubCategoryByIdQuery,
    useLazyGetRecipeSubCategoryByIdQuery
} = subCategoryApi;

