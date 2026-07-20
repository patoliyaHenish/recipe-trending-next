"use client";
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Admin Components
import ActivityLogs from '../../pages_old/admin/ActivityLogs';
import CronLogs from '../../pages_old/admin/CronLogs';
import FailedLogs from '../../pages_old/admin/FailedLogs';
import FailedSearches from '../../pages_old/admin/FailedSearches';
import IngredientManagement from '../../pages_old/admin/IngredientManagement';
import IngredientUnitManagement from '../../pages_old/admin/IngredientUnitManagement';
import ManageConfig from '../../pages_old/admin/ManageConfig';
import ManageContacts from '../../pages_old/admin/ManageContacts';
import Notifications from '../../pages_old/admin/Notifications';
import UserManagement from '../../pages_old/admin/UserManagement';

import BannerManagement from '../../pages_old/admin/banner management/BannerManagement';
import RecipeCategory from '../../pages_old/admin/category management/RecipeCategory';
import FooterManagement from '../../pages_old/admin/footer management/FooterManagement';
import HomeSectionManagement from '../../pages_old/admin/home management/HomeSectionManagement';
import HomeSectionItemsManagement from '../../pages_old/admin/home management/HomeSectionItemsManagement';
import Keywords from '../../pages_old/admin/keyword management/Keywords';
import NavbarManagement from '../../pages_old/admin/navbar management/NavbarManagement';
import PayrollManagement from '../../pages_old/admin/payroll management/PayrollManagement';

import PermissionManagement from '../../pages_old/admin/rbac management/PermissionManagement';
import RoleManagement from '../../pages_old/admin/rbac management/RoleManagement';
import AddEditRole from '../../pages_old/admin/rbac management/AddEditRole';

import Recipe from '../../pages_old/admin/recipe management/Recipe';
import AssignedRecipes from '../../pages_old/admin/recipe management/AssignedRecipes';
import RecipeNotes from '../../pages_old/admin/recipe management/RecipeNotes';
import AddEditRecipePage from '../../pages_old/admin/recipe management/AddEditRecipePage';

import RecipeSubCategory from '../../pages_old/admin/sub-category/RecipeSubCategory';

export default function AdminRouter() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/" element={<Navigate to="manage-users" replace />} />
        
        {/* Core Management */}
        <Route path="manage-users" element={<UserManagement />} />
        <Route path="manage-ingredients" element={<IngredientManagement />} />
        <Route path="manage-ingredient-units" element={<IngredientUnitManagement />} />
        <Route path="manage-keywords" element={<Keywords />} />
        
        {/* Categories */}
        <Route path="manage-recipe-category" element={<RecipeCategory />} />
        <Route path="manage-recipe-subcategories" element={<RecipeSubCategory />} />
        
        {/* Recipes */}
        <Route path="manage-recipes" element={<Recipe />} />
        <Route path="manage-recipes/add" element={<AddEditRecipePage />} />
        <Route path="manage-recipes/edit/:id" element={<AddEditRecipePage />} />
        <Route path="assigned-recipes" element={<AssignedRecipes />} />
        <Route path="recipe-notes" element={<RecipeNotes />} />
        
        {/* RBAC */}
        <Route path="manage-roles" element={<RoleManagement />} />
        <Route path="manage-roles/add" element={<AddEditRole />} />
        <Route path="manage-roles/edit/:id" element={<AddEditRole />} />
        <Route path="manage-permissions" element={<PermissionManagement />} />
        
        {/* Site Management */}
        <Route path="manage-banners" element={<BannerManagement />} />
        <Route path="manage-footer" element={<FooterManagement />} />
        <Route path="manage-navbar" element={<NavbarManagement />} />
        <Route path="manage-home-section" element={<HomeSectionManagement />} />
        <Route path="manage-home-sections" element={<HomeSectionManagement />} />
        <Route path="manage-home-section-items" element={<HomeSectionItemsManagement />} />
        <Route path="manage-home-section-items/:id" element={<HomeSectionItemsManagement />} />
        <Route path="manage-config" element={<ManageConfig />} />
        
        {/* System & Logs */}
        <Route path="manage-contacts" element={<ManageContacts />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="manage-payroll" element={<PayrollManagement />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="cron-logs" element={<CronLogs />} />
        <Route path="failed-logs" element={<FailedLogs />} />
        <Route path="failed-searches" element={<FailedSearches />} />
        
        {/* Catch all to redirect to users or a 404 inside admin */}
        <Route path="*" element={<div>Admin Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
