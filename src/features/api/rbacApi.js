"use client";

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const RBAC_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/rbac`;

export const rbacApi = createApi({
    reducerPath: 'rbacApi',
    baseQuery: fetchBaseQuery({
        baseUrl: RBAC_API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Roles', 'Permissions'],
    endpoints: (builder) => ({
        getAllRoles: builder.query({
            query: (params) => ({
                url: '/roles',
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 50,
                    search: params?.search || ''
                }
            }),
            providesTags: ['Roles'],
        }),
        getRoleById: builder.query({
            query: (id) => `/roles/${id}`,
            providesTags: (result, error, id) => [{ type: 'Roles', id }],
        }),
        createRole: builder.mutation({
            query: (role) => ({
                url: '/roles',
                method: 'POST',
                body: role,
            }),
            invalidatesTags: ['Roles'],
        }),
        updateRole: builder.mutation({
            query: ({ id, ...role }) => ({
                url: `/roles/${id}`,
                method: 'PUT',
                body: role,
            }),
            invalidatesTags: (result, error, { id }) => ['Roles', { type: 'Roles', id }],
        }),
        deleteRole: builder.mutation({
            query: (id) => ({
                url: `/roles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Roles'],
        }),

        // Permissions
        getAllPermissions: builder.query({
            query: (params) => ({
                url: '/permissions',
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 50,
                    search: params?.search || ''
                }
            }),
            providesTags: ['Permissions'],
        }),
    }),
});

export const {
    useGetAllRolesQuery,
    useGetRoleByIdQuery,
    useLazyGetRoleByIdQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useGetAllPermissionsQuery
} = rbacApi;


