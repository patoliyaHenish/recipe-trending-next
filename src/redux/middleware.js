import { isRejectedWithValue } from '@reduxjs/toolkit';
import { setForbidden } from '../features/globalSlice';

/**
 * Middleware to intercept 403 Forbidden errors globally.
 * If an RTK Query mutation or query fails with 403 and the specific permission message,
 * it updates the global error state to display the AccessDenied component.
 */
export const rtkQueryErrorMiddleware = (api) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
        if (
            action.payload?.status === 403 && 
            action.payload?.data?.message === "Forbidden: You do not have permission to perform this action"
        ) {
            api.dispatch(setForbidden(action.payload.data.message));
        }
    }

    return next(action);
};
