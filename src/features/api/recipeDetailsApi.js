"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const RECIPE_DETAILS_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/recipe`;

const normalizePreference = (preference) => {
    if (Array.isArray(preference)) {
        const filtered = preference
            .map(item => String(item).trim())
            .filter(item => item && item.toLowerCase() !== 'all');

        return filtered.join(',');
    }

    if (typeof preference === 'string') {
        const trimmed = preference.trim();
        return trimmed && trimmed.toLowerCase() !== 'all' ? trimmed : '';
    }

    return '';
};

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
        getSavedRecipeIds: builder.query({
            query: () => ({
                url: `/saved-ids`,
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
                const normalizedPreference = normalizePreference(preference);
                if (page) params.append('page', page);
                if (limit) params.append('limit', limit);
                if (normalizedPreference) params.append('preference', normalizedPreference);
                return {
                    url: `/category/${slug}?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['SavedRecipes'],
        }),
        getSubCategoryPage: builder.query({
            query: ({ slug, page = 1, limit = 20, preference = '' }) => {
                const params = new URLSearchParams();
                const normalizedPreference = normalizePreference(preference);
                if (page) params.append('page', page);
                if (limit) params.append('limit', limit);
                if (normalizedPreference) params.append('preference', normalizedPreference);
                return {
                    url: `/sub-category/${slug}?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['SavedRecipes'],
        }),
        getRecipeSuggestions: builder.query({
            query: ({ recipeId, limit = 16 }) => ({
                url: `/get-recipe-suggestions?recipeId=${recipeId}&limit=${limit}`,
                method: "GET",
            }),
            providesTags: ['SavedRecipes'],
        }),
    })
});

export const {
    useGetRecipeDetailsBySlugQuery,
    useLazyGetRecipeNutritionBySlugQuery,
    useGetSavedRecipesQuery,
    useGetSavedRecipeIdsQuery,
    useSaveRecipeMutation,
    useUnsaveRecipeMutation,
    useGetCategoryPageQuery,
    useGetSubCategoryPageQuery,
    useGetRecipeSuggestionsQuery,
} = recipeDetailsApi;
