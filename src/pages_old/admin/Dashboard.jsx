"use client";

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, IconButton, Switch, FormControlLabel, Tooltip, Collapse } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';
import { useGetDashboardStatsQuery } from '../../features/api/dashboardApi';
import AccessDenied from '../../components/common/AccessDenied';
import { useSelector } from 'react-redux';
import {
  RestaurantMenu,
  People,
  Category,
  SubdirectoryArrowRight,
  AssignmentInd,
  PendingActions,
  Today,
  Bookmark,
  AccessTime,
  Refresh as RefreshIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { toast } from '../../utils/toast';

const OverviewBox = ({ title, totalRecipes, approvedRecipes, pendingRecipes, uniqueUsers, isDarkMode, gradient = 'linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)' }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: '250px',
        borderRadius: '6px',
        backgroundColor: isDarkMode ? '#1a1d27' : '#f8f9fa',
        border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
        overflow: 'hidden',
        boxShadow: isDarkMode ? 'inset 0 2px 4px 0 rgba(0,0,0,0.1)' : 'inset 0 2px 4px 0 rgba(0,0,0,0.02)',
      }}
    >
      <Box
        sx={{
          height: 4,
          width: '100%',
          background: gradient,
        }}
      />
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 700 }}>
            {title}
          </Typography>
          <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ color: isDarkMode ? '#a5b4fc' : '#7367f0' }}>
            {collapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
          </IconButton>
        </Box>
        <Collapse in={!collapsed} timeout="auto" unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontWeight: 500, mb: 0.5 }}>Total recipes</Typography>
              <Typography variant="h4" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 700 }}>{totalRecipes ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontWeight: 500, mb: 0.5 }}>Approved recipes</Typography>
              <Typography variant="h4" sx={{ color: '#28c76f', fontWeight: 700 }}>{approvedRecipes ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontWeight: 500, mb: 0.5 }}>Pending recipes</Typography>
              <Typography variant="h4" sx={{ color: '#ea5455', fontWeight: 700 }}>{pendingRecipes ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontWeight: 500, mb: 0.5 }}>Users added recipes</Typography>
              <Typography variant="h4" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 700 }}>{uniqueUsers ?? 0}</Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

const KPI_CARDS = [
  {
    key: 'totalRecipes',
    label: 'Total Recipes',
    icon: <RestaurantMenu sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)',
    lightBg: '#ede9fe',
    lightText: '#7367f0',
  },
  {
    key: 'totalApprovedRecipesCount',
    label: 'Approved Recipes',
    icon: <RestaurantMenu sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #28c76f 0%, #5ddb8c 100%)',
    lightBg: '#d1fae5',
    lightText: '#28c76f',
  },
  {
    key: 'totalUsers',
    label: 'Total Users',
    icon: <People sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #28c76f 0%, #5ddb8c 100%)',
    lightBg: '#d1fae5',
    lightText: '#28c76f',
  },
  {
    key: 'totalCategories',
    label: 'Total Categories',
    icon: <Category sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #ff9f43 0%, #ffb976 100%)',
    lightBg: '#fef3c7',
    lightText: '#ff9f43',
  },
  {
    key: 'totalSubCategories',
    label: 'Total Sub-Categories',
    icon: <SubdirectoryArrowRight sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #ea5455 0%, #f07b7b 100%)',
    lightBg: '#fee2e2',
    lightText: '#ea5455',
  },
  {
    key: 'totalDataEntryUsers',
    label: 'Data Entry Users',
    icon: <AssignmentInd sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #00cfe8 0%, #46e3f7 100%)',
    lightBg: '#dcf6f9',
    lightText: '#00cfe8',
  },
  {
    key: 'pendingRecipesCount',
    label: 'Pending Recipes',
    icon: <PendingActions sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8B 100%)',
    lightBg: '#ffe5e5',
    lightText: '#FF6B6B',
  },
  {
    key: 'totalSavedRecipesCount',
    label: 'Saved Recipes',
    icon: <Bookmark sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    lightBg: '#ede9fe',
    lightText: '#8B5CF6',
  },
  {
    key: 'activeUsersOneHourCount',
    label: 'Active Users (1hr)',
    icon: <AccessTime sx={{ fontSize: 28 }} />,
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    lightBg: '#fef3c7',
    lightText: '#F59E0B',
  },
];

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canViewDashboard = isAdmin || userPermissions.includes('dashboard.view');
  const { data, isLoading, isError, error, refetch } = useGetDashboardStatsQuery();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  if (!canViewDashboard) {
    return <AccessDenied message="You do not have permission to view Dashboard." />;
  }

  const handleManualRefresh = async () => {
    const result = await refetch();
    if (result.data) {
      toast.success('Dashboard data refreshed successfully!');
    } else {
      toast.error('Failed to refresh dashboard data.');
    }
  };

  const handleAutoRefresh = async () => {
    const result = await refetch();
    if (result.data) {
      toast.success('Dashboard auto-refreshed successfully!', { autoClose: 3000 });
    } else {
      toast.error('Failed to auto-refresh dashboard data.');
    }
  };

  useEffect(() => {
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      setTimeLeft(10);
    }
    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  useEffect(() => {
    if (autoRefresh && timeLeft <= 0) {
      handleAutoRefresh();
      setTimeLeft(10);
    }
  }, [timeLeft, autoRefresh]);

  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

  const stats = data?.data || {};

  return (
    <Box className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full">
      {/* ── Card container ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '6px',
          backgroundColor: isDarkMode ? '#283046' : '#ffffff',
          overflow: 'hidden',
          boxShadow: isDarkMode
            ? '0 4px 24px 0 rgba(0,0,0,0.24)'
            : '0 4px 24px 0 rgba(34,41,47,0.1)',
        }}
      >
        {/* ── Card Header ── */}
        <Box
          className="flex flex-row justify-between items-center p-4 sm:p-5 border-b gap-4"
          sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
        >
          <Box className="flex items-center flex-wrap gap-2">
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                letterSpacing: '0.5px',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              Dashboard
            </Typography>
          </Box>
          <Box className="flex items-center gap-4">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontSize: '0.9rem', fontWeight: 500 }}>
                  {autoRefresh ? `Auto Refresh (${timeLeft}s)` : 'Auto Refresh (10s)'}
                </Typography>
              }
            />
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={handleManualRefresh} sx={{ color: isDarkMode ? '#a5b4fc' : '#7367f0', bgcolor: isDarkMode ? 'rgba(115,103,240,0.12)' : '#ede9fe', '&:hover': { bgcolor: isDarkMode ? 'rgba(115,103,240,0.2)' : '#e0d8ff' } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── Content Area ── */}
        <Box sx={{ p: { xs: 3, sm: 4 }, flex: 1 }}>
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300,
              }}
            >
              <CircularProgress size={40} sx={{ color: '#7367f0' }} />
            </Box>
          ) : isError ? (
            error?.status === 403 ? (
              <AccessDenied message="You do not have permission to view Dashboard." />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                }}
              >
                <Typography variant="body1">
                  Failed to load dashboard stats. Please try again later.
                </Typography>
              </Box>
            )
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 } }}>
              {/* ── Overviews Section ── */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: { xs: 3, sm: 4 },
                  flexWrap: 'wrap',
                }}
              >
                <OverviewBox
                  title="Today's Overview"
                  totalRecipes={stats.todaysRecipesCount}
                  approvedRecipes={stats.todaysApprovedRecipesCount}
                  pendingRecipes={stats.todaysPendingRecipesCount}
                  uniqueUsers={stats.todaysRecipeCreatorsCount}
                  isDarkMode={isDarkMode}
                  gradient="linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)"
                />
                <OverviewBox
                  title="Weekly Overview"
                  totalRecipes={stats.weeklyRecipesCount}
                  approvedRecipes={stats.weeklyApprovedRecipesCount}
                  pendingRecipes={stats.weeklyPendingRecipesCount}
                  uniqueUsers={stats.weeklyRecipeCreatorsCount}
                  isDarkMode={isDarkMode}
                  gradient="linear-gradient(135deg, #28c76f 0%, #5ddb8c 100%)"
                />
                <OverviewBox
                  title="15 Days Overview"
                  totalRecipes={stats.fifteenDaysRecipesCount}
                  approvedRecipes={stats.fifteenDaysApprovedRecipesCount}
                  pendingRecipes={stats.fifteenDaysPendingRecipesCount}
                  uniqueUsers={stats.fifteenDaysRecipeCreatorsCount}
                  isDarkMode={isDarkMode}
                  gradient="linear-gradient(135deg, #ff9f43 0%, #ffb976 100%)"
                />
                <OverviewBox
                  title="Monthly Overview"
                  totalRecipes={stats.monthlyRecipesCount}
                  approvedRecipes={stats.monthlyApprovedRecipesCount}
                  pendingRecipes={stats.monthlyPendingRecipesCount}
                  uniqueUsers={stats.monthlyRecipeCreatorsCount}
                  isDarkMode={isDarkMode}
                  gradient="linear-gradient(135deg, #00cfe8 0%, #46e3f7 100%)"
                />
              </Box>

              {/* ── KPI Grid ── */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    lg: '1fr 1fr 1fr 1fr',
                  },
                  gap: { xs: 3, sm: 4 },
                }}
              >
              {KPI_CARDS.map((card) => {
                const value = stats[card.key] ?? 0;
                return (
                  <Box
                    key={card.key}
                    className="dashboard-kpi-card"
                    sx={{
                      position: 'relative',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: isDarkMode
                        ? '#1a1d27'
                        : card.lightBg,
                      border: isDarkMode
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid rgba(0,0,0,0.08)',
                      cursor: 'default',
                    }}
                  >
                    {/* ── Colored accent bar at top ── */}
                    <Box
                      sx={{
                        height: 4,
                        width: '100%',
                        background: isDarkMode
                          ? card.gradient
                          : card.gradient,
                      }}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: { xs: 2.5, sm: 3 },
                      }}
                    >
                      {/* ── Icon ── */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 52,
                          height: 52,
                          borderRadius: '8px',
                          background: isDarkMode
                            ? 'rgba(115,103,240,0.12)'
                            : card.gradient,
                          color: isDarkMode
                            ? '#a5b4fc'
                            : '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {card.icon}
                      </Box>

                      {/* ── Value & Label ── */}
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.5rem', sm: '1.8rem' },
                            color: isDarkMode
                              ? '#e2e8f0'
                              : '#1e293b',
                            lineHeight: 1.2,
                          }}
                        >
                          {value.toLocaleString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: isDarkMode
                              ? '#64748b'
                              : '#64748b',
                            fontWeight: 500,
                            mt: 0.5,
                            fontSize: '0.85rem',
                          }}
                        >
                          {card.label}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

