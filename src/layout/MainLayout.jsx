"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/Navbar';
import AdminVerticalNavbar from '../components/AdminVerticalNavbar';
import { useUser } from '../context/useUser';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import AccessDenied from '../components/common/AccessDenied';
import { clearForbidden } from '../features/globalSlice';

const MainLayout = ({ children, initialNavItems, initialFooterItems }) => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, isLoading: isAuthLoading } = useUser();
  const { isDarkMode } = useTheme();
  const { isForbidden, forbiddenMessage } = useSelector((state) => state.global);
  const isImpersonating = useSelector((state) => state.auth.isImpersonating);

  // mounted = false during SSR and initial hydration, true only after client mount
  const [mounted, setMounted] = useState(false);

  // Only treat user===undefined as "loading" on the client (after mount).
  // On the server / initial hydration, we keep isAdminMode based on real user state
  // to avoid rendering AdminVerticalNavbar during SSR (which accesses window).
  const isAuthPending = mounted && user === undefined;

  const isStaff = !!(user?.role && user.role !== 'user');
  const isAdminMode = isStaff || isImpersonating || isAuthPending;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isForbidden) {
      dispatch(clearForbidden());
    }
  }, [pathname, dispatch]);

  // Desktop sidebar open/collapsed state (persisted)
  const [adminNavOpen, setAdminNavOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminNavOpen');
      if (stored === null || stored === 'undefined') return false;
      try { return JSON.parse(stored); } catch { return false; }
    }
    return false;
  });

  // Mobile full-screen overlay state (not persisted)
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Persist desktop sidebar state
  useEffect(() => {
    localStorage.setItem('adminNavOpen', JSON.stringify(adminNavOpen));
  }, [adminNavOpen]);

  // Auto-close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.title = 'Recipe Trending';
  });

  // Only apply sidebar margin on large screens (≥ 1024px);
  // on tablet + mobile the sidebar slides in as an overlay — no margin needed.
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  useEffect(() => {
    setIsLargeScreen(window.innerWidth >= 1024);
    const handler = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Width the sidebar occupies on large screens — used to offset the admin AppBar
  const sidebarWidth = (isAdminMode && isLargeScreen) ? (adminNavOpen ? 280 : 68) : 0;
  // Padding for the main content area
  const adminPadding = (isAdminMode && isLargeScreen) ? 24 : 0;
  // Independent padding for the floating navbar (aligns exactly with inner page cards: adminPadding + px-3 (12px))
  const navbarHorizontalMargin = (isAdminMode && isLargeScreen) ? 36 : (isAdminMode ? 12 : 0);
  const navbarTop = (isAdminMode && isLargeScreen) ? 24 : (isAdminMode ? 12 : 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', transition: 'background-color 0.3s ease' }}>
      <Suspense fallback={<div style={{ height: '64px' }} />}>
        <Navbar
          adminNavOpen={isAdminMode ? mobileNavOpen : undefined}
          onAdminNavToggle={isAdminMode ? () => setMobileNavOpen(prev => !prev) : undefined}
          sidebarWidth={sidebarWidth}
          adminDesktopOpen={adminNavOpen}
          isAdminMode={isAdminMode}
          navbarHorizontalMargin={navbarHorizontalMargin}
          navbarTop={navbarTop}
          initialNavItems={initialNavItems}
        />
      </Suspense>
      <div className="flex flex-grow">
        {isAdminMode && (
          <AdminVerticalNavbar
            open={adminNavOpen}
            setOpen={setAdminNavOpen}
            mobileOpen={mobileNavOpen}
            setMobileOpen={setMobileNavOpen}
          />
        )}
        <div
          className={isAdminMode ? 'admin-panel' : ''}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            // Sidebar margin only on desktop (≥ 1024px); tablet + mobile = overlay
            marginLeft: (isAdminMode && isLargeScreen)
              ? (adminNavOpen ? '280px' : '68px')
              : '0px',
            transition: 'margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: 'var(--bg-primary)',
            paddingLeft: `${adminPadding}px`,
            paddingRight: `${adminPadding}px`,
            paddingTop: isAdminMode ? `${navbarTop}px` : '0px', // Content already has margin-top for navbar height, just add the float offset
          }}
        >
          {isForbidden ? (
            <AccessDenied message={forbiddenMessage} />
          ) : (
            <>
              {children}
              {isAdminMode && (
                <footer className="w-full py-4 mt-auto text-sm px-3" style={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                  <p>
                    © 2026 , made with <span style={{ color: '#ff3b30', fontSize: '1.1em' }}>❤️</span> by <span style={{ color: '#7367f0', fontWeight: 500 }}>Henish Patoliya</span>
                  </p>
                </footer>
              )}
            </>
          )}
        </div>
      </div>
      {(!user || (!isAdminMode)) && <Footer initialFooterItems={initialFooterItems} />}
    </div>
  );
};

export default MainLayout;

