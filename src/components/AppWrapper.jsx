"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '../context/useUser';
import { toast } from '../utils/toast';

const PUBLIC_ROUTES_THAT_SHOULD_REDIRECT = [
  '/',
  '/about-us',
  '/contact-us',
  '/terms',
  '/privacy',
  '/search-by-ingredient',
  '/result',
  '/recipe-spotlight',
];

const isPublicRouteThatShouldRedirect = (pathname) => {
  if (PUBLIC_ROUTES_THAT_SHOULD_REDIRECT.includes(pathname)) return true;
  if (pathname.startsWith('/category/')) return true;
  if (pathname.startsWith('/recipes/')) return true;
  if (pathname.startsWith('/collection-spotlight/')) return true;
  return false;
};

const AppWrapper = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const hasMyWorkPermission = Array.isArray(user?.permissions)
    ? user.permissions.includes('my_work.view')
    : false;

  useEffect(() => {
    if (user && pathname === '/auth') {
      router.push('/');
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (user && hasMyWorkPermission && isPublicRouteThatShouldRedirect(pathname)) {
      router.push('/admin/my-work');
    }
  }, [user, hasMyWorkPermission, pathname, router]);

  // 2. Handle Google OAuth redirect query params
  useEffect(() => {
    const loginStatus = searchParams.get('login');
    const message = searchParams.get('message');
    const cleanSearchParams = new URLSearchParams(searchParams.toString());
    cleanSearchParams.delete('login');
    cleanSearchParams.delete('message');
    const returnUrl = `${pathname}${cleanSearchParams.toString() ? `?${cleanSearchParams.toString()}` : ''}`;

    if (user && loginStatus === 'success') {
      toast.success('Google login successful!');
      router.replace(returnUrl);
    }

    if (loginStatus === 'error') {
      toast.error(message || 'Google login failed');
      router.replace(returnUrl);
    }
  }, [searchParams, user, pathname, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

export default AppWrapper;
