"use client";
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isForbidden: false,
    forbiddenMessage: '',
};

const globalSlice = createSlice({
    name: 'global',
    initialState,
    reducers: {
        setForbidden: (state, action) => {
            state.isForbidden = true;
            state.forbiddenMessage = action.payload || "Forbidden: You do not have permission to perform this action";
        },
        clearForbidden: (state) => {
            state.isForbidden = false;
            state.forbiddenMessage = '';
        },
    },
});

export const { setForbidden, clearForbidden } = globalSlice.actions;
export default globalSlice.reducer;

