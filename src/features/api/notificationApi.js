"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const NOTIFICATION_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`;

export const notificationApi = createApi({
    reducerPath: 'notificationApi',
    tagTypes: ['Notifications'],
    baseQuery: fetchBaseQuery({
        baseUrl: NOTIFICATION_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        getAllNotifications: builder.query({
            query: ({ type, page = 1, limit = 50, search = '' }) => ({
                url: `/`,
                method: 'GET',
                params: { type, page, limit, search },
            }),
            providesTags: ['Notifications'],
            keepUnusedDataFor: 0
        }),
        deleteNotification: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notifications']
        }),
        clearNotifications: builder.mutation({
            query: (type) => ({
                url: `/`,
                method: 'DELETE',
                params: { type },
            }),
            invalidatesTags: ['Notifications']
        }),
    }),
});

export const {
    useGetAllNotificationsQuery,
    useDeleteNotificationMutation,
    useClearNotificationsMutation
} = notificationApi;


