import { combineReducers } from "@reduxjs/toolkit";
import globalReducer from "../features/globalSlice";
import authReducer from "../features/authSlice"
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

const rootReducer = combineReducers({
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [subCategoryApi.reducerPath]: subCategoryApi.reducer,
    [recipeApi.reducerPath]: recipeApi.reducer,
    [ingredientApi.reducerPath]: ingredientApi.reducer,
    [ingredientUnitApi.reducerPath]: ingredientUnitApi.reducer,
    [bannerApi.reducerPath]: bannerApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [recipeDetailsApi.reducerPath]: recipeDetailsApi.reducer,
    [keywordApi.reducerPath]: keywordApi.reducer,
    [cronLogApi.reducerPath]: cronLogApi.reducer,
    [activityLogApi.reducerPath]: activityLogApi.reducer,
    [homeSectionApi.reducerPath]: homeSectionApi.reducer,
    [homeSectionItemApi.reducerPath]: homeSectionItemApi.reducer,
    [navItemApi.reducerPath]: navItemApi.reducer,
    [footerApi.reducerPath]: footerApi.reducer,
    [failedSearchApi.reducerPath]: failedSearchApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [failedLogApi.reducerPath]: failedLogApi.reducer,
    [rbacApi.reducerPath]: rbacApi.reducer,
    [adminViewLogsApi.reducerPath]: adminViewLogsApi.reducer,
    [recipeNoteApi.reducerPath]: recipeNoteApi.reducer,
    [paymentSlipApi.reducerPath]: paymentSlipApi.reducer,
    [assignedRecipeApi.reducerPath]: assignedRecipeApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    auth: authReducer,
    global: globalReducer,
})

export default rootReducer;