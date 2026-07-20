"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const RECIPE_DETAILS_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/recipe`;

export const recipeDetailsApi = createApi({
    reducerPath: "recipeDetailsApi",
    tagTypes: ["RecipeDetails", "SavedRecipes"],
    baseQuery: fetchBaseQuery({
        baseUrl: RECIPE_DETAILS_API_URL,
        credentials: "include",
    }),
    endpoints: (builder) => ({
        saveRecipe: builder.mutation({
            query: (recipe_id) => ({
                url: "/save",
                method: "POST",
                body: { recipe_id },
            }),
            invalidatesTags: ["SavedRecipes"],
        }),
        unsaveRecipe: builder.mutation({
            query: (recipe_id) => ({
                url: "/unsave",
                method: "POST",
                body: { recipe_id },
            }),
            invalidatesTags: ["SavedRecipes"],
        }),
        getSavedRecipes: builder.query({
            query: ({ page = 1, limit = 20 } = {}) => ({
                url: `/saved?page=${page}&limit=${limit}`,
                method: "GET",
            }),
            providesTags: ["SavedRecipes"],
        }),
        getRecipeDetailsBySlug: builder.query({
            query: (slug) => ({
                url: `/slug/${slug}`,
                method: "GET",
            }),
            providesTags: ["RecipeDetails"],
        }),
        getRecipeNutritionBySlug: builder.query({
            query: (slug) => ({
                url: `/slug/${slug}/nutrition`,
                method: "GET",
            }),
        }),
        getCategoryPage: builder.query({
            query: ({ slug, page = 1, limit = 20, preference = '' }) => {
                const params = new URLSearchParams();
                if (page) params.append('page', page);
                if (limit) params.append('limit', limit);
                if (preference) params.append('preference', preference);
                return {
                    url: `/category/${slug}?${params.toString()}`,
                    method: 'GET',
                };
            },
        }),
        getSubCategoryPage: builder.query({
            query: ({ slug, page = 1, limit = 20, preference = '' }) => {
                const params = new URLSearchParams();
                if (page) params.append('page', page);
                if (limit) params.append('limit', limit);
                if (preference) params.append('preference', preference);
                return {
                    url: `/sub-category/${slug}?${params.toString()}`,
                    method: 'GET',
                };
            },
        }),
        getPublicRecipesByKeywords: builder.query({
            query: ({ keywords, page = 1, limit = 20, preference = '' }) => {
                let queryParam = keywords;
                if (Array.isArray(keywords)) {
                    queryParam = JSON.stringify(keywords);
                }
                const params = new URLSearchParams();
                params.append('keywords', queryParam);
                params.append('page', page);
                params.append('limit', limit);
                if (preference) params.append('preference', preference);

                return {
                    url: `/get-public-recipes-by-keywords?${params.toString()}`,
                    method: "GET",
                };
            },
        }),
        getRecipeSuggestions: builder.query({
            query: ({ recipeId, limit = 16 }) => ({
                url: `/get-recipe-suggestions?recipeId=${recipeId}&limit=${limit}`,
                method: "GET",
            }),
        }),
    })
});

export const {
    useGetRecipeDetailsBySlugQuery,
    useLazyGetRecipeNutritionBySlugQuery,
    useGetSavedRecipesQuery,
    useSaveRecipeMutation,
    useUnsaveRecipeMutation,
    useGetCategoryPageQuery,
    useGetSubCategoryPageQuery,
    useGetPublicRecipesByKeywordsQuery,
    useGetRecipeSuggestionsQuery,
} = recipeDetailsApi;


