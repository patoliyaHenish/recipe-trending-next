"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '../context/useUser';
import { toast } from '../utils/toast';

const AppWrapper = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      router.replace(pathname);
    }

    if (loginStatus === 'error') {
      toast.error(message || 'Google login failed');
      router.replace(pathname);
    }
  }, [searchParams, user, pathname, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

export default AppWrapper;
