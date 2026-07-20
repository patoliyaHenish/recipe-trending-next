"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const RECIPE_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-recipe-by-admin`;

export const recipeApi = createApi({
    reducerPath: "recipeApi",
    tagTypes: ["Refetch_Recipe"],
    baseQuery: fetchBaseQuery({
        baseUrl: RECIPE_API_URL,
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
        createRecipeByAdmin: builder.mutation({
            query: (inputData) => {
                if (inputData instanceof FormData) {
                    return {
                        url: "/create-recipe-by-admin",
                        method: "POST",
                        body: inputData,
                    };
                }
                const formData = new FormData();

                Object.keys(inputData).forEach(key => {
                    if (key === 'image' && inputData[key] instanceof File) {
                        formData.append('image', inputData[key]);
                    } else if (key === 'ingredients' && Array.isArray(inputData[key])) {
                        formData.append('ingredients', JSON.stringify(inputData[key]));
                    } else if (key === 'recipe_instructions' && Array.isArray(inputData[key])) {
                        formData.append('recipe_instructions', JSON.stringify(inputData[key]));
                    } else if (key === 'keywords' && Array.isArray(inputData[key])) {
                        formData.append('keywords', JSON.stringify(inputData[key]));
                    } else if (key !== 'image' && key !== 'imageData' && key !== 'keepExistingImage' && key !== 'imageRemoved') {
                        formData.append(key, inputData[key]);
                    }
                });

                return {
                    url: "/create-recipe-by-admin",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["Refetch_Recipe"],
        }),
        getAllRecipesForAdmin: builder.query({
            query: ({ search = '', page = 1, limit = 10, category_name = '', sub_category_name = '', public_approved = '', admin_approved = '', food_type = '', public_approved_from = '', public_approved_to = '', admin_approved_from = '', admin_approved_to = '', created_at_from = '', created_at_to = '', updated_at_from = '', updated_at_to = '', badge = '', created_by = '', pending_notes = '', has_updates = '', keyword = '', sort_by = 'created_at' }) => {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (page) params.append('page', page);
                if (limit) params.append('limit', limit);
                if (category_name) params.append('category_name', category_name);
                if (sub_category_name) params.append('sub_category_name', sub_category_name);
                if (public_approved !== '') params.append('public_approved', public_approved);
                if (admin_approved !== '') params.append('admin_approved', admin_approved);
                if (food_type) params.append('food_type', food_type);
                if (public_approved_from) params.append('public_approved_from', public_approved_from);
                if (public_approved_to) params.append('public_approved_to', public_approved_to);
                if (admin_approved_from) params.append('admin_approved_from', admin_approved_from);
                if (admin_approved_to) params.append('admin_approved_to', admin_approved_to);
                if (created_at_from) params.append('created_at_from', created_at_from);
                if (created_at_to) params.append('created_at_to', created_at_to);
                if (updated_at_from) params.append('updated_at_from', updated_at_from);
                if (updated_at_to) params.append('updated_at_to', updated_at_to);
                if (badge) params.append('badge', badge);
                if (created_by) params.append('created_by', created_by);
                if (pending_notes) params.append('pending_notes', pending_notes);
                if (has_updates) params.append('has_updates', has_updates);
                if (keyword) params.append('keyword', keyword);
                if (sort_by) params.append('sort_by', sort_by);
                return {
                    url: `/get-all-recipes-for-admin?${params.toString()}`,
                    method: "GET",
                };
            },
            providesTags: ["Refetch_Recipe"],
        }),
        getRecipeByIdForAdmin: builder.query({
            query: (id) => ({
                url: `/get-recipe-by-id/${id}`,
                method: "GET",
            }),
            providesTags: ["Refetch_Recipe"],
        }),
        deleteRecipeByAdmin: builder.mutation({
            query: (id) => ({
                url: `/delete-recipe-by-admin/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Refetch_Recipe"],
        }),
        updateRecipeByAdmin: builder.mutation({
            query: ({ id, inputData }) => {
                if (inputData instanceof FormData) {
                    return {
                        url: `/update-recipe-by-admin/${id}`,
                        method: "PUT",
                        body: inputData,
                    };
                }
                const formData = new FormData();

                Object.keys(inputData).forEach(key => {
                    if (key === 'image' && inputData[key] instanceof File) {
                        formData.append('image', inputData[key]);
                    } else if (key === 'ingredients' && Array.isArray(inputData[key])) {
                        formData.append('ingredients', JSON.stringify(inputData[key]));
                    } else if (key === 'recipe_instructions' && Array.isArray(inputData[key])) {
                        formData.append('recipe_instructions', JSON.stringify(inputData[key]));
                    } else if (key === 'keywords' && Array.isArray(inputData[key])) {
                        formData.append('keywords', JSON.stringify(inputData[key]));
                    } else if (key !== 'imageData') {
                        formData.append(key, inputData[key]);
                    }
                });

                return {
                    url: `/update-recipe-by-admin/${id}`,
                    method: "PUT",
                    body: formData,
                };
            },
            invalidatesTags: ["Refetch_Recipe"],
        }),
        updateRecipePublicApprovedStatus: builder.mutation({
            query: ({ id, public_approved }) => ({
                url: `/update-public-approved-status/${id}`,
                method: "PATCH",
                body: { public_approved },
            }),
            invalidatesTags: ["Refetch_Recipe"],
        }),
        updateRecipeAdminApprovedStatus: builder.mutation({
            query: ({ id, is_admin_approved }) => ({
                url: `/update-admin-approved-status/${id}`,
                method: "PATCH",
                body: { is_admin_approved },
            }),
            invalidatesTags: ["Refetch_Recipe"],
        }),
        updateRecipeBadge: builder.mutation({
            query: ({ id, badge }) => ({
                url: `/update-recipe-badge/${id}`,
                method: "PATCH",
                body: { badge },
            }),
            invalidatesTags: ["Refetch_Recipe"],
        }),
        getMostUsedKeywords: builder.query({
            query: () => ({
                url: "/get-most-used-keywords",
                method: "GET",
            }),
        }),
        getAllRecipesSimple: builder.query({
            query: () => ({
                url: "/get-all-recipes-simple",
                method: "GET",
            }),
            providesTags: ["Refetch_Recipe"],
        }),
        searchPublicApprovedRecipesSimple: builder.query({
            query: ({ search = '', page = 1, limit = 10 }) => ({
                url: `/search-public-approved-recipes-simple?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
                method: "GET",
            }),
            providesTags: ["Refetch_Recipe"],
        }),
        
        checkRecipeSlug: builder.query({
            query: ({ slug, exclude_id }) => ({
                url: `/check-slug?slug=${encodeURIComponent(slug)}&exclude_id=${exclude_id || 0}`,
                method: "GET",
            }),
        }),

        getRecipePerformanceStats: builder.query({
            query: ({ page = 1, limit = 20, search = '' }) => ({
                url: `/performance-stats?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                method: "GET",
            }),
            providesTags: ["Refetch_Recipe"],
        }),
        getRecipeDraft: builder.query({
            query: () => ({
                url: `/draft`,
                method: "GET",
            }),
        }),
        saveRecipeDraft: builder.mutation({
            query: (data) => ({
                url: `/draft`,
                method: "POST",
                body: { data },
            }),
        }),
        deleteRecipeDraft: builder.mutation({
            query: () => ({
                url: `/draft`,
                method: "DELETE",
            }),
        }),
    })
});

export const {
    useCreateRecipeByAdminMutation,
    useGetAllRecipesForAdminQuery,
    useGetRecipeByIdForAdminQuery,
    useDeleteRecipeByAdminMutation,
    useUpdateRecipeByAdminMutation,
    useUpdateRecipePublicApprovedStatusMutation,
    useUpdateRecipeAdminApprovedStatusMutation,
    useUpdateRecipeBadgeMutation,
    useGetMostUsedKeywordsQuery,
    useGetAllRecipesSimpleQuery,
    useSearchPublicApprovedRecipesSimpleQuery,
    useCheckRecipeSlugQuery,
    useLazyCheckRecipeSlugQuery,
    useGetRecipePerformanceStatsQuery,
    useGetRecipeDraftQuery,
    useSaveRecipeDraftMutation,
    useDeleteRecipeDraftMutation
} = recipeApi;

