"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const INGREDIENT_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-ingredients`;

export const ingredientApi = createApi({
  reducerPath: 'ingredientApi',
  baseQuery: fetchBaseQuery({
    baseUrl: INGREDIENT_API_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Ingredient', 'RecipeIngredient', 'IngredientUnit'],
  endpoints: (builder) => ({
    searchIngredients: builder.query({
      query: ({ query, exclude }) => ({
        url: '/search',
        params: { query, ...(exclude && { exclude }) },
      }),
      providesTags: ['Ingredient'],
    }),

    searchIngredientsSimple: builder.query({
      query: ({ query, exclude }) => ({
        url: '/search-simple',
        params: { query, ...(exclude && { exclude }) },
      }),
      providesTags: ['Ingredient'],
    }),

    getPopularIngredients: builder.query({
      query: () => ({
        url: '/popular',
      }),
      providesTags: ['Ingredient'],
    }),

    getAllIngredients: builder.query({
      query: (exclude) => ({
        url: '/all',
        params: { ...(exclude && { exclude }) },
      }),
      providesTags: ['Ingredient'],
    }),

    createIngredient: builder.mutation({
      query: (ingredient) => ({
        url: '/create',
        method: 'POST',
        body: ingredient,
      }),
      invalidatesTags: ['Ingredient'],
    }),

    updateIngredient: builder.mutation({
      query: ({ id, name }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: { name },
      }),
      invalidatesTags: [],
    }),

    deleteIngredient: builder.mutation({
      query: (ingredientId) => ({
        url: `/${ingredientId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(ingredientId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            ingredientApi.util.updateQueryData('getIngredientsPaginated', undefined, (draft) => {
            })
          );
        } catch { }
      },
    }),

    getRecipeIngredients: builder.query({
      query: (recipeId) => `/recipe/${recipeId}`,
      providesTags: ['RecipeIngredient'],
    }),

    addIngredientToRecipe: builder.mutation({
      query: ({ recipeId, ingredient }) => ({
        url: `/recipe/${recipeId}/add`,
        method: 'POST',
        body: ingredient,
      }),
      invalidatesTags: ['RecipeIngredient'],
    }),

    updateRecipeIngredient: builder.mutation({
      query: ({ recipeIngredientId, ingredient }) => ({
        url: `/recipe-ingredient/${recipeIngredientId}`,
        method: 'PUT',
        body: ingredient,
      }),
      invalidatesTags: ['RecipeIngredient'],
    }),

    removeIngredientFromRecipe: builder.mutation({
      query: (recipeIngredientId) => ({
        url: `/recipe-ingredient/${recipeIngredientId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RecipeIngredient'],
    }),

    getIngredientsPaginated: builder.query({
      query: ({ page = 1, limit = 20, search = '', usage = 'all' }) => ({
        url: '/paginated',
        params: { page, limit, search, usage },
      }),
      providesTags: ['Ingredient'],
    }),

    getIngredientById: builder.query({
      query: (id) => `/details/${id}`,
      providesTags: (result, error, id) => [{ type: 'Ingredient', id }],
    }),
  }),
});

export const {
  useSearchIngredientsQuery,
  useSearchIngredientsSimpleQuery,
  useGetPopularIngredientsQuery,
  useGetAllIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
  useGetRecipeIngredientsQuery,
  useAddIngredientToRecipeMutation,
  useUpdateRecipeIngredientMutation,
  useRemoveIngredientFromRecipeMutation,
  useGetIngredientsPaginatedQuery,
  useLazyGetIngredientByIdQuery,
} = ingredientApi;

