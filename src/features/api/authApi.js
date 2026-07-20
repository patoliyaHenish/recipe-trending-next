"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { userLoggedIn, userLoggedOut, setImpersonating } from '../authSlice';

const AUTH_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/auth`;

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: AUTH_API_URL,
        credentials: 'include',
    }),
    tagTypes: ['UserProfile'],
    endpoints: (builder) => ({
        registerUser: builder.mutation({
            query: (inputData) => ({
                url: '/register',
                method: 'POST',
                body: inputData,
            }),
            invalidatesTags: ['UserProfile'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(userLoggedIn(data));
                    dispatch(setImpersonating(false));
                } catch (error) {
                    console.error(error);
                    dispatch(userLoggedOut());
                }
            },
        }),
        loginUser: builder.mutation({
            query: (inputData) => ({
                url: '/login',
                method: 'POST',
                body: inputData,
            }),
            invalidatesTags: ['UserProfile'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(userLoggedIn(data));
                    dispatch(setImpersonating(false));
                } catch (error) {
                    console.error(error);
                }
            },
        }),
        loginAsUser: builder.mutation({
            query: (userId) => ({
                url: `/login-as-user/${userId}`,
                method: 'POST',
            }),
            invalidatesTags: ['UserProfile'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(userLoggedIn(data));
                    dispatch(setImpersonating(true));
                } catch (error) {
                    console.error(error);
                }
            },
        }),
        verifyEmail: builder.mutation({
            query: (inputData) => ({
                url: '/verify-email',
                method: 'POST',
                body: inputData,
            }),
            invalidatesTags: ['UserProfile'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(userLoggedIn(data));
                } catch (error) {
                    console.error(error);
                    dispatch(userLoggedOut());
                }
            },
        }),

        resendVerificationEmail: builder.mutation({
            query: (inputData) => ({
                url: '/resend-verification-email',
                method: 'PUT',
                body: inputData,
            }),
        }),
        forgetPassword: builder.mutation({
            query: (inputData) => ({
                url: '/forget-password',
                method: 'PUT',
                body: inputData,
            }),
        }),
        resetPassword: builder.mutation({
            query: ({ email, token, newPassword }) => ({
                url: `/reset-password/${email}/${token}`,
                method: 'PUT',
                body: { newPassword },
            }),
        }),
        logoutUser: builder.mutation({
            query: () => ({
                url: '/logout',
                method: 'PUT',
            }),
            invalidatesTags: ['UserProfile'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(userLoggedOut());
                    dispatch(setImpersonating(false));
                } catch (error) {
                    console.error(error);
                }
            },
        }),
        myProfile: builder.query({
            query: () => ({
                url: '/my-profile',
                method: 'GET',
            }),
            providesTags: ['UserProfile'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data?.user) {
                        dispatch(userLoggedIn({ user: data.user }));
                    }
                } catch (error) {
                    if (error?.error?.status !== 401 && error?.status !== 401) {
                        console.error(error);
                    }
                }
            },
        }),
        updateProfile: builder.mutation({
            query: (inputData) => {
                const isFormData = inputData instanceof FormData;
                return {
                    url: '/update-profile',
                    method: 'PUT',
                    body: inputData,
                    ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
                };
            },
            invalidatesTags: ['UserProfile'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data?.user) {
                        dispatch(userLoggedIn({ user: data.user }));
                    }
                } catch (error) {
                    console.error(error);
                }
            },
        }),
        changePassword: builder.mutation({
            query: (inputData) => ({
                url: '/change-password',
                method: 'PUT',
                body: inputData,
            }),
        }),
        getAllUsers: builder.query({
            query: ({ page = 1, limit = 40, search = '', name = '', email = '', verified = '', blocked = '', google = '', preference = '', role = '' }) => ({
                url: '/all-users',
                method: 'GET',
                params: { page, limit, search, name, email, verified, blocked, google, preference, role }
            }),
            providesTags: ['Users'],
        }),
        updatePreference: builder.mutation({
            query: (preference) => ({
                url: '/update-preference',
                method: 'PUT',
                body: { preference },
            }),
            invalidatesTags: ['UserProfile'],
        }),
        blockUser: builder.mutation({
            query: (userId) => ({
                url: `/users/${userId}/block`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Users'],
        }),
        unblockUser: builder.mutation({
            query: (userId) => ({
                url: `/users/${userId}/unblock`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Users'],
        }),
        updateUserRole: builder.mutation({
            query: ({ userId, roleId }) => ({
                url: '/users/update-role',
                method: 'PATCH',
                body: { userId, roleId },
            }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const {
    useRegisterUserMutation,
    useLoginUserMutation,
    useLoginAsUserMutation,
    useVerifyEmailMutation,
    useResendVerificationEmailMutation,
    useForgetPasswordMutation,
    useResetPasswordMutation,
    useLogoutUserMutation,
    useMyProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useGetAllUsersQuery,
    useUpdatePreferenceMutation,
    useBlockUserMutation,
    useUnblockUserMutation,
    useUpdateUserRoleMutation
} = authApi;

