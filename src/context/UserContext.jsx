"use client";
import React, { createContext, useState, useEffect } from 'react';
import { useMyProfileQuery } from '../features/api/authApi';
import Cookies from 'js-cookie';

export const UserContext = createContext();


export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const token = typeof window !== 'undefined' ? Cookies.get('token') : null;

  const { data, isSuccess, isLoading, isError, error, isFetching, refetch } = useMyProfileQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
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
  }, [isSuccess, data, isError, error, isFetching, token]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, authModalOpen, setAuthModalOpen, refetch }}>
      {children}
    </UserContext.Provider>
  );
};
