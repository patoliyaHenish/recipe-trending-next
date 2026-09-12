"use client";
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../../context/useUser';
import AccessDenied from '../../components/common/AccessDenied';

// Import Admin Components
import ActivityLogs from '../../pages_old/admin/ActivityLogs';
import CronLogs from '../../pages_old/admin/CronLogs';
import FailedLogs from '../../pages_old/admin/FailedLogs';
import FailedSearches from '../../pages_old/admin/FailedSearches';
import IngredientManagement from '../../pages_old/admin/IngredientManagement';
import IngredientUnitManagement from '../../pages_old/admin/IngredientUnitManagement';
import ManageConfig from '../../pages_old/admin/ManageConfig';
import ManageContacts from '../../pages_old/admin/ManageContacts';
import UserManagement from '../../pages_old/admin/UserManagement';

import BannerManagement from '../../pages_old/admin/banner management/BannerManagement';
import RecipeCategory from '../../pages_old/admin/category management/RecipeCategory';
import FooterManagement from '../../pages_old/admin/footer management/FooterManagement';
import HomeSectionManagement from '../../pages_old/admin/home management/HomeSectionManagement';
import HomeSectionItemsManagement from '../../pages_old/admin/home management/HomeSectionItemsManagement';
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
import Dashboard from '../../pages_old/admin/Dashboard';
import SearchResults from '../../pages_old/admin/SearchResults';
import WebAnalytics from '../../pages_old/admin/WebAnalytics';
import MyWork from '../../pages_old/admin/MyWork';

const checkPerm = (permission, userPermissions) => {
  if (!permission) return true;
  if (Array.isArray(permission)) return permission.some(p => userPermissions.includes(p));
  return userPermissions.includes(permission);
};

const ProtectedRoute = ({ permission, children }) => {
  const { user } = useUser();
  const userPermissions = user?.permissions || [];

  if (!checkPerm(permission, userPermissions)) {
    return <AccessDenied message="You don't have the required permissions to view or manage this section." />;
  }

  return children;
};

const routeConfig = [
  { path: '/', element: <Dashboard />, permission: 'dashboard.view' },
  { path: 'dashboard', element: <Dashboard />, permission: 'dashboard.view' },
  { path: 'my-work', element: <MyWork />, permission: 'my_work.view' },
  { path: 'manage-users', element: <UserManagement />, permission: ['user.list', 'user.update'] },
  { path: 'manage-ingredients', element: <IngredientManagement />, permission: 'ingredient.list' },
  { path: 'manage-ingredient-units', element: <IngredientUnitManagement />, permission: 'ingredient_unit.list' },
  { path: 'manage-recipe-category', element: <RecipeCategory />, permission: 'category.list' },
  { path: 'manage-recipe-subcategories', element: <RecipeSubCategory />, permission: 'subcategory.list' },
  { path: 'manage-recipes', element: <Recipe />, permission: ['recipe.list_all', 'recipe.list'] },
  { path: 'manage-recipes/add', element: <AddEditRecipePage />, permission: ['recipe.list_all', 'recipe.list'] },
  { path: 'manage-recipes/edit/:id', element: <AddEditRecipePage />, permission: ['recipe.list_all', 'recipe.list'] },
  { path: 'manage-assigned-recipes', element: <AssignedRecipes />, permission: ['assigned_recipe.list', 'assigned_recipe.list_all'] },
  { path: 'manage-recipe-notes', element: <RecipeNotes />, permission: ['recipe.note_list_all', 'recipe.note_list'] },
  { path: 'manage-roles', element: <RoleManagement />, permission: 'role.list' },
  { path: 'manage-roles/add', element: <AddEditRole />, permission: 'role.list' },
  { path: 'manage-roles/edit/:id', element: <AddEditRole />, permission: 'role.list' },
  { path: 'manage-permissions', element: <PermissionManagement />, permission: 'permission.list' },
  { path: 'manage-banners', element: <BannerManagement />, permission: 'banner.list' },
  { path: 'manage-footer', element: <FooterManagement />, permission: 'footer.list' },
  { path: 'manage-navbar', element: <NavbarManagement />, permission: 'nav.list' },
  { path: 'manage-home-section', element: <HomeSectionManagement />, permission: 'home_section.list' },
  { path: 'manage-home-section-items', element: <HomeSectionItemsManagement />, permission: 'home_section_items.list' },
  { path: 'manage-home-section-items/:id', element: <HomeSectionItemsManagement />, permission: 'home_section_items.list' },
  { path: 'manage-config', element: <ManageConfig />, permission: 'config.manage' },
  { path: 'manage-contacts', element: <ManageContacts />, permission: 'inquiry.list' },
  { path: 'manage-payment-slips', element: <PayrollManagement />, permission: 'payment_slip.list' },
  { path: 'activity-logs', element: <ActivityLogs />, permission: 'activity_logs.list' },
  { path: 'cron-logs', element: <CronLogs />, permission: 'cron_logs.list' },
  { path: 'failed-logs', element: <FailedLogs />, permission: 'failed_logs.list' },
  { path: 'failed-searches', element: <FailedSearches />, permission: 'search_failed.list' },
  { path: 'search-results', element: <SearchResults />, permission: 'search_console.view' },
  { path: 'web-analytics', element: <WebAnalytics />, permission: 'web_analytics.view' },
];

export default function AdminRouter() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        {routeConfig.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute permission={route.permission}>
                {route.element}
              </ProtectedRoute>
            }
          />
        ))}
        
        {/* Catch all to redirect to users or a 404 inside admin */}
        <Route path="*" element={<AccessDenied message="The page you are looking for does not exist or you don't have permission to access it." />} />
      </Routes>
    </BrowserRouter>
  );
}
