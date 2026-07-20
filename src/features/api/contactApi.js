"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const CONTACT_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/contact`;

export const contactApi = createApi({
    reducerPath: 'contactApi',
    baseQuery: fetchBaseQuery({
        baseUrl: CONTACT_API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Contact'],
    endpoints: (builder) => ({
        submitContact: builder.mutation({
            query: (inputData) => ({
                url: '/',
                method: 'POST',
                body: inputData,
            }),
            invalidatesTags: ['Contact'],
        }),
        getAllContacts: builder.query({
            query: ({ search = '', page = 1, limit = 10, status = '', subject = '' }) => ({
                url: '/',
                method: 'GET',
                params: { search, page, limit, status, subject }
            }),
            providesTags: ['Contact'],
        }),
        getContactById: builder.query({
            query: (id) => ({
                url: `/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Contact', id }],
        }),
        updateContactStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Contact', id }],
        }),
        replyToContact: builder.mutation({
            query: ({ id, admin_reply }) => ({
                url: `/${id}/reply`,
                method: 'POST',
                body: { admin_reply },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Contact', id }],
        }),
        deleteContact: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Contact'],
        }),
    }),
});

export const {
    useSubmitContactMutation,
    useGetAllContactsQuery,
    useGetContactByIdQuery,
    useUpdateContactStatusMutation,
    useReplyToContactMutation,
    useDeleteContactMutation,
} = contactApi;


