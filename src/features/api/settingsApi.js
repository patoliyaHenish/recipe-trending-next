"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const settingsApi = createApi({
    reducerPath: 'settingsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Settings'],
    endpoints: (builder) => ({
        getAllSettings: builder.query({
            query: () => ({
                url: '/settings',
                method: 'GET',
            }),
            providesTags: ['Settings'],
        }),
        getPublicSettings: builder.query({
            query: () => ({
                url: '/settings/public',
                method: 'GET',
            }),
            providesTags: ['Settings'],
        }),
        updateSetting: builder.mutation({
            query: ({ key, value }) => ({
                url: `/settings/${key}`,
                method: 'PUT',
                body: { value },
            }),
            invalidatesTags: ['Settings'],
        }),
    }),
});

export const { 
    useGetAllSettingsQuery, 
    useGetPublicSettingsQuery, 
    useUpdateSettingMutation 
} = settingsApi;


