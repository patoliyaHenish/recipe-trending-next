"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '../context/useUser';
import { toast } from '../utils/toast';

/**
 * AppWrapper — Next.js client-side side-effects component.
 *
 * Handles:
 *  1. Redirect authenticated users away from /auth to /
 *  2. Google OAuth redirect toasts (login=success / login=error query params)
 *  3. Scroll-to-top on every route change
 *
 * NOTE: This component renders nothing (returns null).
 * Mount it once near the top of the component tree (e.g. inside MainLayout or layout.js).
 */
const AppWrapper = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Redirect authenticated users away from /auth
  useEffect(() => {
    if (user && pathname === '/auth') {
      router.push('/');
    }
  }, [user, pathname, router]);

  // 2. Handle Google OAuth redirect query params
  useEffect(() => {
    const loginStatus = searchParams.get('login');
    const message = searchParams.get('message');

    if (user && loginStatus === 'success') {
      toast.success('Google login successful!');
      // Strip the query param from URL without a full navigation
      router.replace(pathname);
    }

    if (loginStatus === 'error') {
      toast.error(message || 'Google login failed');
      router.replace(pathname);
    }
  }, [searchParams, user, pathname, router]);

  // 3. Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

export default AppWrapper;
