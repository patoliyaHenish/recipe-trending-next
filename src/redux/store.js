import { configureStore } from "@reduxjs/toolkit";
import { persistStore } from "redux-persist";
import rootReducer from "./rootReducer";
import { authApi } from "../features/api/authApi";
import { categoryApi } from "../features/api/categoryApi";
import { subCategoryApi } from "../features/api/subCategoryApi";
import { recipeApi } from "../features/api/recipeApi";
import { ingredientApi } from "../features/api/ingredientApi";
import { bannerApi } from '../features/api/bannerApi';
import { searchApi } from '../features/api/searchApi';
import { recipeDetailsApi } from '../features/api/recipeDetailsApi';
import { keywordApi } from '../features/api/keywordApi';
import { cronLogApi } from '../features/api/cronLogApi';
import { activityLogApi } from '../features/api/activityLogApi';
import { homeSectionApi } from '../features/api/homeSectionApi';
import { homeSectionItemApi } from '../features/api/homeSectionItemApi';
import { navItemApi } from '../features/api/navItemApi';
import { footerApi } from '../features/api/footerApi';
import { ingredientUnitApi } from "../features/api/ingredientUnitApi";
import { failedSearchApi } from "../features/api/failedSearchApi";
import { settingsApi } from "../features/api/settingsApi";
import { contactApi } from "../features/api/contactApi";
import { failedLogApi } from "../features/api/failedLogApi";
import { rbacApi } from "../features/api/rbacApi";
import { adminViewLogsApi } from "../features/api/adminViewLogsApi";
import { recipeNoteApi } from "../features/api/recipeNoteApi";
import { paymentSlipApi } from "../features/api/paymentSlipApi";
import { assignedRecipeApi } from "../features/api/assignedRecipeApi";
import { notificationApi } from "../features/api/notificationApi";

import { rtkQueryErrorMiddleware } from "./middleware";

export const appStore = configureStore({
    reducer: rootReducer,
    middleware: (defaultMiddleware) =>
        defaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/PURGE', 'persist/FLUSH', 'persist/REGISTER'],
            },
        }).concat(
            rtkQueryErrorMiddleware,
            authApi.middleware,
            categoryApi.middleware,
            subCategoryApi.middleware,
            recipeApi.middleware,
            ingredientApi.middleware,
            ingredientUnitApi.middleware,
            bannerApi.middleware,
            searchApi.middleware,
            recipeDetailsApi.middleware,
            keywordApi.middleware,
            cronLogApi.middleware,
            activityLogApi.middleware,
            homeSectionApi.middleware,
            homeSectionItemApi.middleware,
            navItemApi.middleware,
            footerApi.middleware,
            failedSearchApi.middleware,
            settingsApi.middleware,
            contactApi.middleware,
            failedLogApi.middleware,
            rbacApi.middleware,
            adminViewLogsApi.middleware,
            recipeNoteApi.middleware,
            paymentSlipApi.middleware,
            assignedRecipeApi.middleware,
            notificationApi.middleware,
        )

});

export const persistor = persistStore(appStore);
