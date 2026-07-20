"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Category,
  CategoryOutlined,
  FoodBank,
  Restaurant,
  Straighten,
  ExpandMore,
  People,
  Analytics,
  Home,
  ViewQuilt,
  Settings,
  Favorite,
  Message,
  ReceiptLong,
  ChevronLeft,
  ChevronRight,
  Close,
} from '@mui/icons-material';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { Box } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/useUser';

const adminLinks = [
  {
    label: 'User List',
    icon: <People />,
    to: '/admin/manage-users',
    permission: ['user.list', 'user.update'],
  },

  {
    label: 'Analytics',
    icon: <Analytics />,
    permission: ['engagement.analytics', 'search_failed.list', 'inquiry.list'],
    subLinks: [
      { label: 'Failed Searches', icon: <Analytics />, to: '/admin/failed-searches', permission: 'search_failed.list' },
      { label: 'Inquiries', icon: <Message />, to: '/admin/manage-contacts', permission: 'inquiry.list' },
    ],
  },
  {
    label: 'Navigation',
    icon: <ViewQuilt />,
    permission: ['nav.list', 'footer.list'],
    subLinks: [
      { label: 'Navbar', icon: <ViewQuilt />, to: '/admin/manage-navbar', permission: 'nav.list' },
      { label: 'Footer', icon: <ViewQuilt />, to: '/admin/manage-footer', permission: 'footer.list' },
    ],
  },
  {
    label: 'Banners',
    icon: <AnnouncementIcon />,
    to: '/admin/manage-banners',
    permission: 'banner.list',
  },
  {
    label: 'Home Page',
    icon: <Home />,
    permission: 'home_section.list',
    subLinks: [
      { label: 'Home Sections', icon: <ViewQuilt />, to: '/admin/manage-home-section', permission: 'home_section.list' },
      { label: 'Section Items', icon: <ViewQuilt />, to: '/admin/manage-home-section-items', permission: 'home_section_items.list' },
    ],
  },
  {
    label: 'Categories',
    icon: <Category />,
    permission: ['category.list', 'subcategory.list'],
    subLinks: [
      { label: 'Manage Category', icon: <Category />, to: '/admin/manage-recipe-category', permission: 'category.list' },
      { label: 'Manage Sub-Category', icon: <CategoryOutlined />, to: '/admin/manage-recipe-subcategories', permission: 'subcategory.list' },
    ],
  },
  {
    label: 'Recipes',
    icon: <FoodBank />,
    permission: ['recipe.list_all', 'recipe.list', 'keyword.list', 'assigned_recipe.list', 'assigned_recipe.list_all', 'recipe.note_list_all', 'recipe.note_list'],
    subLinks: [
      { label: 'Manage Recipes', icon: <FoodBank />, to: '/admin/manage-recipes', permission: ['recipe.list_all', 'recipe.list'] },
      { label: 'Assigned Recipes', icon: <ReceiptLong />, to: '/admin/manage-assigned-recipes', permission: ['assigned_recipe.list', 'assigned_recipe.list_all'] },
      { label: 'Recipe Notes', icon: <ReceiptLong />, to: '/admin/manage-recipe-notes', permission: ['recipe.note_list_all', 'recipe.note_list'] },
      { label: 'Manage Keywords', icon: <Category />, to: '/admin/manage-keywords', permission: 'keyword.list' },
    ],
  },
  {
    label: 'Ingredients',
    icon: <Restaurant />,
    permission: ['ingredient.list', 'ingredient_unit.list'],
    subLinks: [
      { label: 'Ingredients', icon: <Restaurant />, to: '/admin/manage-ingredients', permission: 'ingredient.list' },
      { label: 'Ingredient Units', icon: <Straighten />, to: '/admin/manage-ingredient-units', permission: 'ingredient_unit.list' },
    ],
  },
  {
    label: 'System',
    icon: <Settings />,
    permission: ['cron_logs.list', 'failed_logs.list', 'config.manage', 'payment_slip.list', 'activity_logs.list', 'notifications.list'],
    subLinks: [
      { label: 'Notifications', icon: <AnnouncementIcon />, to: '/admin/notifications', permission: 'notifications.list' },
      { label: 'Cron Logs', icon: <Analytics />, to: '/admin/cron-logs', permission: 'cron_logs.list' },
      { label: 'Activity Logs', icon: <Analytics />, to: '/admin/activity-logs', permission: 'activity_logs.list' },
      { label: 'Failed Logs', icon: <AnnouncementIcon />, to: '/admin/failed-logs', permission: 'failed_logs.list' },
      { label: 'Manage Config', icon: <Settings />, to: '/admin/manage-config', permission: 'config.manage' },
      { label: 'Payroll', icon: <ReceiptLong />, to: '/admin/manage-payment-slips', permission: 'payment_slip.list' },
    ],
  },
  {
    label: 'RBAC',
    icon: <Settings />,
    permission: ['role.list', 'permission.list'],
    subLinks: [
      { label: 'Roles', icon: <People />, to: '/admin/manage-roles', permission: 'role.list' },
      { label: 'Permissions', icon: <Analytics />, to: '/admin/manage-permissions', permission: 'permission.list' },
    ],
  },
];

// ── Design tokens ──────────────────────────────────────────────────────────────
const SIDEBAR_EXPANDED = 280;
const SIDEBAR_COLLAPSED = 68;

const ACCENT = '#7367f0';
const ACCENT_DIM = 'rgba(115, 103, 240, 0.12)';

const getTokens = (isDarkMode) => ({
  BG: isDarkMode ? '#283046' : '#ffffff',
  SURFACE: isDarkMode ? '#1a1d27' : '#f1f5f9',
  BORDER: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  TEXT_PRI: isDarkMode ? '#e2e8f0' : '#1e293b',
  TEXT_SEC: isDarkMode ? '#64748b' : '#64748b',
  HOVER_BG: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
});

// ── Helper ─────────────────────────────────────────────────────────────────────
const checkPerm = (permission, userPermissions, role) => {
  if (!permission) return true;
  if (role === 'admin') return true;
  if (Array.isArray(permission)) return permission.some(p => userPermissions.includes(p));
  return userPermissions.includes(permission);
};

// ── Motion link wrapper ────────────────────────────────────────────────────────
const MotionLink = motion(Link);

// ── Sub-item component ─────────────────────────────────────────────────────────
const SubItem = ({ sub, isActive, onClick, tokens, isDarkMode }) => {
  const { TEXT_SEC, TEXT_PRI, HOVER_BG } = tokens;
  return (
    <MotionLink
      href={sub.to || sub.href || '#'}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '6px 12px', borderRadius: '8px',
        textDecoration: 'none',
        background: isActive
          ? 'linear-gradient(72.47deg, #7367f0 22.16%, rgba(115, 103, 240, 0.7) 76.47%)'
          : 'transparent',
        boxShadow: 'none',
        transition: 'color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = HOVER_BG; e.currentTarget.style.color = TEXT_PRI; } }}
      onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'linear-gradient(72.47deg, #7367f0 22.16%, rgba(115, 103, 240, 0.7) 76.47%)' : 'transparent'; e.currentTarget.style.color = isActive ? '#ffffff' : TEXT_SEC; }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, flexShrink: 0,
        color: isActive ? '#ffffff' : TEXT_SEC,
        transition: 'all 0.22s ease',
      }}>
        {React.cloneElement(sub.icon, { style: { fontSize: 20 } })}
      </span>
      <span style={{
        fontSize: '1.05rem', fontWeight: 600,
        color: isActive ? '#ffffff' : TEXT_PRI,
        whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', letterSpacing: '0.01em',
      }}>
        {sub.label}
      </span>
    </MotionLink>
  );
};

const AdminVerticalNavbar = ({ open, setOpen, mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const [openMenus, setOpenMenus] = useState({});

  const { BG, SURFACE, BORDER, TEXT_PRI, TEXT_SEC, HOVER_BG } = getTokens(isDarkMode);

  const userPermissions = useMemo(() => user?.permissions || [], [user]);
  const userRole = user?.role;

  const filteredLinks = useMemo(() => {
    if (userRole === 'admin') return adminLinks;
    return adminLinks.reduce((acc, link) => {
      const permittedSubs = link.subLinks
        ? link.subLinks.filter(s => checkPerm(s.permission, userPermissions, userRole))
        : null;
      if (link.subLinks) {
        if (permittedSubs?.length) acc.push({ ...link, subLinks: permittedSubs });
      } else if (checkPerm(link.permission, userPermissions, userRole)) {
        acc.push(link);
      }
      return acc;
    }, []);
  }, [user, userPermissions, userRole]);

  useEffect(() => {
    filteredLinks.forEach(link => {
      if (link.subLinks?.some(s => pathname === s.to)) {
        setOpenMenus(prev => ({ ...prev, [link.label]: true }));
      }
    });
  }, [pathname, filteredLinks]);

  const toggleMenu = key => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const [isLargeScreen, setIsLargeScreen] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const handler = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (isLargeScreen) return;
    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [mobileOpen, isLargeScreen]);

  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isLargeScreen ? (open || isHovered) : true;

  return (
    <>
      {/* ── Transparent click-away backdrop (tablet + mobile only) ── */}
      <AnimatePresence>
        {!isLargeScreen && mobileOpen && (
          <motion.div
            key="click-away-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'transparent',
              zIndex: 1199,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Unified Sidebar ──────────────────────────────────────────── */}
      <motion.nav
        initial={false}
        animate={
          isLargeScreen
            ? { x: 0, width: isExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }
            : { x: mobileOpen ? 0 : -SIDEBAR_EXPANDED, width: SIDEBAR_EXPANDED }
        }
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onMouseEnter={() => isLargeScreen && setIsHovered(true)}
        onMouseLeave={() => isLargeScreen && setIsHovered(false)}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          background: BG,
          borderRight: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: isLargeScreen ? 1005 : 1200,
          overflow: 'hidden',
          boxShadow: isDarkMode ? '4px 0 24px rgba(0,0,0,0.3)' : '4px 0 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* ── Toggle Button (large screens only) ────────────────────── */}
        {isLargeScreen && (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: isExpanded ? 'flex-end' : 'center',
            height: 64, padding: '0 8px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
          }}>
            <button
              id="admin-nav-toggle"
              onClick={() => setOpen(prev => !prev)}
              title={open ? 'Collapse sidebar' : 'Expand sidebar'}
              style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `2px solid ${isDarkMode ? '#ffffff' : ACCENT}`,
                background: 'transparent', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease',
                flexShrink: 0, padding: 0,
              }}
            >
              {open && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isDarkMode ? '#ffffff' : ACCENT,
                  transition: 'all 0.2s ease',
                }} />
              )}
            </button>
          </div>
        )}

        {/* ── Nav Items ─────────────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '10px 8px',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredLinks.map(link => {
              const isParentActive = link.subLinks?.some(s => pathname === s.to);
              const isActive = link.to ? pathname === link.to : isParentActive;
              const expanded = openMenus[link.label];

              return (
                <li key={link.label} style={{ position: 'relative' }}>
                  {link.subLinks ? (
                    <>
                      <motion.button
                        onClick={() => { if (!isExpanded) setOpen(true); else toggleMenu(link.label); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                          padding: isExpanded ? '6px 12px' : '6px 0',
                          justifyContent: isExpanded ? 'flex-start' : 'center',
                          borderRadius: '8px', border: 'none',
                          background: isActive ? HOVER_BG : 'transparent',
                          color: isActive ? TEXT_PRI : TEXT_SEC,
                          cursor: 'pointer', transition: 'color 0.2s ease, background-color 0.2s ease', position: 'relative',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = HOVER_BG; e.currentTarget.style.color = TEXT_PRI; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isActive ? HOVER_BG : 'transparent'; e.currentTarget.style.color = isActive ? TEXT_PRI : TEXT_SEC; }}
                      >
                        <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, flexShrink: 0,
                          color: isActive ? TEXT_PRI : TEXT_SEC,
                          transition: 'all 0.22s ease',
                        }}>
                          {React.cloneElement(link.icon, { style: { fontSize: 20 } })}
                        </span>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.span
                              key="label"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.18 }}
                              style={{
                                flex: 1, display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', overflow: 'hidden',
                                whiteSpace: 'nowrap', fontSize: '1.05rem', fontWeight: 600,
                                color: isActive ? TEXT_PRI : TEXT_PRI, letterSpacing: '0.01em',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</span>
                              <motion.span
                                animate={{ rotate: expanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex', color: TEXT_SEC, flexShrink: 0 }}
                              >
                                <ExpandMore style={{ fontSize: 20 }} />
                              </motion.span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <AnimatePresence>
                        {expanded && isExpanded && (
                          <motion.ul
                            key="sub"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            style={{
                              listStyle: 'none', margin: '3px 0 3px 8px', padding: '0',
                              display: 'flex', flexDirection: 'column', gap: '4px',
                              overflow: 'hidden', borderLeft: `1px solid ${BORDER}`, paddingLeft: '10px',
                            }}
                          >
                            {link.subLinks.map(sub => (
                              <li key={sub.to}>
                                <SubItem
                                  sub={sub}
                                  isActive={pathname === sub.to}
                                  onClick={() => { if (!isLargeScreen) setMobileOpen(false); }}
                                  tokens={{ TEXT_SEC, TEXT_PRI, HOVER_BG }}
                                  isDarkMode={isDarkMode}
                                />
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <MotionLink
                      href={link.to || '#'}
                      onClick={() => { if (!isLargeScreen) setMobileOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: isExpanded ? '6px 12px' : '6px 0',
                        justifyContent: isExpanded ? 'flex-start' : 'center',
                        borderRadius: '8px', textDecoration: 'none',
                        background: isActive ? 'linear-gradient(72.47deg, #7367f0 22.16%, rgba(115, 103, 240, 0.7) 76.47%)' : 'transparent',
                        boxShadow: 'none',
                        transition: 'color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease', position: 'relative',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = HOVER_BG; e.currentTarget.style.color = TEXT_PRI; } }}
                      onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'linear-gradient(72.47deg, #7367f0 22.16%, rgba(115, 103, 240, 0.7) 76.47%)' : 'transparent'; e.currentTarget.style.color = isActive ? '#ffffff' : TEXT_SEC; }}
                    >
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, flexShrink: 0,
                        color: isActive ? '#ffffff' : TEXT_SEC,
                        transition: 'all 0.22s ease',
                      }}>
                        {React.cloneElement(link.icon, { style: { fontSize: 20 } })}
                      </span>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.18 }}
                            style={{
                              fontSize: '1.05rem', fontWeight: 600,
                              color: isActive ? '#ffffff' : TEXT_PRI,
                              whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis', letterSpacing: '0.01em',
                            }}
                          >
                            {link.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </MotionLink>
                  )}
                </li>
              );
            })}
          </ul>
        </Box>
      </motion.nav>
    </>
  );
};

export default AdminVerticalNavbar;

