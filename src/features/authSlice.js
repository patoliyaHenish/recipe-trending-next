"use client";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    isAuthenticated: false,
    isImpersonating: false,
};

const authSlice = createSlice({
    name: "authSlice",
    initialState,
    reducers: {
        userLoggedIn: (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            // isImpersonating is only set via setImpersonating, not here
        },
        userLoggedOut: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isImpersonating = false;
        },
        setImpersonating: (state, action) => {
            state.isImpersonating = action.payload;
        },
    }
})

export const { userLoggedIn, userLoggedOut, setImpersonating } = authSlice.actions;
export default authSlice.reducer;
