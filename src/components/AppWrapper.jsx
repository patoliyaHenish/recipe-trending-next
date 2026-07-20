"use client";
import React, { useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/useUser';
import { toast } from '../utils/toast';
import RouteTracker from '../routes/RouteTracker';

const AppWrapper = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const validRoutes = useMemo(() => [
    '/',
    '/auth',
    '/my-profile',
    '/my-cravings',
    '/result',
    '/recipe-spotlight',
    '/collection-spotlight/:collectionName',
    '/about-us',
    '/contact-us',
    '/privacy',
    '/category/:categorySlug',
    '/category/:categorySlug/:subCategorySlug',
    '/:recipeSlug',
    '/verify-email',
    '/sitemap.xml',
    '/ads.txt',
    '/admin/manage-recipe-category',
    '/admin/manage-recipe-subcategories',
    '/admin/manage-ingredients',
    '/admin/manage-recipes',
    '/admin/manage-banners',
    '/admin/manage-ingredient-units',
    '/admin/manage-keywords',
    '/admin/manage-users',
    '/admin/manage-recipe-notes',
    '/admin/cron-logs',
    '/admin/activity-logs',
    '/admin/manage-home-section',
    '/admin/manage-home-section-items',
    '/admin/manage-footer',
    '/admin/manage-navbar',
    '/admin/failed-searches',
    '/admin/manage-config',
    '/admin/manage-payment-slips',
    '/admin/recipe-performance',
    '/admin/engagement-dashboard',
    '/admin/manage-contacts',
    '/admin/failed-logs',
    '/admin/manage-permissions',
    '/admin/manage-roles',
    '/admin/manage-roles/create',
    '/admin/manage-roles/edit/:id',
    '/admin/manage-assigned-recipes',
    '/admin/manage-recipes/create',
    '/admin/manage-recipes/edit/:id',
    '/admin/notifications',
    '/not-authenticated',
    '/forgot-password'
  ], []);

  const isValidRoute = useCallback((path) => {
    if (validRoutes.includes(path)) {
      return true;
    }

    if (path.startsWith('/reset-password/')) {
      return true;
    }

    if (path.startsWith('/category/')) {
      return true;
    }

    if (path.startsWith('/collection-spotlight/')) {
      return true;
    }

    if (/^\/[a-z0-9-]+$/.test(path)) {
      return true;
    }

    if (path.startsWith('/admin/manage-roles/edit/')) {
      return true;
    }

    if (path.startsWith('/admin/manage-recipes/edit/')) {
      return true;
    }

    return false;
  }, [validRoutes]);

  useEffect(() => {
    if (!isValidRoute(pathname)) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, navigate, isValidRoute]);

  useEffect(() => {
    if (user && pathname === '/auth') {
      router.push('/');
    }
    
    if (user && location.search.includes('login=success')) {
      toast.success('Google login successful!');
      router.push('/', { replace: true });
    }

    if (location.search.includes('login=error')) {
      const params = new URLSearchParams(location.search);
      const message = params.get('message') || 'Google login failed';
      toast.error(message);
      router.push('/', { replace: true });
    }
  }, [user, pathname, location.search, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <>
      <RouteTracker />
      <Outlet />
    </>
  );
};

export default AppWrapper; 



