"use client";
import React, { createContext, useState, useEffect } from 'react';
import { useMyProfileQuery } from '../features/api/authApi';
import Cookies from 'js-cookie';

export const UserContext = createContext();


export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // mounted starts false (SSR + initial hydration), becomes true only on the client.
  // We skip the API during SSR because:
  //   1. Server has no browser cookies → always 401 (wasted call)
  //   2. credentials:'include' only works in the browser
  // After mount, we ALWAYS call the API regardless of cookie state —
  // exactly like a React (CRA) app. The API response determines auth:
  //   - 200 → set user
  //   - 401 → set user to null (handled silently in onQueryStarted)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isSuccess, isLoading, isError, error, isFetching, refetch } = useMyProfileQuery(undefined, {
    skip: !mounted,
  });

  useEffect(() => {
    if (!mounted) return;

    if (isSuccess && data?.user && !isFetching) {
      setUser(data.user);

      if (data.user.preference) {
        const dbPrefs = Array.isArray(data.user.preference)
          ? data.user.preference.join(',')
          : data.user.preference;

        const currentCookie = Cookies.get('userPreference') || '';

        if (dbPrefs !== currentCookie) {
          if (dbPrefs === 'all') {
            Cookies.remove('userPreference');
          } else {
            Cookies.set('userPreference', dbPrefs, { expires: 365 });
          }
          window.dispatchEvent(new Event('userPreferenceChanged'));
        }
      }
    } else if (isError) {
      setUser(null);
    }
  }, [isSuccess, data, isError, error, isFetching, mounted]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, authModalOpen, setAuthModalOpen, refetch }}>
      {children}
    </UserContext.Provider>
  );
};
