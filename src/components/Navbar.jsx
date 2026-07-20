"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Box, Drawer, List, ListItem, ListItemText, Avatar, Menu, MenuItem, Collapse, Skeleton, InputBase, Tooltip, Fade, Grow
} from '@mui/material';
import NavbarSkeleton from './NavbarSkeleton';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MenuOpenRounded from '@mui/icons-material/MenuOpenRounded';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EggIcon from '@mui/icons-material/Egg';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { PersonOutlined as PersonOutlineIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import { useUser } from '../context/useUser';
import { useTheme } from '../context/ThemeContext';
import { getImage } from '../utils/helper';
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';
import { NotificationsDialog } from './common';
import { useGetNavItemsForNavbarQuery } from '../features/api/navItemApi';
import { useGetCombinedSuggestionsQuery } from '../features/api/searchApi';
import { useGetRecentCronLogsSummaryQuery, useMarkNotificationsAsReadMutation } from '../features/api/cronLogApi';
import Cookies from 'js-cookie';
import { useUpdatePreferenceMutation } from '../features/api/authApi';
import navLogo from '../assets/nav_logo.png';
import Link from 'next/link';

const RouterLink = React.forwardRef((props, ref) => {
  const { to, ...rest } = props;
  return <Link href={to || '#'} ref={ref} {...rest} />;
});

const getPreferenceIcon = (label) => {
  if (!label) return null;
  const text = label.toLowerCase();

  if (text.includes('non') && (text.includes('veg') || text.includes('vegetarian'))) {
    return (
      <Box sx={{
        width: 16,
        height: 16,
        border: '2px solid #e53935',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 1.5
      }}>
        <Box sx={{ width: 8, height: 8, bgcolor: '#e53935', borderRadius: '50%' }} />
      </Box>
    );
  }
  if (text.includes('veg') && !text.includes('non')) {
    return (
      <Box sx={{
        width: 16,
        height: 16,
        border: '2px solid #43a047',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 1.5
      }}>
        <Box sx={{ width: 8, height: 8, bgcolor: '#43a047', borderRadius: '50%' }} />
      </Box>
    );
  }
  if (text.includes('egg')) {
    return <EggIcon sx={{ color: '#ffb300', fontSize: '1.2rem', mr: 1.5 }} />;
  }
  return null;
};

const preferenceOptions = [
  { value: 'all', label: 'All' },
  { value: 'veg', label: 'Veg' },
  { value: 'egg', label: 'Egg' }
];

const ALLOWED_PREFERENCE_VALUES = ['veg', 'egg'];
const HIDDEN_INGREDIENT_LABELS = new Set(['none/free text']);

const isHiddenIngredientSuggestion = (suggestion) => {
  const label = String(suggestion?.displayText || suggestion?.text || suggestion?.name || '').trim().toLowerCase();
  return HIDDEN_INGREDIENT_LABELS.has(label);
};

const parsePreferenceParam = (value) => {
  if (!value) return [];
  const parts = Array.isArray(value) ? value.flatMap(item => String(item).split(',')) : String(value).split(',');
  return parts
    .map((item) => item.trim())
    .filter((item) => item === 'all' || ALLOWED_PREFERENCE_VALUES.includes(item));
};

import { usePathname, useSearchParams } from 'next/navigation';

import { toast } from '../utils/toast';

const Navbar = ({ adminNavOpen, onAdminNavToggle, sidebarWidth = 0, adminDesktopOpen = false, isAdminMode = false, navbarHorizontalMargin = 0, navbarTop = 0, initialNavItems = [] }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchTags, setSearchTags] = useState([]);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const { user, authModalOpen, setAuthModalOpen } = useUser();
  const searchParams = useSearchParams();
  const setSearchParams = (updater, options = {}) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const next = typeof updater === 'function' ? updater(current) : new URLSearchParams(updater);
    const search = next.toString();
    const newUrl = `${pathname}${search ? `?${search}` : ''}`;
    if (options.replace) {
      router.replace(newUrl);
    } else {
      router.push(newUrl);
    }
  };
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedMobileItems, setExpandedMobileItems] = useState({});
  const [prefVersion, setPrefVersion] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const { data: notificationsData, refetch: refetchNotifications } = useGetRecentCronLogsSummaryQuery(undefined, {
    skip: !user || user.role === 'user' // only fetch for admins
  });
  const [markAsRead] = useMarkNotificationsAsReadMutation();
  const unreadCount = notificationsData?.data?.filter(log => !log.is_read)?.length || 0;

  const handleNotificationClick = async (event) => {
    setNotificationAnchorEl(event.currentTarget);
    // 1. Refetch to get any new notifications from the backend (e.g. background cron jobs or recipes created without invalidating this specific query)
    const { data: freshData } = await refetchNotifications();
    
    // 3. Mark as read if there are unread items in the FRESH data
    const currentUnread = freshData?.data?.filter(log => !log.is_read)?.length || 0;
    if (currentUnread > 0) {
      try {
        await markAsRead().unwrap();
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePrefChange = () => setPrefVersion(v => v + 1);
    window.addEventListener('userPreferenceChanged', handlePrefChange);
    return () => window.removeEventListener('userPreferenceChanged', handlePrefChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchDrawerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const router = useRouter();
  const { isDarkMode } = useTheme();
  const isImpersonating = useSelector((state) => state.auth.isImpersonating);
  const [updatePreference] = useUpdatePreferenceMutation();
  const pathname = usePathname();
  const preferenceParam = useMemo(
    () => {
      const _ = prefVersion;

      if (user?.preference) {
        return Array.isArray(user.preference) ? user.preference.join(',') : user.preference;
      }

      return searchParams.get('preference') || Cookies.get('userPreference') || '';
    },
    [searchParams, prefVersion, user]
  );
  const selectedPreferences = useMemo(
    () => parsePreferenceParam(preferenceParam),
    [preferenceParam]
  );
  const selectedPreferencesForUi = useMemo(() => {
    const base = selectedPreferences.length > 0
      ? selectedPreferences
      : ALLOWED_PREFERENCE_VALUES;
    const set = new Set(base);
    const hasAllTypes = ALLOWED_PREFERENCE_VALUES.every((value) => set.has(value));
    if (hasAllTypes) {
      set.add('all');
    }
    return Array.from(set);
  }, [selectedPreferences]);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchInputValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  const { data: combinedSuggestions } = useGetCombinedSuggestionsQuery(debouncedSearchValue, {
    skip: debouncedSearchValue.length === 0 || debouncedSearchValue.length < 1
  });

  const sortedSuggestions = useMemo(() => {
    if (!combinedSuggestions || combinedSuggestions.length === 0) return [];
    const query = debouncedSearchValue.trim().toLowerCase();

    const selectedKeys = new Set(
      searchTags.map(tag => {
        const type = tag.type || 'recipe';
        const id = tag.id ? String(tag.id) : '';
        const label = String(tag.displayText || tag.text || tag.name || '').toLowerCase();
        return id ? `${type}:${id}` : `${type}:${label}`;
      })
    );

    const scoreSuggestion = (suggestion) => {
      if (!query) return 2;
      const label = String(
        suggestion.displayText || suggestion.text || suggestion.name || ''
      ).toLowerCase();

      if (label.startsWith(query)) return 0;
      if (label.includes(query)) return 1;
      return 2;
    };

    return combinedSuggestions
      .filter(suggestion => {
        const type = suggestion.type || 'recipe';
        const id = suggestion.id ? String(suggestion.id) : '';
        const label = String(
          suggestion.displayText || suggestion.text || suggestion.name || ''
        ).toLowerCase();
        const key = id ? `${type}:${id}` : `${type}:${label}`;
        return !selectedKeys.has(key) && !isHiddenIngredientSuggestion(suggestion);
      })
      .map((suggestion, index) => ({
        suggestion,
        index,
        score: scoreSuggestion(suggestion),
        length: String(
          suggestion.displayText || suggestion.text || suggestion.name || ''
        ).length
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.length !== b.length) return a.length - b.length;
        return a.index - b.index;
      })
      .map(item => item.suggestion);
  }, [combinedSuggestions, debouncedSearchValue, searchTags]);

  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setAuthModalOpen(true);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('login');
        return newParams;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('openSearch') === '1') {
      const q = searchParams.get('q') || '';
      const t = searchParams.get('t') || '';
      const types = t.split(',').map(item => item.trim()).filter(Boolean);
      const categoryIds = (searchParams.get('categoryId') || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const subCategoryIds = (searchParams.get('subCategoryId') || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const recipeIds = (searchParams.get('recipeId') || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const ingredientIds = (searchParams.get('ingredientId') || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const keywordIds = (searchParams.get('keywordId') || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      let categoryIndex = 0;
      let subCategoryIndex = 0;
      let recipeIndex = 0;
      let ingredientIndex = 0;
      let keywordIndex = 0;
      const parsedTags = q
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map((text, index) => ({
          displayText: text,
          text,
          name: text,
          type: types[index] || 'recipe',
          id: (types[index] === 'category' && categoryIds[categoryIndex])
            ? categoryIds[categoryIndex++]
            : (types[index] === 'subCategory' && subCategoryIds[subCategoryIndex])
              ? subCategoryIds[subCategoryIndex++]
              : (types[index] === 'recipe' && recipeIds[recipeIndex])
                ? recipeIds[recipeIndex++]
                : (types[index] === 'ingredient' && ingredientIds[ingredientIndex])
                  ? ingredientIds[ingredientIndex++]
                  : (types[index] === 'keyword' && keywordIds[keywordIndex])
                    ? keywordIds[keywordIndex++]
                    : undefined
        }));

      setSearchTags(parsedTags);
      setSearchInputValue('');
      setShowSuggestionsDropdown(false);
      setSearchDrawerOpen(true);

      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('openSearch');
        return newParams;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchDrawerOpen) {
      const timer = setTimeout(() => {
        const input = document.getElementById('search-input-field');
        if (input) {
          input.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchDrawerOpen]);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  const openSearchDrawer = () => setSearchDrawerOpen(true);
  const closeSearchDrawer = () => {
    setSearchDrawerOpen(false);
    setSearchInputValue('');
    setSearchTags([]);
    setShowSuggestionsDropdown(false);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;

    if (value.includes(',')) {
      const parts = value.split(',');
      const newTagText = parts[0].trim();

      if (newTagText && !searchTags.some(tag => (tag.displayText || tag.text || tag.name || tag) === newTagText)) {
        setSearchTags(prev => [...prev, { displayText: newTagText, type: 'recipe', text: newTagText }]);
      }

      setSearchInputValue(parts.slice(1).join(',').trim());
      setShowSuggestionsDropdown(parts.slice(1).join(',').trim().length > 0);
    } else {
      setSearchInputValue(value);
      setShowSuggestionsDropdown(value.length > 0);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const suggestionText = suggestion.displayText || suggestion.text || suggestion.name || suggestion;
    if (suggestion && !searchTags.some(tag => (tag.displayText || tag.text || tag.name || tag) === suggestionText)) {
      const normalized = typeof suggestion === 'object'
        ? {
          displayText: suggestionText,
          text: suggestionText,
          name: suggestionText,
          type: suggestion.type || 'recipe',
          id: suggestion.id
        }
        : { displayText: suggestion, type: 'recipe', text: suggestion, name: suggestion };
      setSearchTags(prev => [...prev, normalized]);
    }
    setSearchInputValue('');
    setShowSuggestionsDropdown(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setSearchTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();

    let allTerms = searchTags.map(tag => ({
      text: tag.displayText || tag.text || tag.name || tag,
      type: tag.type || 'recipe'
    }));
    const currentInput = searchInputValue?.trim?.() || '';
    if (currentInput && !allTerms.some(item => item.text === currentInput)) {
      allTerms.push({ text: currentInput, type: 'recipe' });
    }

    const q = allTerms.map(item => item.text).join(', ');
    const t = allTerms.map(item => item.type).join(', ');
    const categoryIds = searchTags
      .filter(tag => tag.type === 'category' && tag.id)
      .map(tag => tag.id);
    const subCategoryIds = searchTags
      .filter(tag => tag.type === 'subCategory' && tag.id)
      .map(tag => tag.id);
    const recipeIds = searchTags
      .filter(tag => tag.type === 'recipe' && tag.id)
      .map(tag => tag.id);
    const ingredientIds = searchTags
      .filter(tag => tag.type === 'ingredient' && tag.id)
      .map(tag => tag.id);
    const keywordIds = searchTags
      .filter(tag => tag.type === 'keyword' && tag.id)
      .map(tag => tag.id);
    closeSearchDrawer();
    if (q) {
      const params = new URLSearchParams();
      params.set('q', q);
      if (t) params.set('t', t);
      if (categoryIds.length > 0) params.set('categoryId', categoryIds.join(','));
      if (subCategoryIds.length > 0) params.set('subCategoryId', subCategoryIds.join(','));
      if (recipeIds.length > 0) params.set('recipeId', recipeIds.join(','));
      if (ingredientIds.length > 0) params.set('ingredientId', ingredientIds.join(','));
      if (keywordIds.length > 0) params.set('keywordId', keywordIds.join(','));
      router.push(`/result?${params.toString()}`);
    }
    else router.push('/result');
  };



  const handleLoginClick = () => {
    setAuthModalOpen(true);
  };

  const handleMenuOpen = (event, menuId) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setAnchorEl(event.currentTarget);
    setOpenMenuId(menuId);
  };

  const handleMenuClose = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setAnchorEl(null);
    setOpenMenuId(null);
  };

  const menuTimeoutRef = useRef(null);

  const handleMenuEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      handleMenuClose();
    }, 200);
  };

  const handleMobileItemToggle = (itemId) => {
    setExpandedMobileItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handlePreferenceToggle = async (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return;

    let nextValue;
    if (normalized === 'all') {
      nextValue = 'all';
    } else {
      const next = new Set(selectedPreferences);
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }

      const parts = Array.from(next).filter(v => v !== 'all');
      if (parts.length === 0 || parts.length === ALLOWED_PREFERENCE_VALUES.length) {
        nextValue = 'all';
      } else {
        nextValue = parts.join(',');
      }
    }

    if (nextValue === 'all') {
      Cookies.remove('userPreference');
    } else {
      Cookies.set('userPreference', nextValue, { expires: 365 });
    }

    if (user) {
      try {
        const prefArray = nextValue === 'all' ? ['all'] : nextValue.split(',');
        await updatePreference(prefArray).unwrap();
      } catch (err) {
        toast.error('Failed to update preference in database');
      }
    }

    window.dispatchEvent(new Event('userPreferenceChanged'));
  };


  const { data: queryData, isLoading: isQueryLoading } = useGetNavItemsForNavbarQuery();
  const navItemsData = queryData || { data: initialNavItems };
  const isLoadingNav = isQueryLoading && (!initialNavItems || initialNavItems.length === 0);

  const renderNavLink = (link, { variant = 'desktop-main', onClickClose = null } = {}) => {
    const isPreferenceMenu = link.id === 'manual-preference';
    const isActiveLink = link.to && (link.to === pathname || decodeURIComponent(pathname) === link.to);
    const isActiveChild = link.children?.some(child => child.to === pathname || decodeURIComponent(pathname) === child.to);
    const isActive = isActiveLink || isActiveChild;

    const sharedButtonSx = {
      color: '#FFEFD9',
      fontWeight: 'normal',
      textTransform: 'none',
      borderRadius: 0,
      position: 'relative',
      transition: 'all 0.3s ease',
      fontFamily: "'Basic', sans-serif !important"
    };

    if (link.children && link.children.length > 0) {
      return (
        <Box key={link.id} sx={{ position: 'relative' }}>
          <Button
            onClick={(e) => handleMenuOpen(e, link.id)}
            onMouseEnter={(e) => handleMenuOpen(e, link.id)}
            onMouseLeave={handleMenuLeave}
            endIcon={<KeyboardArrowDownIcon />}
            aria-controls={openMenuId === link.id ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={openMenuId === link.id ? 'true' : undefined}
            sx={{
              ...sharedButtonSx,
              fontSize: variant === 'desktop-main' ? '1.05rem' : '0.98rem',
              px: variant === 'desktop-main' ? 1.8 : 1.5,
              color: variant === 'desktop-main' ? '#FFEFD9' : (isDarkMode ? '#E5E7EB' : '#2B2828'),
              '&::after': {
                content: '""',
                position: 'absolute',
                width: isActive ? '100%' : '0%',
                height: '2px',
                bottom: 0,
                left: 0,
                backgroundColor: variant === 'desktop-main' ? '#ffffff' : (isDarkMode ? '#F4C542' : '#ca6014'),
                transition: 'width 0.3s ease-in-out',
              },
              '&:hover': {
                color: variant === 'desktop-main' ? '#FFEFD9' : (isDarkMode ? '#F4C542' : '#ca6014'),
                bgcolor: 'transparent',
                borderRadius: 0,
                '&::after': {
                  width: '100%',
                },
              },
            }}
          >
            {link.icon}
            {link.label}
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={openMenuId === link.id}
            onClose={handleMenuClose}
            slotProps={{
              list: {
                onMouseEnter: handleMenuEnter,
                onMouseLeave: handleMenuLeave
              }
            }}
            disableRestoreFocus
            disableScrollLock={true}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            sx={{
              pointerEvents: 'none',
              '& .MuiPaper-root': {
                pointerEvents: 'auto',
                background: isDarkMode ? '#311500' : '#ffffff',
                border: isDarkMode ? '1px solid rgba(244, 197, 66, 0.22)' : '1px solid #e5e7eb',
                borderRadius: 2,
                mt: 1,
                minWidth: 180,
              }
            }}
          >
            {link.children.map((child) => {
              const isSelected = isPreferenceMenu && selectedPreferencesForUi.includes(child.value);
              const childActive = !isPreferenceMenu && (child.to === pathname || decodeURIComponent(pathname) === child.to);
              return (
                <MenuItem
                  key={child.id}
                  component={isPreferenceMenu ? 'div' : RouterLink}
                  to={!isPreferenceMenu ? (child.to || '#') : undefined}
                  target={!isPreferenceMenu && child.openInNewTab ? '_blank' : undefined}
                  rel={!isPreferenceMenu && child.openInNewTab ? 'noopener noreferrer' : undefined}
                  selected={Boolean(isSelected || childActive)}
                  onClick={isPreferenceMenu ? () => handlePreferenceToggle(child.value) : () => {
                    handleMenuClose();
                    onClickClose?.();
                  }}
                  sx={{
                    color: isDarkMode ? '#fff6ed' : '#000000',
                    fontWeight: (isSelected || childActive) ? 600 : 'normal',
                    fontSize: '0.95rem',
                    py: 1.2,
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(244, 197, 66, 0.16)' : '#f8f8f8',
                      color: isDarkMode ? '#fff6ed' : '#000000',
                    },
                    fontFamily: "'Basic', sans-serif !important"
                  }}
                >
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      {getPreferenceIcon(child.label)}
                      {child.label}
                    </Box>
                    {(isSelected || childActive) && <CheckRoundedIcon sx={{ fontSize: '1.1rem' }} />}
                  </Box>
                </MenuItem>
              );
            })}
          </Menu>
        </Box>
      );
    }

    return (
      <Button
        key={link.id}
        component={RouterLink}
        to={link.to || '#'}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        onClick={onClickClose || undefined}
        sx={{
          ...sharedButtonSx,
          fontSize: variant === 'desktop-main' ? '1.05rem' : '0.98rem',
          px: variant === 'desktop-main' ? 1.8 : 1.5,
          color: variant === 'desktop-main' ? '#FFEFD9' : (isDarkMode ? '#E5E7EB' : '#2B2828'),
          '&::after': {
            content: '""',
            position: 'absolute',
            width: isActive ? '100%' : '0%',
            height: '2px',
            bottom: 0,
            left: 0,
            backgroundColor: variant === 'desktop-main' ? '#ffffff' : (isDarkMode ? '#F4C542' : '#ca6014'),
            transition: 'width 0.3s ease-in-out',
          },
          '&:hover': {
            color: variant === 'desktop-main' ? '#FFEFD9' : (isDarkMode ? '#F4C542' : '#ca6014'),
            bgcolor: 'transparent',
            borderRadius: 0,
            '&::after': {
              width: '100%',
            },
          },
        }}
      >
        {link.label}
      </Button>
    );
  };


  const visibleLinks = useMemo(() => {
    let links = [];
    if (navItemsData?.data) {
      links = [...navItemsData.data]
        .sort((a, b) => a.order_index - b.order_index)
        .filter(item => item.label !== 'Preference')
        .map(item => ({
          id: item.id,
          label: item.label,
          to: item.path ? (item.path.startsWith('/') ? item.path : `/${item.path}`) : null,
          openInNewTab: item.open_in_new_tab,
          children: item.children ? [...item.children].sort((a, b) => a.order_index - b.order_index).map(child => ({
            id: child.id,
            label: child.label,
            to: child.path ? (child.path.startsWith('/') ? child.path : `/${child.path}`) : null,
            openInNewTab: child.open_in_new_tab,
          })) : []
        }));
    }

    if (!user || user.role === 'user') {
      links.push({
        id: 'manual-preference',
        label: 'Preferences',
        icon: <RestaurantIcon sx={{ mr: 1, fontSize: '1.2rem' }} />,
        to: null,
        openInNewTab: false,
        children: [
          ...preferenceOptions.map(option => ({
            id: `pref-${option.value}`,
            label: option.label,
            value: option.value,
            to: null,
            openInNewTab: false
          }))
        ]
      });
    }

    return links;
  }, [navItemsData, user]);

  const adminNavLinks = useMemo(() => {
    if (user?.role && user.role !== 'user' && navItemsData?.data) {
      return [...navItemsData.data]
        .sort((a, b) => a.order_index - b.order_index)
        .filter(item => item.label !== 'Preference')
        .map(item => ({
          id: item.id,
          label: item.label,
          to: item.path ? (item.path.startsWith('/') ? item.path : `/${item.path}`) : null,
          openInNewTab: item.open_in_new_tab,
          children: item.children ? [...item.children].sort((a, b) => a.order_index - b.order_index).map(child => ({
            id: child.id,
            label: child.label,
            to: child.path ? (child.path.startsWith('/') ? child.path : `/${child.path}`) : null,
            openInNewTab: child.open_in_new_tab,
          })) : []
        }));
    }
    return [];
  }, [navItemsData, user]);

  // Show admin topbar if user is staff OR if an admin is impersonating a regular user
  const isAdmin = !!(user?.role && user.role !== 'user') || isImpersonating;

  if (isAdmin) {
    // ── Admin topbar (Vuexy-style) ────────────────────────────────────────
    return (
      <>
        {/* Scroll Fade Mask for floating navbar gap */}
        {isAdminMode && navbarTop > 0 && (
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: sidebarWidth,
            width: `calc(100% - ${sidebarWidth}px)`,
            height: `${navbarTop + 20}px`,
            zIndex: 1000,
            backgroundColor: isDarkMode ? 'rgba(40, 48, 70, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
            pointerEvents: 'none',
            transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        )}
        <AppBar position="fixed" elevation={0} sx={{
          bgcolor: isDarkMode ? '#283046' : '#ffffff',
          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
          // z-index 1001 keeps the navbar above the sidebar (z-index 1000)
          zIndex: 1001,
          // Floating navbar styling
          top: navbarTop,
          borderRadius: navbarTop > 0 ? '6px' : '0px',
          boxShadow: navbarTop > 0
            ? (isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)')
            : 'none',
          borderBottom: navbarTop > 0 ? 'none' : `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
          // Use independent horizontal margin to make navbar narrower than content area
          left: `calc(${sidebarWidth}px + ${navbarHorizontalMargin}px)`,
          width: `calc(100% - ${sidebarWidth}px - ${navbarHorizontalMargin * 2}px)`,
          transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1), top 0.35s ease, border-radius 0.35s ease, background-color 0.3s ease',
        }}>
          <Toolbar sx={{
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 2, sm: 3 },
            gap: 2,
          }}>
            {/* Mobile sidebar toggle */}
            <IconButton
              edge="start"
              sx={{ display: { xs: 'flex', lg: 'none' }, color: isDarkMode ? '#d0d2d6' : '#6e6b7b', mr: 0.5 }}
              onClick={onAdminNavToggle}
            >
              {adminNavOpen ? <CloseIcon /> : <MenuOpenRounded />}
            </IconButton>

            {/* Search bar */}
            <Box
              onClick={openSearchDrawer}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: 'transparent',
                px: 1, py: 0.9,
                width: { xs: '44px', sm: '240px', md: '280px' },
                height: 40,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <SearchIcon sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontSize: 24, flexShrink: 0 }} />
              <Typography sx={{
                display: { xs: 'none', sm: 'block' },
                color: isDarkMode ? '#6b7280' : '#9ca3af',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}>
                Search (Ctrl+K)
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Right-side icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* Theme toggle */}
              <ThemeToggle color={isDarkMode ? '#d0d2d6' : '#6e6b7b'} />

              {/* Notification bell */}
              {user?.role === 'admin' && (
                <IconButton 
                  onClick={handleNotificationClick}
                  sx={{
                  color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                  '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                }}>
                  <Box sx={{ position: 'relative', display: 'flex' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <Box sx={{
                        position: 'absolute', top: -4, right: -4,
                        width: 16, height: 16, borderRadius: '50%',
                        bgcolor: '#ea5455',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: '#fff', fontWeight: 700, lineHeight: 1,
                      }}>
                        {unreadCount}
                      </Box>
                    )}
                  </Box>
                </IconButton>
              )}

              {/* Avatar */}
              <IconButton
                component={RouterLink}
                to="/my-profile"
                sx={{ p: 0, ml: 0.5 }}
              >
                <Avatar
                  alt={user.name || 'User'}
                  src={user.image ? getImage(user.image) : undefined}
                  sx={{
                    width: 42, height: 42,
                    bgcolor: !user.image && user.profile_color ? user.profile_color : '#7367f0',
                    fontSize: '1rem', fontWeight: 600,
                    border: `2px solid ${isDarkMode ? '#404656' : '#e0dede'}`,
                  }}
                >
                  {!user.image ? (user.name || 'U').charAt(0).toUpperCase() : null}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Search drawer (reuse existing) */}
        {searchDrawerOpen && (
          <Box
            sx={{
              position: 'fixed', inset: 0, zIndex: 1300,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              pt: '80px',
            }}
            onClick={closeSearchDrawer}
          >
            <Box
              onClick={e => e.stopPropagation()}
              sx={{
                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                borderRadius: '8px',
                width: { xs: '95%', sm: '600px' },
                maxHeight: '70vh',
                overflow: 'auto',
                p: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              {(() => {
                const userPermissions = user?.permissions || [];
                const role = user?.role || user?.role_name || '';
                const checkPerm = (perm) => {
                  if (!perm) return true;
                  if (role === 'admin') return true;
                  if (Array.isArray(perm)) return perm.some(p => userPermissions.includes(p));
                  return userPermissions.includes(perm);
                };

                const adminPages = [
                  { label: 'User List', path: '/admin/manage-users', permission: ['user.list', 'user.update'] },
                  { label: 'Failed Searches', path: '/admin/failed-searches', permission: 'search_failed.list' },
                  { label: 'Inquiries', path: '/admin/manage-contacts', permission: 'inquiry.list' },
                  { label: 'Navbar Settings', path: '/admin/manage-navbar', permission: 'nav.list' },
                  { label: 'Footer Settings', path: '/admin/manage-footer', permission: 'footer.list' },
                  { label: 'Banners', path: '/admin/manage-banners', permission: 'banner.list' },
                  { label: 'Home Sections', path: '/admin/manage-home-section', permission: 'home_section.list' },
                  { label: 'Home Section Items', path: '/admin/manage-home-section-items', permission: 'home_section_items.list' },
                  { label: 'Manage Category', path: '/admin/manage-recipe-category', permission: 'category.list' },
                  { label: 'Manage Sub-Category', path: '/admin/manage-recipe-subcategories', permission: 'subcategory.list' },
                  { label: 'Manage Recipes', path: '/admin/manage-recipes', permission: ['recipe.list_all', 'recipe.list'] },
                  { label: 'Assigned Recipes', path: '/admin/manage-assigned-recipes', permission: ['assigned_recipe.list', 'assigned_recipe.list_all'] },
                  { label: 'Manage Keywords', path: '/admin/manage-keywords', permission: 'keyword.list' },
                  { label: 'Ingredients', path: '/admin/manage-ingredients', permission: 'ingredient.list' },
                  { label: 'Ingredient Units', path: '/admin/manage-ingredient-units', permission: 'ingredient_unit.list' },
                  { label: 'Cron Logs', path: '/admin/cron-logs', permission: 'cron_logs.list' },
                  { label: 'Activity Logs', path: '/admin/activity-logs', permission: 'activity_logs.list' },
                  { label: 'Failed Logs', path: '/admin/failed-logs', permission: 'failed_logs.list' },
                  { label: 'Manage Config', path: '/admin/manage-config', permission: 'config.manage' },
                  { label: 'Payroll', path: '/admin/manage-payment-slips', permission: 'payment_slip.list' },
                  { label: 'Roles', path: '/admin/manage-roles', permission: 'role.list' },
                  { label: 'Permissions', path: '/admin/manage-permissions', permission: 'permission.list' }
                ];
                const matches = adminPages
                  .filter(p => checkPerm(p.permission))
                  .filter(p => p.label.toLowerCase().includes((searchInputValue || '').toLowerCase()))
                  .slice(0, 8);
                return (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SearchIcon sx={{ color: isDarkMode ? '#6b7280' : '#9ca3af' }} />
                      <input
                        id="search-input-field"
                        autoFocus
                        value={searchInputValue}
                        onChange={handleSearchInputChange}
                        onKeyDown={e => { 
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (matches.length > 0) {
                              router.push(matches[0].path);
                              closeSearchDrawer();
                            }
                          }
                          if (e.key === 'Escape') closeSearchDrawer(); 
                        }}
                        placeholder="Search admin pages..."
                        style={{
                          flex: 1, border: 'none', outline: 'none',
                          background: 'transparent',
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          fontSize: '1rem',
                        }}
                      />
                      <IconButton size="small" onClick={closeSearchDrawer}>
                        <CloseIcon sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontSize: 18 }} />
                      </IconButton>
                    </Box>
                    {matches.map((s, i) => (
                      <Box
                        key={i}
                        onClick={() => { router.push(s.path); closeSearchDrawer(); }}
                        sx={{
                          px: 2, py: 1.2, borderRadius: '6px', cursor: 'pointer',
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          fontSize: '0.9rem',
                          '&:hover': { bgcolor: isDarkMode ? 'rgba(115,103,240,0.12)' : 'rgba(115,103,240,0.08)', color: '#7367f0' }
                        }}
                      >
                        {s.label}
                      </Box>
                    ))}
                  </>
                );
              })()}
            </Box>
          </Box>
        )}
        <NotificationsDialog 
          anchorEl={notificationAnchorEl} 
          onClose={() => setNotificationAnchorEl(null)} 
        />
      </>
    );
  }

  return (
    <>
      <AppBar position="fixed" sx={{
        bgcolor: '#ca6014',
        color: '#ffffff',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 999,
        transition: 'all 0.3s ease',
        borderBottom: 'none'
      }}>
        <Toolbar sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 0.5, sm: 0 },
          position: 'relative'
        }}>
          {(user?.role && user.role !== 'user') ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label={adminNavOpen ? "close admin menu" : "open admin menu"}
              sx={{ display: { xs: 'flex', xl: 'none' }, mr: 1 }}
              onClick={onAdminNavToggle}
            >
              {adminNavOpen ? (
                <CloseIcon sx={{ fontSize: 30 }} />
              ) : (
                <MenuOpenRounded sx={{ fontSize: 30 }} />
              )}
            </IconButton>
          ) : (
            isLoadingNav ? (
              <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 1, display: { xs: 'flex' }, '@media (min-width: 1440px)': { display: 'none' } }} />
            ) : (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open menu"
                sx={{
                  display: { xs: 'flex', lg: 'none' },
                  mr: 1
                }}
                onClick={handleDrawerToggle}
              >
                <MenuIcon sx={{ fontSize: 30 }} />
              </IconButton>
            )
          )}
          <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: { md: 56, lg: 80 }, mr: { md: 2, lg: 4 } }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                ml: { xs: 0, sm: 2, md: 0 }
              }}
            >
              <>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    component="img"
                    src={navLogo?.src || navLogo}
                    alt="Recipe Trending"
                    sx={{
                      height: { xs: 36, sm: 40, md: 54 },
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                  <Box sx={{
                    ml: { xs: 0.15, sm: 0.25, md: 0.15 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    lineHeight: 1,
                    gap: { xs: 0.15, sm: 0.2 }
                  }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '1rem', sm: '1rem', md: '1.2rem' },
                        color: '#ffffff',
                        letterSpacing: '0.05em',
                        lineHeight: 0.9,
                        fontFamily: "'Basic', sans-serif !important"
                      }}
                    >
                      Recipe
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.75rem', md: '0.85rem' },
                        color: '#ffffff',
                        letterSpacing: '0.1em',
                        lineHeight: 0.9,
                        mb: 0,
                        fontFamily: "'Basic', sans-serif !important"
                      }}
                    >
                      Trending
                    </Typography>
                  </Box>
                </Box>
              </>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />



          <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'center', ml: 'auto', mr: { xs: 0, md: 0 } }}>
            {(!user || user.role === 'user') && (
              <Box
                onClick={openSearchDrawer}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  position: { xs: 'static', md: 'absolute' },
                  left: { md: '50%' },
                  transform: { md: 'translateX(-50%)' },
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '30px',
                  px: { xs: 0, sm: 1.8 },
                  py: { xs: 0, sm: 0.8 },
                  mr: { xs: 0.5, sm: 1.5, md: 0 },
                  width: { xs: '40px', sm: '240px', md: '260px', lg: '330px', xl: '390px' },
                  height: { xs: '40px', sm: 'auto' },
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'text',
                  zIndex: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: { xs: 22, sm: 20 }, mr: { xs: 0, sm: 1 } }} />
                <Typography
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    flex: 1,
                    fontFamily: "'Basic', sans-serif !important",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    userSelect: 'none'
                  }}
                >
                  Search dish or ingredients…
                </Typography>
              </Box>
            )}
            {(!user || user.role === 'user') && (
              <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', ml: { lg: 1.5 }, mr: { lg: 0.5 } }}>
                {!isLoadingNav && (() => {
                  const prefLink = visibleLinks.find((link) => link.id === 'manual-preference');
                  return prefLink ? renderNavLink(prefLink, { variant: 'desktop-main' }) : null;
                })()}
              </Box>
            )}
            {(!user || user.role === 'user') && (
              <IconButton
                component={user ? RouterLink : 'button'}
                to={user ? '/my-cravings' : undefined}
                onClick={(e) => {
                  if (!user) {
                    setAuthModalOpen(true);
                  }
                }}
                sx={{
                  color: pathname === '/my-cravings' ? '#ffffff' : '#ffffff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                {pathname === '/my-cravings' ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            )}
            <Box sx={{ display: { xs: (user?.role && user.role !== 'user') ? 'flex' : 'none', md: 'flex' }, mr: 1 }}>
              <ThemeToggle />
            </Box>
            <Box sx={{ display: { xs: (user?.role && user.role !== 'user') ? 'flex' : 'none', sm: 'flex' }, alignItems: 'center' }}>
              {user ? (
                <IconButton
                  component={RouterLink}
                  to="/my-profile"
                  sx={{
                    p: 0,
                    ml: 1,
                    border: '2px solid #ffffff',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  <Avatar
                    alt={user.name || user.username || 'User'}
                    src={user.image ? getImage(user.image) : undefined}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: !user.image && user.profile_color ? user.profile_color : undefined,
                      fontSize: '1.3rem',
                      fontWeight: 400,
                      fontFamily: "'Basic', sans-serif !important",
                    }}
                  >
                    {!user.image ? (user.name || user.username || 'U').charAt(0).toUpperCase() : null}
                  </Avatar>
                </IconButton>
              ) : (
                <Button
                  onClick={handleLoginClick}
                  sx={{
                    color: '#FFEFD9',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    textTransform: 'none',
                    fontFamily: "'Basic', sans-serif !important",
                    minWidth: 0,
                    '&:hover': {
                      bgcolor: 'transparent',
                      opacity: 0.8
                    }
                  }}
                >
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    <PersonOutlineIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    Login
                  </Box>
                </Button>
              )}
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: { md: 56, lg: 80 }, ml: { md: 2, lg: 4 } }} />
        </Toolbar>
        {(!user?.role || user.role === 'user') ? (
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              px: { md: 3, lg: 6 },
              py: 1,
              borderTop: isDarkMode ? '1px solid rgba(244, 197, 66, 0.18)' : '1px solid #e5e7eb',
              background: isDarkMode ? '#311500' : 'linear-gradient(135deg, #FEE7D6 0%, #FFF5ED 100%)',
              boxShadow: isDarkMode ? '0 3px 12px rgba(0, 0, 0, 0.38)' : '0 2px 10px rgba(0, 0, 0, 0.06)',
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: isDarkMode ? 'rgba(244, 197, 66, 0.35)' : 'rgba(0,0,0,0.2)',
                borderRadius: '999px',
              },
            }}
          >
            {!isLoadingNav && visibleLinks
              .filter((link) => link.id !== 'manual-preference')
              .map((link) => renderNavLink(link, { variant: 'desktop-secondary' }))}
          </Box>
        ) : null}
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen && (!user?.role || user.role === 'user')}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiBackdrop-root': {
            bgcolor: 'rgba(30, 64, 175, 0.7)',
          },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: { xs: '280px', sm: '320px' },
            bgcolor: isDarkMode ? 'var(--bg-primary)' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            borderRight: isDarkMode ? '1px solid var(--border-color)' : '1px solid #e5e7eb',
            overflow: 'visible',
          }
        }}
      >
        <IconButton
          onClick={handleDrawerToggle}
          aria-label="Close menu"
          sx={{
            position: 'absolute',
            right: { xs: -48, sm: -56 },
            top: 12,
            color: '#ffffff',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            width: 36,
            height: 36,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
            zIndex: 2,
          }}
        >
          <ArrowBackIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
        </IconButton>

        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{
            flexGrow: 1,
            overflowY: 'auto',
            pt: 1.5,
            px: { xs: 2, sm: 3 },
            pb: 1,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '2px',
            },
          }}>
            <Box sx={{
              mb: 1.5,
              textAlign: 'center',
              bgcolor: '#ca6014',
              mx: { xs: -2, sm: -3 },
              mt: -1.5,
              px: { xs: 2, sm: 3 },
              minHeight: { xs: 56, sm: 64 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {(user?.role && user.role !== 'user') ? (
                <Typography
                  variant="h5"
                  className="navbar-title"
                  sx={{
                    fontSize: '1.4rem',
                    color: '#ffffff',
                    fontWeight: 400,
                    fontFamily: "'Basic', sans-serif !important"
                  }}
                >
                  <Box component="span" sx={{
                    borderBottom: '2px solid transparent',
                    '&:hover': {
                      borderColor: '#ffffff'
                    }
                  }}>
                    {user?.name || user?.username || 'Your'}
                  </Box>
                  's Workspace
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    component="img"
                    src={navLogo}
                    alt="Recipe Trending"
                    sx={{
                      height: { xs: 34, sm: 40 },
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                  <Box
                    sx={{
                      ml: { xs: 0.8, sm: 1 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      lineHeight: 1,
                      gap: { xs: 0.2, sm: 0.25 }
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '0.05em',
                        lineHeight: 0.9,
                        fontFamily: "'Basic', sans-serif !important"
                      }}
                    >
                      Recipe
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: '0.72rem', sm: '0.75rem' },
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '0.1em',
                        lineHeight: 0.9,
                        fontFamily: "'Basic', sans-serif !important"
                      }}
                    >
                      Trending
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.4, position: 'absolute', right: { xs: 8, sm: 12 } }}>
                {(!user?.role || user.role === 'user') && (
                  <>
                    <ThemeToggle />
                  </>
                )}
              </Box>
            </Box>

            <List>
              {visibleLinks.filter(l => l.id !== 'manual-preference').map((link) => (
                <Box key={link.id}>
                  {link.children && link.children.length > 0 ? (
                    <>
                      <ListItem
                        button
                        onClick={() => handleMobileItemToggle(link.id)}
                        sx={{
                          color: isDarkMode ? '#ffffff' : '#000000',
                          position: 'relative',
                          '&:hover': {
                            bgcolor: 'transparent',
                            color: (user?.role && user.role !== 'user') ? (isDarkMode ? 'var(--navbar-hover)' : 'var(--text-primary)') : (isDarkMode ? '#f4c542' : '#000000'),
                          },
                          mb: { xs: 0.5, sm: 1 },
                          borderRadius: 2,
                          borderBottom: (user?.role && user.role !== 'user') ? (isDarkMode ? '1px solid var(--border-color)' : '1px solid var(--border-color)') : (isDarkMode ? '1px solid rgba(244, 197, 66, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'),
                          py: { xs: 1.2, sm: 1 },
                          px: { xs: 2, sm: 1.5 },
                          minHeight: 48,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {link.icon && React.cloneElement(link.icon, { sx: { mr: 1.5, fontSize: '1.4rem', color: isDarkMode ? '#f4c542' : '#ca6014' } })}
                              {link.label}
                            </Box>
                          }
                          sx={{
                            '.MuiListItemText-primary': {
                              fontSize: { xs: '1.1rem', sm: '1.3rem' },
                              fontWeight: 'bold',
                              textTransform: 'capitalize',
                              color: isDarkMode ? '#ffffff' : '#000000',
                              transition: 'all 0.3s ease',
                              letterSpacing: { xs: '0.5px', sm: '1px' },
                              fontFamily: "'Basic', sans-serif !important"
                            }
                          }}
                        />
                        {expandedMobileItems[link.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </ListItem>
                      <Collapse in={expandedMobileItems[link.id]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 2 }}>
                          {link.children.map((child) => {
                            const isPreferenceMenu = link.id === 'manual-preference';
                            const isSelected = isPreferenceMenu && selectedPreferencesForUi.includes(child.value);
                            return (
                              <ListItem
                                button
                                component={isPreferenceMenu ? 'div' : RouterLink}
                                to={!isPreferenceMenu ? (child.to || '#') : undefined}
                                target={!isPreferenceMenu && child.openInNewTab ? '_blank' : undefined}
                                rel={!isPreferenceMenu && child.openInNewTab ? 'noopener noreferrer' : undefined}
                                key={child.id}
                                selected={Boolean(isSelected)}
                                onClick={isPreferenceMenu ? () => handlePreferenceToggle(child.value) : handleDrawerToggle}
                                sx={{
                                  color: isDarkMode ? '#ffffff' : '#000000',
                                  py: 1.5,
                                  '&:hover': {
                                    color: isDarkMode ? '#f4c542' : '#000000',
                                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                        {getPreferenceIcon(child.label)}
                                        {child.label}
                                      </Box>
                                      {isSelected && <CheckRoundedIcon sx={{ fontSize: '1.1rem' }} />}
                                    </Box>
                                  }
                                  sx={{
                                    '.MuiListItemText-primary': {
                                      fontSize: { xs: '1rem', sm: '1.1rem' },
                                      fontWeight: 500,
                                      color: isDarkMode ? '#ffffff' : '#000000',
                                      fontFamily: "'Basic', sans-serif !important"
                                    }
                                  }}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Collapse>
                    </>
                  ) : (
                    <ListItem
                      button
                      component={RouterLink}
                      to={link.to || '#'}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      onClick={handleDrawerToggle}
                      sx={{
                        color: isDarkMode ? '#ffffff' : '#000000',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: 'transparent',
                          color: (user?.role && user.role !== 'user') ? (isDarkMode ? 'var(--navbar-hover)' : 'var(--text-primary)') : (isDarkMode ? '#f4c542' : '#000000'),
                        },
                        mb: { xs: 0.5, sm: 1 },
                        borderRadius: 2,
                        borderBottom: (user?.role && user.role !== 'user') ? (isDarkMode ? '1px solid var(--border-color)' : '1px solid var(--border-color)') : (isDarkMode ? '1px solid rgba(244, 197, 66, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'),
                        py: { xs: 1.5, sm: 1.2 },
                        px: { xs: 2, sm: 1.5 },
                        minHeight: 48,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ListItemText
                        primary={link.label}
                        sx={{
                          '.MuiListItemText-primary': {
                            fontSize: { xs: '1.1rem', sm: '1.3rem' },
                            fontWeight: 'bold',
                            textTransform: 'capitalize',
                            color: isDarkMode ? '#ffffff' : '#000000',
                            transition: 'all 0.3s ease',
                            letterSpacing: { xs: '0.5px', sm: '1px' },
                            fontFamily: "'Basic', sans-serif !important"
                          }
                        }}
                      />
                    </ListItem>
                  )}
                </Box>
              ))}
            </List>
          </Box>

          <Box sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderTop: isDarkMode ? '1px solid var(--border-color)' : '1px solid #e5e7eb',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {(!user || user.role === 'user') ? (() => {
              const link = visibleLinks.find(l => l.id === 'manual-preference');
              if (!link) return null;
              return (
                <Box>
                  <ListItem
                    button
                    onClick={() => handleMobileItemToggle(link.id)}
                    sx={{
                      color: isDarkMode ? '#ffffff' : '#000000',
                      borderRadius: 2,
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      py: 1,
                      px: 1.5,
                      mb: expandedMobileItems[link.id] ? 0.5 : 0,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {React.cloneElement(link.icon, { sx: { mr: 1.5, fontSize: '1.2rem', color: isDarkMode ? '#f4c542' : '#ca6014' } })}
                            <Typography sx={{ fontWeight: 'bold', fontSize: '0.95rem', fontFamily: "'Basic', sans-serif" }}>
                              {link.label}
                            </Typography>
                          </Box>
                          {expandedMobileItems[link.id] ? <ExpandLessIcon sx={{ fontSize: '1.2rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '1.2rem' }} />}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Collapse in={expandedMobileItems[link.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ mb: 1, mt: 0.5 }}>
                      {link.children.map((child) => {
                        const isSelected = selectedPreferencesForUi.includes(child.value);
                        return (
                          <ListItem
                            button
                            key={child.id}
                            selected={Boolean(isSelected)}
                            onClick={() => handlePreferenceToggle(child.value)}
                            sx={{
                              color: isDarkMode ? '#ffffff' : '#000000',
                              py: 0.8,
                              pl: 5,
                              borderRadius: 1,
                              mx: 0.5,
                              '&.Mui-selected': {
                                bgcolor: isDarkMode ? 'rgba(244, 197, 66, 0.15)' : 'rgba(202, 96, 20, 0.1)',
                                color: isDarkMode ? '#f4c542' : '#ca6014',
                              },
                              '&:hover': {
                                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {getPreferenceIcon(child.label)}
                                    <Typography sx={{ fontSize: '0.9rem', fontFamily: "'Basic', sans-serif" }}>{child.label}</Typography>
                                  </Box>
                                  {isSelected && <CheckRoundedIcon sx={{ fontSize: '1rem' }} />}
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            })() : null}

            {user ? (
              <ListItem
                button
                component={RouterLink}
                to="/my-profile"
                onClick={handleDrawerToggle}
                sx={{
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  mb: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  }
                }}
              >
                <Avatar
                  alt={user.name || user.username || 'User'}
                  src={user.image ? getImage(user.image) : undefined}
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: !user.image && user.profile_color ? user.profile_color : undefined,
                    mr: 2,
                    fontFamily: "'Basic', sans-serif !important",
                    fontWeight: 400,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  {!user.image ? (user.name || user.username || 'U').charAt(0).toUpperCase() : null}
                </Avatar>
                <ListItemText
                  primary={user.name || user.username}
                  secondary="My Profile"
                  primaryTypographyProps={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: isDarkMode ? '#ffffff' : '#000000',
                    fontFamily: "'Basic', sans-serif !important"
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.85rem',
                    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontFamily: "'Basic', sans-serif !important"
                  }}
                />
              </ListItem>
            ) : (
              <ListItem
                button
                onClick={() => { handleLoginClick(); handleDrawerToggle(); }}
                sx={{
                  bgcolor: isDarkMode ? 'rgba(244, 197, 66, 0.1)' : 'rgba(202, 96, 20, 0.1)',
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  mb: 1,
                  color: isDarkMode ? '#f4c542' : '#ca6014',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(244, 197, 66, 0.2)' : 'rgba(202, 96, 20, 0.15)',
                  }
                }}
              >
                <PersonOutlineIcon sx={{ mr: 2, fontSize: 28 }} />
                <ListItemText
                  primary="Login / Sign Up"
                  primaryTypographyProps={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    fontFamily: "'Basic', sans-serif !important"
                  }}
                />
              </ListItem>
            )}
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={searchDrawerOpen}
        onClose={closeSearchDrawer}
        ModalProps={{ disableScrollLock: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: { xs: '100%', sm: 400 },
            maxWidth: '100%',
            bgcolor: isDarkMode ? 'var(--bg-primary)' : '#ffffff',
            borderLeft: isDarkMode ? '1px solid var(--border-color)' : '1px solid #e5e7eb',
          },
        }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pb: 0.8, borderBottom: isDarkMode ? '2px solid var(--border-color)' : '2px solid #e5e7eb' }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Basic', sans-serif !important",
                fontWeight: 500,
                fontSize: { xs: '1.6rem', sm: '1.8rem' },
                color: isDarkMode ? '#ffffff' : '#2B2828',
                letterSpacing: '0.5px',
              }}
            >
              Search Recipes
            </Typography>
            <IconButton
              onClick={closeSearchDrawer}
              sx={{
                color: isDarkMode ? '#aaa' : '#666',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#ca6014',
                  bgcolor: isDarkMode ? 'rgba(202, 96, 20, 0.1)' : 'rgba(202, 96, 20, 0.05)',
                  transform: 'rotate(90deg)',
                }
              }}
              aria-label="Close search"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flex: 1,
            }}
          >
            {searchTags.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isDarkMode ? 'rgba(202, 96, 20, 0.1)' : 'rgba(202, 96, 20, 0.05)',
                  border: isDarkMode ? '1px solid rgba(202, 96, 20, 0.3)' : '1px solid rgba(202, 96, 20, 0.2)',
                }}
              >
                {searchTags.map((tag, index) => {
                  const tagText = tag.displayText || tag.text || tag.name || tag;
                  const tagType = tag.type || 'recipe';
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1.5,
                        bgcolor: tagType === 'ingredient'
                          ? (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                          : tagType === 'category'
                            ? (isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)')
                            : tagType === 'subCategory'
                              ? (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                              : tagType === 'keyword'
                                ? (isDarkMode ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)')
                                : (isDarkMode ? 'rgba(202, 96, 20, 0.15)' : 'rgba(202, 96, 20, 0.1)'),
                        border: tagType === 'ingredient'
                          ? (isDarkMode ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)')
                          : tagType === 'category'
                            ? (isDarkMode ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(139, 92, 246, 0.3)')
                            : tagType === 'subCategory'
                              ? (isDarkMode ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(245, 158, 11, 0.3)')
                              : tagType === 'keyword'
                                ? (isDarkMode ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(236, 72, 153, 0.3)')
                                : (isDarkMode ? '1px solid rgba(202, 96, 20, 0.4)' : '1px solid rgba(202, 96, 20, 0.3)'),
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        fontFamily: "'Basic', sans-serif !important",
                      }}
                    >
                      <span style={{
                        color: tagType === 'ingredient'
                          ? (isDarkMode ? '#6ee7b7' : '#10b981')
                          : tagType === 'category'
                            ? (isDarkMode ? '#a78bfa' : '#8b5cf6')
                            : tagType === 'subCategory'
                              ? (isDarkMode ? '#fbbf24' : '#f59e0b')
                              : tagType === 'keyword'
                                ? (isDarkMode ? '#f472b6' : '#db2777')
                                : (isDarkMode ? '#fb923c' : '#ca6014')
                      }}>{tagText}</span>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveTag(tag)}
                        sx={{
                          p: 0.25,
                          color: tagType === 'ingredient'
                            ? (isDarkMode ? '#6ee7b7' : '#10b981')
                            : tagType === 'category'
                              ? (isDarkMode ? '#a78bfa' : '#8b5cf6')
                              : tagType === 'subCategory'
                                ? (isDarkMode ? '#fbbf24' : '#f59e0b')
                                : tagType === 'keyword'
                                  ? (isDarkMode ? '#f472b6' : '#db2777')
                                  : (isDarkMode ? '#fb923c' : '#ca6014'),
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          },
                        }}
                        aria-label={`Remove ${tagText}`}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                border: isDarkMode ? '1px solid var(--border-color)' : '1px solid #e0e0e0',
                bgcolor: isDarkMode ? 'var(--bg-secondary)' : '#f8f9fa',
                '&:focus-within': {
                  borderColor: '#ca6014',
                  boxShadow: '0 0 0 2px rgba(202, 96, 20, 0.2)',
                },
              }}
            >
              <SearchIcon sx={{ color: '#ca6014', fontSize: 24 }} />
              <InputBase
                id="search-input-field"
                placeholder="Search dish name..."
                value={searchInputValue}
                onChange={handleSearchInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (searchInputValue.trim() || searchTags.length > 0)) {
                    handleSearchSubmit(e);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                  } else if (e.key === 'Backspace' && !searchInputValue && searchTags.length > 0) {
                    setSearchTags(prev => prev.slice(0, -1));
                  }
                }}
                fullWidth
                sx={{
                  fontFamily: "'Basic', sans-serif !important",
                  fontSize: '1rem',
                  color: isDarkMode ? '#FFF7EC' : '#2B2828',
                  '& .MuiInputBase-input::placeholder': {
                    opacity: 0.8,
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                  },
                }}
                inputProps={{ 'aria-label': 'Search recipes', ref: searchInputRef }}
              />
              <IconButton
                type="submit"
                onClick={handleSearchSubmit}
                disabled={!searchInputValue.trim() && searchTags.length === 0}
                sx={{
                  color: '#ca6014',
                  bgcolor: 'rgba(202, 96, 20, 0.12)',
                  '&:hover': { bgcolor: 'rgba(202, 96, 20, 0.2)' },
                  '&.Mui-disabled': {
                    color: isDarkMode ? '#555' : '#ccc',
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  },
                }}
                aria-label="Search"
              >
                <ArrowForwardIcon sx={{ transform: 'rotate(-45deg)' }} />
              </IconButton>
            </Box>

            {showSuggestionsDropdown && sortedSuggestions.length > 0 && (
              <Box
                sx={{
                  backgroundColor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
                  border: isDarkMode ? '1px solid var(--border-color)' : '1px solid #e0e0e0',
                  borderTop: 'none',
                  borderBottomLeftRadius: 2,
                  borderBottomRightRadius: 2,
                  maxHeight: '350px',
                  overflowY: 'auto',
                  boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.1)',
                }}
              >
                {sortedSuggestions.map((suggestion, idx) => (
                  <Box
                    key={`${suggestion.type}-${suggestion.id || idx}`}
                    onClick={() => {
                      handleSuggestionClick(suggestion);
                    }}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: idx < sortedSuggestions.length - 1 ? isDarkMode ? '1px solid var(--border-color)' : '1px solid #f0f0f0' : 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(202, 96, 20, 0.15)' : '#f8f9fa',
                      },
                      transition: 'background-color 0.2s ease',
                      color: isDarkMode ? '#FFF7EC' : '#2B2828',
                      fontFamily: "'Basic', sans-serif !important",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 16, color: '#ca6014', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      {suggestion.displayText || suggestion.text || suggestion.name}
                    </Box>
                    <Box
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: suggestion.type === 'ingredient' ? '#10b981' :
                          suggestion.type === 'category' ? '#8b5cf6' :
                            suggestion.type === 'subCategory' ? '#f59e0b' :
                              suggestion.type === 'keyword' ? '#db2777' :
                                '#ca6014',
                        backgroundColor: suggestion.type === 'ingredient' ? 'rgba(16, 185, 129, 0.1)' :
                          suggestion.type === 'category' ? 'rgba(139, 92, 246, 0.1)' :
                            suggestion.type === 'subCategory' ? 'rgba(245, 158, 11, 0.1)' :
                              suggestion.type === 'keyword' ? 'rgba(236, 72, 153, 0.1)' :
                                'rgba(202, 96, 20, 0.1)',
                        px: 1.2,
                        py: 0.4,
                        borderRadius: 1,
                        flexShrink: 0,
                      }}
                    >
                      {suggestion.type === 'ingredient' ? 'Ingredient' :
                        suggestion.type === 'category' ? 'Category' :
                          suggestion.type === 'subCategory' ? 'Sub-Cat' :
                            suggestion.type === 'keyword' ? 'Keyword' :
                              'Recipe'}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ mt: -0.5, mb: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  fontStyle: 'italic',
                  fontFamily: "'Basic', sans-serif !important",
                }}
              >
                <span style={{ fontStyle: 'normal' }}>💡</span> Tip: Type comma (,) to add multiple items
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  mb: 1.5,
                  fontFamily: "'Basic', sans-serif !important",
                }}
              >
                Popular Searches
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                {['Biryani', 'Paneer', 'Dhal', 'Bread', 'Curry'].map((suggestion) => (
                  <Box
                    key={suggestion}
                    onClick={() => {
                      setSearchInputValue(suggestion);
                    }}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isDarkMode ? 'rgba(202, 96, 20, 0.15)' : '#FFF8E7',
                      border: isDarkMode ? '1px solid rgba(202, 96, 20, 0.3)' : '1px solid #FFE5C3',
                      color: isDarkMode ? '#FFF7EC' : '#ca6014',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      fontFamily: "'Basic', sans-serif !important",
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(202, 96, 20, 0.25)' : '#FFD4A3',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 8px rgba(202, 96, 20, 0.2)',
                      },
                    }}
                  >
                    {suggestion}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      <NotificationsDialog 
        anchorEl={notificationAnchorEl} 
        onClose={() => setNotificationAnchorEl(null)} 
      />
    </>
  );
};

export default Navbar;