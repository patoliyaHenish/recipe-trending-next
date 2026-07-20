"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const INGREDIENT_UNIT_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-ingredient-units`;

export const ingredientUnitApi = createApi({
  reducerPath: 'ingredientUnitApi',
  baseQuery: fetchBaseQuery({
    baseUrl: INGREDIENT_UNIT_API_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['IngredientUnit'],
  endpoints: (builder) => ({
    createIngredientUnit: builder.mutation({
      query: (unitData) => ({
        url: '/create',
        method: 'POST',
        body: unitData,
      }),
      invalidatesTags: ['IngredientUnit'],
    }),

    getAllIngredientUnits: builder.query({
      query: ({ page = 1, limit = 40 } = {}) => ({
        url: '/all',
        params: { page, limit },
      }),
      providesTags: ['IngredientUnit'],
    }),



    updateIngredientUnit: builder.mutation({
      query: ({ id, name }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: { name },
      }),
      invalidatesTags: [],
    }),

    deleteIngredientUnit: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [],
    }),

    searchIngredientUnits: builder.query({
      query: (search) => ({
        url: '/search/units',
        params: { search },
      }),
      providesTags: ['IngredientUnit'],
    }),

    getIngredientUnitById: builder.query({
      query: (id) => `/details/${id}`,
      providesTags: (result, error, id) => [{ type: 'IngredientUnit', id }],
    }),
  }),
});

export const {
  useCreateIngredientUnitMutation,
  useGetAllIngredientUnitsQuery,

  useUpdateIngredientUnitMutation,
  useDeleteIngredientUnitMutation,
  useSearchIngredientUnitsQuery,
  useLazyGetIngredientUnitByIdQuery,
} = ingredientUnitApi;


