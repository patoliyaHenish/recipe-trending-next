"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMyProfileQuery } from '../features/api/authApi';
import Cookies from 'js-cookie';

export const UserContext = createContext();


export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Read the persisted auth state from Redux (rehydrated from localStorage on reload)
  const persistedUser = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const token = typeof window !== 'undefined' ? Cookies.get('token') : null;

  // Skip the API call if we already have the user from the persisted Redux store
  // Only call the API if we have a token but no persisted user data yet
  const { data, isSuccess, isLoading, isError, error, isFetching, refetch } = useMyProfileQuery(undefined, {
    skip: !token || !!persistedUser,
    refetchOnMountOrArgChange: false,
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
    } else if (persistedUser && isAuthenticated) {
      // Use persisted user data immediately — no API call needed
      setUser(persistedUser);
    } else if (isSuccess && data?.user && !isFetching) {
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
  }, [isSuccess, data, isError, error, isFetching, token, persistedUser, isAuthenticated]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, authModalOpen, setAuthModalOpen, refetch }}>
      {children}
    </UserContext.Provider>
  );
};

