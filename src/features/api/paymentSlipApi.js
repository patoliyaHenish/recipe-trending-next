"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const PAYMENT_SLIP_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/manage-payment-slips`;

export const paymentSlipApi = createApi({
    reducerPath: 'paymentSlipApi',
    tagTypes: ['Refetch_PaymentSlip'],
    baseQuery: fetchBaseQuery({
        baseUrl: PAYMENT_SLIP_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        createPaymentSlip: builder.mutation({
            query: (inputData) => ({
                url: '/create-payment-slip',
                method: 'POST',
                body: inputData,
            }),
            invalidatesTags: ['Refetch_PaymentSlip'],
        }),
        getPaymentSlips: builder.query({
            query: ({ search = '', page = 1, limit = 10, status = '' } = {}) => ({
                url: `/get-payment-slips?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
                method: 'GET',
            }),
            providesTags: ['Refetch_PaymentSlip'],
        }),
        getPaymentSlipById: builder.query({
            query: (id) => ({
                url: `/get/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Refetch_PaymentSlip', id }],
        }),
        updatePaymentSlipById: builder.mutation({
            query: ({ id, inputData }) => ({
                url: `/update-payment-slip/${id}`,
                method: 'PUT',
                body: inputData,
            }),
            invalidatesTags: ['Refetch_PaymentSlip'],
        }),
        deletePaymentSlipById: builder.mutation({
            query: (id) => ({
                url: `/delete-payment-slip/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Refetch_PaymentSlip'],
        }),
    }),
});

export const {
    useCreatePaymentSlipMutation,
    useGetPaymentSlipsQuery,
    useLazyGetPaymentSlipByIdQuery,
    useUpdatePaymentSlipByIdMutation,
    useDeletePaymentSlipByIdMutation,
} = paymentSlipApi;


