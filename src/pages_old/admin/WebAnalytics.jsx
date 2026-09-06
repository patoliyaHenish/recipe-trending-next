"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Autocomplete, TextField, FormControl, IconButton, Tooltip, Tabs, Tab, Switch, FormControlLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, InputAdornment } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import SearchIcon from '@mui/icons-material/Search';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { useGetGa4DataQuery, useGetGa4TrendQuery, useGetGa4TopRecipesQuery, useGetGa4RealtimeDataQuery, useGetGa4RealtimeTrendQuery, useGetGa4RealtimeTopRecipesQuery } from '../../features/api/analyticsApi';
import { useGetRecipeCategoryDropdownQuery } from '../../features/api/categoryApi';
import { getImage } from '../../utils/helper';
import AccessDenied from '../../components/common/AccessDenied';
import { useSelector } from 'react-redux';
import {
  People,
  Person,
  Visibility,
  Description,
  Timer,
  Loop,
  PhoneIphone,
  Public,
  TouchApp,
  FlashOn,
  Refresh as RefreshIcon,
  Category,
  ViewList
} from '@mui/icons-material';
import { toast } from '../../utils/toast';

export default function WebAnalytics() {
  const { isDarkMode } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canView = isAdmin || user?.permissions?.includes('web_analytics.view');

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab === 'trend' ? 'trend' : 'kpi');

  useEffect(() => {
    if (urlTab === 'trend' || urlTab === 'kpi' || urlTab === 'recipes') {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue });
  };
  const [period, setPeriod] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState(moment().subtract(7, 'days'));
  const [customEndDate, setCustomEndDate] = useState(moment());

  const [isRealtime, setIsRealtime] = useState(false);

  const histDataRes = useGetGa4DataQuery({
    period,
    startDate: period === 'custom' && customStartDate ? customStartDate.format('YYYY-MM-DD') : undefined,
    endDate: period === 'custom' && customEndDate ? customEndDate.format('YYYY-MM-DD') : undefined,
  }, { skip: isRealtime });

  const rtDataRes = useGetGa4RealtimeDataQuery(undefined, { skip: !isRealtime });

  const data = isRealtime ? rtDataRes.data : histDataRes.data;
  const isLoading = isRealtime ? rtDataRes.isLoading : histDataRes.isLoading;
  const isError = isRealtime ? rtDataRes.isError : histDataRes.isError;
  const error = isRealtime ? rtDataRes.error : histDataRes.error;
  const isFetching = isRealtime ? rtDataRes.isFetching : histDataRes.isFetching;
  const refetch = isRealtime ? rtDataRes.refetch : histDataRes.refetch;

  const histTrendRes = useGetGa4TrendQuery({
    period,
    startDate: period === 'custom' && customStartDate ? customStartDate.format('YYYY-MM-DD') : undefined,
    endDate: period === 'custom' && customEndDate ? customEndDate.format('YYYY-MM-DD') : undefined,
  }, { skip: activeTab !== 'trend' || isRealtime });

  const rtTrendRes = useGetGa4RealtimeTrendQuery(undefined, { skip: activeTab !== 'trend' || !isRealtime });

  const trendData = isRealtime ? rtTrendRes.data : histTrendRes.data;
  const isTrendLoading = isRealtime ? rtTrendRes.isLoading : histTrendRes.isLoading;
  const isTrendFetching = isRealtime ? rtTrendRes.isFetching : histTrendRes.isFetching;
  const refetchTrend = isRealtime ? rtTrendRes.refetch : histTrendRes.refetch;

  const [recipeCategory, setRecipeCategory] = useState('All');
  const [recipeSubCategory, setRecipeSubCategory] = useState('All');
  const [recipeDevice, setRecipeDevice] = useState('All');
  const [recipeSearch, setRecipeSearch] = useState('');

  const histRecipesRes = useGetGa4TopRecipesQuery({
    period,
    startDate: period === 'custom' && customStartDate ? customStartDate.format('YYYY-MM-DD') : undefined,
    endDate: period === 'custom' && customEndDate ? customEndDate.format('YYYY-MM-DD') : undefined,
    category: recipeCategory !== 'All' ? recipeCategory : undefined,
    subCategory: recipeSubCategory !== 'All' ? recipeSubCategory : undefined,
    device: recipeDevice !== 'All' ? recipeDevice : undefined
  }, { skip: activeTab !== 'recipes' || isRealtime });

  const rtRecipesRes = useGetGa4RealtimeTopRecipesQuery({
    device: recipeDevice !== 'All' ? recipeDevice : undefined
  }, { skip: activeTab !== 'recipes' || !isRealtime });

  const topRecipesRes = isRealtime ? rtRecipesRes.data : histRecipesRes.data;
  const isTopRecipesLoading = isRealtime ? rtRecipesRes.isLoading : histRecipesRes.isLoading;
  const isTopRecipesFetching = isRealtime ? rtRecipesRes.isFetching : histRecipesRes.isFetching;
  const refetchTopRecipes = isRealtime ? rtRecipesRes.refetch : histRecipesRes.refetch;

  const { data: categoriesData } = useGetRecipeCategoryDropdownQuery();

  const allSubCategories = categoriesData?.data?.flatMap(cat => (cat.sub_categories || []).map(sub => ({
    ...sub,
    category_id: cat.category_id,
    category_name: cat.name
  }))) || [];

  const filteredSubCategories = allSubCategories.filter(sc => recipeCategory === 'All' || sc.category_id === recipeCategory);

  const topRecipesData = topRecipesRes?.data || [];

  const filteredTopRecipesData = React.useMemo(() => {
    let data = topRecipesData;
    if (recipeSearch) {
      data = data.filter(row => row.title?.toLowerCase().includes(recipeSearch.toLowerCase()));
    }
    return data.slice(0, 20);
  }, [topRecipesData, recipeSearch]);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [graphInterval, setGraphInterval] = useState('daily');
  const [selectedMetric, setSelectedMetric] = useState('totalUsers');

  const groupedChartData = React.useMemo(() => {
    let rawData = [...(trendData?.data || [])];
    // In realtime mode, data uses "X mins ago" labels — skip date grouping entirely
    if (isRealtime || graphInterval === 'daily') return rawData;

    const grouped = {};
    rawData.forEach(row => {
      const date = moment(row.dimensionValue);
      let key = row.dimensionValue;
      if (graphInterval === 'weekly') {
        key = date.startOf('isoWeek').format('YYYY-MM-DD');
      } else if (graphInterval === 'monthly') {
        key = date.startOf('month').format('YYYY-MM-DD');
      }
      if (!grouped[key]) {
        grouped[key] = { dimensionValue: key, totalUsers: 0, activeUsers: 0, pageViews: 0, sessions: 0, recipeViews: 0 };
      }
      grouped[key].totalUsers += (row.totalUsers || 0);
      grouped[key].activeUsers += (row.activeUsers || 0);
      grouped[key].pageViews += (row.pageViews || 0);
      grouped[key].sessions += (row.sessions || 0);
      grouped[key].recipeViews += (row.recipeViews || 0);
    });
    return Object.values(grouped);
  }, [trendData, graphInterval, isRealtime]);

  let METRICS_OPTIONS = [
    { label: '👥 Users', value: 'totalUsers', color: '#7367f0' },
    { label: '🟢 Active Users', value: 'activeUsers', color: '#28c76f' },
    { label: '🔄 Sessions', value: 'sessions', color: '#FF6B6B' },
    { label: '📄 Page Views', value: 'pageViews', color: '#ea5455' },
    { label: '🍲 Recipe Views', value: 'recipeViews', color: '#ff9f43' }
  ];

  if (isRealtime) {
    METRICS_OPTIONS = METRICS_OPTIONS.filter(m => m.value !== 'sessions');
  }

  const selectedMetricObj = METRICS_OPTIONS.find(m => m.value === selectedMetric) || METRICS_OPTIONS[0];

  const handleManualRefresh = async () => {
    let success = false;
    if (activeTab === 'kpi') {
      const result = await refetch();
      if (result.data) success = true;
    } else if (activeTab === 'trend') {
      const result = await refetchTrend();
      if (result.data) success = true;
    } else if (activeTab === 'recipes') {
      const result = await refetchTopRecipes();
      if (result.data) success = true;
    }

    if (success) {
      toast.success('Analytics data refreshed successfully!');
    } else {
      toast.error('Failed to refresh analytics data.');
    }
  };

  const handleAutoRefresh = async () => {
    let success = false;
    if (activeTab === 'kpi') {
      const result = await refetch();
      if (result.data) success = true;
    } else if (activeTab === 'trend') {
      const result = await refetchTrend();
      if (result.data) success = true;
    } else if (activeTab === 'recipes') {
      const result = await refetchTopRecipes();
      if (result.data) success = true;
    }

    if (success) {
      toast.success('Analytics auto-refreshed successfully!', { autoClose: 3000 });
    } else {
      toast.error('Failed to auto-refresh analytics data.');
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
    document.title = 'Web Analytics';
  }, []);

  if (!canView) {
    return <AccessDenied message="You do not have permission to view Web Analytics." />;
  }

  const stats = data?.data || {};

  const KPI_CARDS = [
    {
      key: 'totalUsers',
      label: 'Users',
      icon: <People sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)',
      lightBg: '#ede9fe',
      realtimeSupported: false,
    },
    {
      key: 'activeUsers',
      label: 'Active Users (Now)',
      icon: <Person sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #28c76f 0%, #5ddb8c 100%)',
      lightBg: '#d1fae5',
      realtimeSupported: true,
    },
    {
      key: 'pageViews',
      label: 'Page Views (Last 30m)',
      icon: <Description sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #ea5455 0%, #f07b7b 100%)',
      lightBg: '#fee2e2',
      realtimeSupported: true,
    },
    {
      key: 'recipeViews',
      label: 'Recipe Views',
      icon: <Visibility sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #ff9f43 0%, #ffb976 100%)',
      lightBg: '#fef3c7',
      realtimeSupported: false,
    },
    {
      key: 'categoryPageViews',
      label: 'Category Views',
      icon: <Category sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #00cfe8 0%, #46e2f1 100%)',
      lightBg: '#e0f9fc',
      realtimeSupported: false,
    },
    {
      key: 'subCategoryPageViews',
      label: 'Subcategory Views',
      icon: <ViewList sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #e83e8c 0%, #f16ba7 100%)',
      lightBg: '#fce3ef',
      realtimeSupported: false,
    },
    {
      key: 'avgSessionDuration',
      label: 'Avg. Engagement Time',
      icon: <Timer sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #00cfe8 0%, #46e3f7 100%)',
      lightBg: '#dcf6f9',
      realtimeSupported: false,
    },
    {
      key: 'sessions',
      label: 'Sessions',
      icon: <Loop sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8B 100%)',
      lightBg: '#ffe5e5',
      realtimeSupported: false,
    },
    {
      key: 'mobilePercentage',
      label: 'Mobile %',
      icon: <PhoneIphone sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      lightBg: '#ede9fe',
      realtimeSupported: false,
    },
    {
      key: 'topCountry',
      label: 'Top Country',
      icon: <Public sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      lightBg: '#fef3c7',
      realtimeSupported: false,
    },
    {
      key: 'eventCount',
      label: 'Event Count',
      icon: <TouchApp sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
      lightBg: '#fce7f3',
      realtimeSupported: false,
    },
    {
      key: 'realtimeUsers',
      label: 'Active Users (Last 30m)',
      icon: <FlashOn sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      lightBg: '#fee2e2',
      realtimeSupported: false,
    },
  ];

  const visibleKpiCards = isRealtime ? KPI_CARDS.filter(c => c.realtimeSupported) : KPI_CARDS;

  return (
    <Box className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full">
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
              Web Analytics (GA4)
            </Typography>
          </Box>
          <Box className="flex items-center gap-4">
            <FormControlLabel
              control={
                <Switch
                  checked={isRealtime}
                  onChange={(e) => setIsRealtime(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Typography sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontSize: '0.9rem', fontWeight: 500 }}>
                  Live Mode
                </Typography>
              }
            />
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
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleManualRefresh} disabled={isFetching || isTrendFetching || isTopRecipesFetching} sx={{ color: isDarkMode ? '#a5b4fc' : '#7367f0', bgcolor: isDarkMode ? 'rgba(115,103,240,0.12)' : '#ede9fe', '&:hover': { bgcolor: isDarkMode ? 'rgba(115,103,240,0.2)' : '#e0d8ff' } }}>
                <RefreshIcon className={(isFetching || isTrendFetching || isTopRecipesFetching) ? "animate-spin" : ""} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-2" sx={{ borderBottom: 1, borderColor: 'divider', width: '100%', px: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: 'auto' }, maxWidth: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: '38px',
                '& .MuiTab-root': {
                  minHeight: '38px',
                  textTransform: 'none',
                  color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  px: 3,
                  '&.Mui-selected': {
                    color: '#7367f0',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#7367f0',
                }
              }}
            >
              <Tab label="Top KPI cards" value="kpi" />
              <Tab label="Traffic Trend" value="trend" />
              <Tab label="Top Recipes" value="recipes" />
            </Tabs>
          </Box>

          <Box className="pb-[6px] flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <Autocomplete
                size="small"
                options={[
                  { label: 'Today', value: 'today' },
                  { label: 'Last 7 days', value: '7d' },
                  { label: 'Last 28 days', value: '28d' },
                  { label: 'Last 3 months', value: '90d' },
                  { label: 'Custom Range', value: 'custom' }
                ]}
                getOptionLabel={(option) => option.label || ''}
                value={
                  [
                    { label: 'Today', value: 'today' },
                    { label: 'Last 7 days', value: '7d' },
                    { label: 'Last 28 days', value: '28d' },
                    { label: 'Last 3 months', value: '90d' },
                    { label: 'Custom Range', value: 'custom' }
                  ].find(opt => opt.value === period) || { label: 'Last 7 days', value: '7d' }
                }
                onChange={(_, newValue) => {
                  setPeriod(newValue ? newValue.value : '7d');
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Period"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        bgcolor: isDarkMode ? '#283046' : '#fff',
                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                        '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                        '&:hover fieldset': { borderColor: '#7367f0' },
                        '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                      },
                      '& .MuiInputBase-input': {
                        padding: '8px 14px !important',
                        height: 'auto',
                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                        '&::placeholder': {
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          opacity: 1,
                        }
                      }
                    }}
                  />
                )}
                disablePortal={true}
                disabled={isRealtime}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: isDarkMode ? '#283046' : '#ffffff',
                      color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                      borderRadius: '6px',
                      border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                      boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                      '& .MuiAutocomplete-listbox': {
                        padding: '0',
                        '& .MuiAutocomplete-option': {
                          fontSize: '0.9rem',
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          '&[aria-selected="true"]': {
                            bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                            color: '#7367f0 !important',
                            fontWeight: 500,
                            '&.Mui-focused': {
                              bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                            }
                          },
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                            color: '#7367f0 !important'
                          },
                          '&.Mui-focused': {
                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                            color: '#7367f0 !important'
                          }
                        }
                      }
                    }
                  }
                }}
              />
            </FormControl>
            {period === 'custom' && (
              <Box className="flex items-center gap-3">
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  value={customStartDate ? customStartDate.format('YYYY-MM-DD') : ''}
                  onChange={(e) => setCustomStartDate(e.target.value ? moment(e.target.value) : null)}
                  disabled={isRealtime}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: 155,
                    '& .MuiOutlinedInput-root': {
                      height: 38,
                      bgcolor: isDarkMode ? '#283046' : '#fff',
                      color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                      '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                      '&:hover fieldset': { borderColor: '#7367f0' },
                      '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                    },
                    '& input': {
                      padding: '8px 14px',
                      color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                      WebkitTextFillColor: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                    },
                    '& input::-webkit-calendar-picker-indicator': {
                      filter: isDarkMode ? 'invert(1) brightness(1.5)' : 'none',
                      cursor: 'pointer'
                    },
                    '& .MuiInputLabel-root': { color: isDarkMode ? '#b4b7bd' : '#6e6b7b', transform: 'translate(14px, 10px) scale(1)', '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' } }
                  }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  value={customEndDate ? customEndDate.format('YYYY-MM-DD') : ''}
                  onChange={(e) => setCustomEndDate(e.target.value ? moment(e.target.value) : null)}
                  disabled={isRealtime}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: customStartDate ? customStartDate.format('YYYY-MM-DD') : undefined
                  }}
                  sx={{
                    width: 155,
                    '& .MuiOutlinedInput-root': {
                      height: 38,
                      bgcolor: isDarkMode ? '#283046' : '#fff',
                      color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                      '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                      '&:hover fieldset': { borderColor: '#7367f0' },
                      '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                    },
                    '& input': {
                      padding: '8px 14px',
                      color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                      WebkitTextFillColor: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                    },
                    '& input::-webkit-calendar-picker-indicator': {
                      filter: isDarkMode ? 'invert(1) brightness(1.5)' : 'none',
                      cursor: 'pointer'
                    },
                    '& .MuiInputLabel-root': { color: isDarkMode ? '#b4b7bd' : '#6e6b7b', transform: 'translate(14px, 10px) scale(1)', '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' } }
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ p: { xs: 3, sm: 4 }, flex: 1 }}>
          {isLoading || isFetching ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <CircularProgress size={40} sx={{ color: '#7367f0' }} />
            </Box>
          ) : isError ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <Typography color="error">Failed to load analytics data. Check server logs.</Typography>
            </Box>
          ) : activeTab === 'kpi' ? (
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
              {visibleKpiCards.map((card) => {
                const rawValue = stats[card.key] ?? '0';
                let value = rawValue;

                if (card.key === 'mobilePercentage') {
                  value = `${rawValue}%`;
                } else if (card.key === 'avgSessionDuration') {
                  const totalSeconds = parseFloat(rawValue) || 0;
                  if (totalSeconds > 0) {
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = Math.floor(totalSeconds % 60);
                    value = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                  } else {
                    value = '0s';
                  }
                }

                return (
                  <Box
                    key={card.key}
                    className="dashboard-kpi-card"
                    sx={{
                      position: 'relative',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: isDarkMode ? '#1a1d27' : card.lightBg,
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <Box sx={{ height: 4, width: '100%', background: card.gradient }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: { xs: 2.5, sm: 3 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 52,
                          height: 52,
                          borderRadius: '8px',
                          background: isDarkMode ? 'rgba(115,103,240,0.12)' : card.gradient,
                          color: isDarkMode ? '#a5b4fc' : '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.5rem', sm: '1.8rem' },
                            color: isDarkMode ? '#e2e8f0' : '#1e293b',
                            lineHeight: 1.2,
                          }}
                        >
                          {value}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748b',
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
          ) : activeTab === 'trend' ? (
            <Box sx={{ width: '100%' }}>
              {(isTrendLoading || isTrendFetching) && groupedChartData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                  <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                </Box>
              ) : (
                <Box className="flex flex-col gap-6">
                  <Box className="flex justify-between items-center mb-4">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <Autocomplete
                        size="small"
                        options={METRICS_OPTIONS}
                        getOptionLabel={(option) => option.label || ''}
                        value={METRICS_OPTIONS.find(opt => opt.value === selectedMetric) || METRICS_OPTIONS[0]}
                        onChange={(_, newValue) => {
                          setSelectedMetric(newValue ? newValue.value : METRICS_OPTIONS[0].value);
                        }}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Metric"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                padding: '0 39px 0 0 !important',
                                height: 38,
                                bgcolor: isDarkMode ? '#283046' : '#fff',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                '&:hover fieldset': { borderColor: '#7367f0' },
                                '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 14px !important',
                                height: 'auto',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                '&::placeholder': {
                                  color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                  opacity: 1,
                                }
                              }
                            }}
                          />
                        )}
                        disablePortal={true}
                        slotProps={{
                          paper: {
                            sx: {
                              bgcolor: isDarkMode ? '#283046' : '#ffffff',
                              color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                              borderRadius: '6px',
                              border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                              boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                              '& .MuiAutocomplete-listbox': {
                                padding: '0',
                                '& .MuiAutocomplete-option': {
                                  fontSize: '0.9rem',
                                  color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                  '&[aria-selected="true"]': {
                                    bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                    color: '#7367f0 !important',
                                    fontWeight: 500,
                                    '&.Mui-focused': {
                                      bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                    }
                                  },
                                  '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                    color: '#7367f0 !important'
                                  },
                                  '&.Mui-focused': {
                                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                    color: '#7367f0 !important'
                                  }
                                }
                              }
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Autocomplete
                        size="small"
                        options={[
                          { label: 'Daily', value: 'daily' },
                          { label: 'Weekly', value: 'weekly' },
                          { label: 'Monthly', value: 'monthly' }
                        ]}
                        getOptionLabel={(option) => option.label || ''}
                        value={[
                          { label: 'Daily', value: 'daily' },
                          { label: 'Weekly', value: 'weekly' },
                          { label: 'Monthly', value: 'monthly' }
                        ].find(opt => opt.value === graphInterval) || { label: 'Daily', value: 'daily' }}
                        onChange={(_, newValue) => {
                          setGraphInterval(newValue ? newValue.value : 'daily');
                        }}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Interval"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                padding: '0 39px 0 0 !important',
                                height: 38,
                                bgcolor: isDarkMode ? '#283046' : '#fff',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                '&:hover fieldset': { borderColor: '#7367f0' },
                                '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 14px !important',
                                height: 'auto',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                '&::placeholder': {
                                  color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                  opacity: 1,
                                }
                              }
                            }}
                          />
                        )}
                        disablePortal={true}
                        slotProps={{
                          paper: {
                            sx: {
                              bgcolor: isDarkMode ? '#283046' : '#ffffff',
                              color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                              borderRadius: '6px',
                              border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                              boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                              '& .MuiAutocomplete-listbox': {
                                padding: '0',
                                '& .MuiAutocomplete-option': {
                                  fontSize: '0.9rem',
                                  color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                  '&[aria-selected="true"]': {
                                    bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                    color: '#7367f0 !important',
                                    fontWeight: 500,
                                    '&.Mui-focused': {
                                      bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                    }
                                  },
                                  '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                    color: '#7367f0 !important'
                                  },
                                  '&.Mui-focused': {
                                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                    color: '#7367f0 !important'
                                  }
                                }
                              }
                            }
                          }
                        }}
                      />
                    </FormControl>
                  </Box>
                  <Box sx={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={groupedChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#404656' : '#ebe9f1'} vertical={false} />
                        <XAxis
                          dataKey="dimensionValue"
                          tickFormatter={(tick) => {
                            if (isRealtime) return tick;
                            if (graphInterval === 'monthly') return moment(tick).format('MMM YYYY');
                            return moment(tick).format('MMM DD');
                          }}
                          stroke={isDarkMode ? '#b4b7bd' : '#6e6b7b'}
                          tick={{ fill: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke={selectedMetricObj.color}
                          tick={{ fill: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}
                        />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: isDarkMode ? '#283046' : '#fff', borderColor: isDarkMode ? '#404656' : '#d8d6de', color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }}
                          labelFormatter={(label) => {
                            if (isRealtime) return label;
                            if (graphInterval === 'weekly') {
                              const endOfWeek = moment(label).endOf('isoWeek');
                              return `${moment(label).format('MMM DD')} - ${endOfWeek.format('MMM DD, YYYY')}`;
                            }
                            if (graphInterval === 'monthly') return moment(label).format('MMMM YYYY');
                            return moment(label).format('dddd, MMM DD, YYYY');
                          }}
                        />
                        <Legend wrapperStyle={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey={selectedMetric}
                          name={selectedMetricObj.label.replace(/.*? /, '')}
                          stroke={selectedMetricObj.color}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </Box>
          ) : activeTab === 'recipes' ? (
            <Box sx={{ width: '100%' }}>
              <Box className="flex flex-wrap gap-4 mb-4">
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <Autocomplete
                    size="small"
                    options={[{ label: 'All Categories', value: 'All' }, ...(categoriesData?.data?.map(cat => ({ label: cat.name, value: cat.category_id })) || [])]}
                    getOptionLabel={(option) => option.label || ''}
                    value={[{ label: 'All Categories', value: 'All' }, ...(categoriesData?.data?.map(cat => ({ label: cat.name, value: cat.category_id })) || [])].find(opt => opt.value === recipeCategory) || { label: 'All Categories', value: 'All' }}
                    onChange={(_, newValue) => {
                      setRecipeCategory(newValue ? newValue.value : 'All');
                      setRecipeSubCategory('All');
                    }}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Category"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            padding: '0 39px 0 0 !important',
                            height: 38,
                            bgcolor: isDarkMode ? '#283046' : '#fff',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                            '&:hover fieldset': { borderColor: '#7367f0' },
                            '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                          },
                          '& .MuiInputBase-input': {
                            padding: '8px 14px !important',
                            height: 'auto',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '&::placeholder': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b', opacity: 1 }
                          }
                        }}
                      />
                    )}
                    disablePortal={true}
                    slotProps={{
                      paper: {
                        sx: {
                          bgcolor: isDarkMode ? '#283046' : '#ffffff',
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          borderRadius: '6px',
                          border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                          boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                          '& .MuiAutocomplete-listbox': {
                            padding: '0',
                            '& .MuiAutocomplete-option': {
                              fontSize: '0.9rem',
                              color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                              '&[aria-selected="true"]': { bgcolor: 'rgba(115, 103, 240, 0.12) !important', color: '#7367f0 !important', fontWeight: 500, '&.Mui-focused': { bgcolor: 'rgba(115, 103, 240, 0.16) !important' } },
                              '&:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' },
                              '&.Mui-focused': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' }
                            }
                          }
                        }
                      }
                    }}
                  />
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <Autocomplete
                    size="small"
                    options={[{ label: 'All Subcategories', value: 'All' }, ...filteredSubCategories.map(sc => ({ label: sc.name, value: sc.sub_category_id }))]}
                    getOptionLabel={(option) => option.label || ''}
                    value={[{ label: 'All Subcategories', value: 'All' }, ...filteredSubCategories.map(sc => ({ label: sc.name, value: sc.sub_category_id }))].find(opt => opt.value === recipeSubCategory) || { label: 'All Subcategories', value: 'All' }}
                    onChange={(_, newValue) => {
                      setRecipeSubCategory(newValue ? newValue.value : 'All');
                    }}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Subcategory"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            padding: '0 39px 0 0 !important',
                            height: 38,
                            bgcolor: isDarkMode ? '#283046' : '#fff',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                            '&:hover fieldset': { borderColor: '#7367f0' },
                            '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                          },
                          '& .MuiInputBase-input': {
                            padding: '8px 14px !important',
                            height: 'auto',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '&::placeholder': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b', opacity: 1 }
                          }
                        }}
                      />
                    )}
                    disablePortal={true}
                    slotProps={{
                      paper: {
                        sx: {
                          bgcolor: isDarkMode ? '#283046' : '#ffffff',
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          borderRadius: '6px',
                          border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                          boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                          '& .MuiAutocomplete-listbox': {
                            padding: '0',
                            '& .MuiAutocomplete-option': {
                              fontSize: '0.9rem',
                              color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                              '&[aria-selected="true"]': { bgcolor: 'rgba(115, 103, 240, 0.12) !important', color: '#7367f0 !important', fontWeight: 500, '&.Mui-focused': { bgcolor: 'rgba(115, 103, 240, 0.16) !important' } },
                              '&:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' },
                              '&.Mui-focused': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' }
                            }
                          }
                        }
                      }
                    }}
                  />
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Autocomplete
                    size="small"
                    options={[
                      { label: 'All Devices', value: 'All' },
                      { label: 'Mobile', value: 'Mobile' },
                      { label: 'Desktop', value: 'Desktop' },
                      { label: 'Tablet', value: 'Tablet' }
                    ]}
                    getOptionLabel={(option) => option.label || ''}
                    value={[
                      { label: 'All Devices', value: 'All' },
                      { label: 'Mobile', value: 'Mobile' },
                      { label: 'Desktop', value: 'Desktop' },
                      { label: 'Tablet', value: 'Tablet' }
                    ].find(opt => opt.value === recipeDevice) || { label: 'All Devices', value: 'All' }}
                    onChange={(_, newValue) => {
                      setRecipeDevice(newValue ? newValue.value : 'All');
                    }}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Device"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            padding: '0 39px 0 0 !important',
                            height: 38,
                            bgcolor: isDarkMode ? '#283046' : '#fff',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                            '&:hover fieldset': { borderColor: '#7367f0' },
                            '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                          },
                          '& .MuiInputBase-input': {
                            padding: '8px 14px !important',
                            height: 'auto',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '&::placeholder': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b', opacity: 1 }
                          }
                        }}
                      />
                    )}
                    disablePortal={true}
                    slotProps={{
                      paper: {
                        sx: {
                          bgcolor: isDarkMode ? '#283046' : '#ffffff',
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          borderRadius: '6px',
                          border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                          boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                          '& .MuiAutocomplete-listbox': {
                            padding: '0',
                            '& .MuiAutocomplete-option': {
                              fontSize: '0.9rem',
                              color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                              '&[aria-selected="true"]': { bgcolor: 'rgba(115, 103, 240, 0.12) !important', color: '#7367f0 !important', fontWeight: 500, '&.Mui-focused': { bgcolor: 'rgba(115, 103, 240, 0.16) !important' } },
                              '&:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' },
                              '&.Mui-focused': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' }
                            }
                          }
                        }
                      }
                    }}
                  />
                </FormControl>
              </Box>
              <Box className="flex flex-wrap gap-4 mb-4">
                <FormControl size="small" sx={{ minWidth: 300, flexGrow: 1, maxWidth: 400 }}>
                  <TextField
                    size="small"
                    placeholder="Search Recipes..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: 38,
                        bgcolor: isDarkMode ? '#283046' : '#fff',
                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                        '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                        '&:hover fieldset': { borderColor: '#7367f0' },
                        '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                      },
                      '& .MuiInputBase-input': {
                        padding: '8px 14px !important',
                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                        '&::placeholder': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b', opacity: 1 }
                      }
                    }}
                  />
                </FormControl>
              </Box>
              {(isTopRecipesLoading || isTopRecipesFetching) && topRecipesData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                  <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: isDarkMode ? '#283046' : '#fff', boxShadow: 'none', border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, borderRadius: '6px' }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(115,103,240,0.12)' : '#f3f2f7' }}>
                      <TableRow>
                        <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>Rank</TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>Recipe</TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>Device</TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }} align="right">Views</TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }} align="right">Users</TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }} align="right">Avg. Time</TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontWeight: 600 }} align="right">Related Clicks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTopRecipesData.map((row, index) => {
                        const minutes = Math.floor(row.avgTime / 60);
                        const seconds = Math.floor(row.avgTime % 60);
                        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

                        return (
                          <TableRow key={row.slug} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 }, borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>
                            <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>{index + 1}</TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
                              <Box className="flex items-center gap-3">
                                <Box
                                  component="img"
                                  src={getImage(row.image)}
                                  alt={row.title}
                                  sx={{
                                    width: 64,
                                    height: 36,
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    flexShrink: 0
                                  }}
                                />
                                <Box className="flex flex-col">
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#d0d2d6' : '#5e5873' }}>
                                    {row.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                                    {row.category} {row.subCategory ? `> ${row.subCategory}` : ''}
                                  </Typography>
                                </Box>
                                <IconButton size="small" component="a" href={`/${row.slug}`} target="_blank" sx={{ color: '#7367f0', ml: 1 }}>
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, textTransform: 'capitalize' }}>{row.device}</TableCell>
                            <TableCell align="right" sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>{row.views}</TableCell>
                            <TableCell align="right" sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>{row.users}</TableCell>
                            <TableCell align="right" sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', borderRight: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>{timeStr}</TableCell>
                            <TableCell align="right" sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }}>{row.relatedClicks}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredTopRecipesData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }}>
                            No recipes found for the selected criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
