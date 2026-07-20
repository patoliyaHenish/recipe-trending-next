"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const SEARCH_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/search`;

export const searchApi = createApi({
    reducerPath: 'searchApi',
    baseQuery: fetchBaseQuery({
        baseUrl: SEARCH_API_URL,
        credentials: 'include',
    }),
    tagTypes: ['SearchResults', 'SearchSuggestions'],
    endpoints: (builder) => ({
        searchRecipes: builder.query({
            query: (params) => {
                const searchParams = new URLSearchParams();

                if (params.q) searchParams.append('q', params.q);
                if (params.categoryId) searchParams.append('categoryId', params.categoryId);
                if (params.subCategoryId) searchParams.append('subCategoryId', params.subCategoryId);
                if (params.recipeId) searchParams.append('recipeId', params.recipeId);
                if (params.ingredientId) searchParams.append('ingredientId', params.ingredientId);
                if (params.keywordId) searchParams.append('keywordId', params.keywordId);
                if (params.preference) searchParams.append('preference', params.preference);
                if (params.badge) searchParams.append('badge', params.badge);
                if (params.timeRange) searchParams.append('timeRange', params.timeRange);
                if (params.page) searchParams.append('page', params.page);
                if (params.limit) searchParams.append('limit', params.limit);
                if (params.sortBy) searchParams.append('sortBy', params.sortBy);
                if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

                return {
                    url: `/recipes?${searchParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: (result, error, params) => [
                { type: 'SearchResults', id: `${params.q || 'all'}-${params.page}` }
            ],
            transformResponse: (response) => {
                if (response.success) {
                    return response.data;
                }
                throw new Error(response.message || 'Search failed');
            },
        }),

        getSearchSuggestions: builder.query({
            query: (query) => ({
                url: `/suggestions?q=${encodeURIComponent(query)}`,
                method: 'GET',
            }),
            providesTags: (result, error, query) => [
                { type: 'SearchSuggestions', id: query }
            ],
            transformResponse: (response) => {
                if (response.success) {
                    return response.data;
                }
                throw new Error(response.message || 'Failed to get suggestions');
            },
        }),

        getCombinedSuggestions: builder.query({
            query: (query) => ({
                url: `/combined-suggestions?q=${encodeURIComponent(query)}`,
                method: 'GET',
            }),
            providesTags: (result, error, query) => [
                { type: 'SearchSuggestions', id: `combined-${query}` }
            ],
            transformResponse: (response) => {
                if (response.success) {
                    const combined = [];
                    const data = response.data;

                    if (data.recipes) combined.push(...data.recipes);
                    if (data.categories) combined.push(...data.categories);
                    if (data.subCategories) combined.push(...data.subCategories);
                    if (data.ingredients) combined.push(...data.ingredients);
                    if (data.keywords) combined.push(...data.keywords);

                    return combined;
                }
                throw new Error(response.message || 'Failed to get combined suggestions');
            },
        }),


    }),
});

export const {
    useSearchRecipesQuery,
    useGetSearchSuggestionsQuery,
    useGetCombinedSuggestionsQuery,
} = searchApi; 

