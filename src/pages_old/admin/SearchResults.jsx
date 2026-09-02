"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Collapse,
    Button,
    Pagination,
    Autocomplete,
    TextField,
    Tabs,
    Tab,
    TableSortLabel,
    IconButton,
    Tooltip,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import MouseOutlinedIcon from '@mui/icons-material/MouseOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined';
import FilterCenterFocusOutlinedIcon from '@mui/icons-material/FilterCenterFocusOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import WebOutlinedIcon from '@mui/icons-material/WebOutlined';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { toast } from '../../utils/toast';
import { getImage } from '../../utils/helper';
import { useGetSearchResultsQuery } from '../../features/api/analyticsApi';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AccessDenied } from '../../components/common';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

const SearchResults = () => {
    const { isDarkMode } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canView = isAdmin || userPermissions.includes('search_console.view');

    const [period, setPeriod] = useState('7d');
    const [graphInterval, setGraphInterval] = useState('daily');
    const [searchParams, setSearchParams] = useSearchParams();
    const dimension = searchParams.get('dimension') || 'query';
    const setDimension = (newDimension) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('dimension', newDimension);
            return next;
        });
        setPage(1);
    };

    const [showFilters, setShowFilters] = useState(true);
    
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        document.title = 'Search Results Analytics';
    }, []);

    const [customStartDate, setCustomStartDate] = useState(moment().subtract(7, 'days'));
    const [customEndDate, setCustomEndDate] = useState(moment());
    
    const [selectedQuery, setSelectedQuery] = useState(null);

    const { data: searchResultsData, isLoading, isFetching, refetch } = useGetSearchResultsQuery({
        period,
        dimension,
        startDate: period === 'custom' && customStartDate ? customStartDate.format('YYYY-MM-DD') : undefined,
        endDate: period === 'custom' && customEndDate ? customEndDate.format('YYYY-MM-DD') : undefined,
    });

    const { data: relatedPagesResponse, isFetching: isFetchingRelated } = useGetSearchResultsQuery({
        period,
        dimension: 'page',
        startDate: period === 'custom' && customStartDate ? customStartDate.format('YYYY-MM-DD') : undefined,
        endDate: period === 'custom' && customEndDate ? customEndDate.format('YYYY-MM-DD') : undefined,
        queryFilter: selectedQuery,
    }, { skip: !selectedQuery });

    const relatedPages = useMemo(() => {
        return relatedPagesResponse?.data || [];
    }, [relatedPagesResponse]);

    const handleRefresh = async () => {
        try {
            const result = await refetch();
            if (result.isError) {
                toast.error("Failed to refresh data.");
            } else {
                toast.success("Data refreshed successfully!");
            }
        } catch (error) {
            toast.error("Failed to refresh data.");
        }
    };

    const allResults = useMemo(() => {
        if (dimension === 'overview') return [];
        const data = searchResultsData?.data;
        return Array.isArray(data) ? data : [];
    }, [searchResultsData, dimension]);

    const overviewData = useMemo(() => {
        if (dimension === 'overview') return searchResultsData?.data;
        if (dimension === 'date') {
            const data = searchResultsData?.data || [];
            if (!Array.isArray(data) || data.length === 0) return null;
            
            let totalClicks = 0;
            let totalImpressions = 0;
            let totalPositionSum = 0;

            data.forEach(row => {
                totalClicks += (row.clicks || 0);
                totalImpressions += (row.impressions || 0);
                totalPositionSum += ((row.position || 0) * (row.impressions || 0));
            });

            return {
                totalClicks,
                totalImpressions,
                avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
                avgPosition: totalImpressions > 0 ? totalPositionSum / totalImpressions : 0,
                // These are not available per date easily, so we fallback to 0 or leave empty
                totalQueries: 0,
                totalPages: 0,
            };
        }
        return null;
    }, [dimension, searchResultsData]);

    const groupedChartData = useMemo(() => {
        if (dimension !== 'date') return [];
        let data = [...allResults].reverse();
        if (graphInterval === 'daily') return data;

        const grouped = {};
        data.forEach(row => {
            const date = moment(row.dimensionValue);
            let key = row.dimensionValue;
            if (graphInterval === 'weekly') {
                key = date.startOf('isoWeek').format('YYYY-MM-DD');
            } else if (graphInterval === 'monthly') {
                key = date.startOf('month').format('YYYY-MM-DD');
            }
            if (!grouped[key]) {
                grouped[key] = { dimensionValue: key, clicks: 0, impressions: 0 };
            }
            grouped[key].clicks += (row.clicks || 0);
            grouped[key].impressions += (row.impressions || 0);
        });
        return Object.values(grouped);
    }, [allResults, dimension, graphInterval]);
    
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedResults = useMemo(() => {
        let sortableItems = [...allResults];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [allResults, sortConfig]);
    
    const pagination = useMemo(() => {
        const total = sortedResults.length;
        const totalPages = Math.ceil(total / limit) || 1;
        return { total, page, limit, totalPages };
    }, [sortedResults, page, limit]);

    const results = useMemo(() => {
        return sortedResults.slice((page - 1) * limit, page * limit);
    }, [sortedResults, page, limit]);

    const selectStyles = {
        height: 38,
        bgcolor: isDarkMode ? '#283046' : '#fff',
        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7367f0' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7367f0' },
        '& .MuiSvgIcon-root': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
    };

    const menuPropsStyles = {
        PaperProps: {
            sx: {
                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                borderRadius: '6px',
                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                '& .MuiMenuItem-root': {
                    fontSize: '0.9rem',
                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                    '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)',
                        color: '#7367f0',
                    },
                    '&.Mui-selected': {
                        bgcolor: 'rgba(115, 103, 240, 0.12)',
                        color: '#7367f0',
                        fontWeight: 500,
                        '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.16)' },
                    },
                },
            }
        }
    };



    if (!canView) {
        return <AccessDenied message="You do not have permission to view Search Console Analytics." />;
    }

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
                    boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                }}
            >
                {/* Header */}
                <Box
                    className="flex flex-wrap justify-between items-center p-4 sm:p-5 border-b gap-3"
                    sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
                >
                    <Box className="flex items-center gap-2">
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, color: isDarkMode ? '#e2e8f0' : '#1e293b', letterSpacing: '0.5px', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                        >
                            Search Console Analytics
                        </Typography>
                        <Tooltip title="Refresh Data" placement="top">
                            <IconButton 
                                onClick={handleRefresh} 
                                disabled={isFetching}
                                sx={{ 
                                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                    '&:hover': {
                                        color: '#7367f0',
                                        backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)'
                                    }
                                }}
                            >
                                <RefreshOutlinedIcon fontSize="small" className={isFetching ? "animate-spin" : ""} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                </Box>

                <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-2" sx={{ borderBottom: 1, borderColor: 'divider', width: '100%', px: 2 }}>
                    <Box sx={{ width: { xs: '100%', sm: 'auto' }, maxWidth: '100%' }}>
                        <Tabs 
                            value={dimension} 
                            onChange={(e, newValue) => setDimension(newValue)}
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
                            <Tab label="Query" value="query" component={Link} to="?dimension=query" />
                            <Tab label="Page" value="page" component={Link} to="?dimension=page" />
                            <Tab label="Country" value="country" component={Link} to="?dimension=country" />
                            <Tab label="Device" value="device" component={Link} to="?dimension=device" />
                            <Tab label="Overview" value="overview" component={Link} to="?dimension=overview" />
                            <Tab label="Performance Trend" value="date" component={Link} to="?dimension=date" />
                        </Tabs>
                    </Box>

                    <Box className="pb-[6px] flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
                        <FormControl size="small" sx={{ minWidth: 190 }}>
                            <Autocomplete
                                size="small"
                                options={[
                                    { label: 'Last 7 days', value: '7d' },
                                    { label: 'Last 28 days', value: '28d' },
                                    { label: 'Last 3 months', value: '90d' },
                                    { label: 'Custom Range', value: 'custom' }
                                ]}
                                getOptionLabel={(option) => option.label || ''}
                                value={
                                    [
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

                {dimension === 'overview' ? (
                    <Box sx={{ p: 3, flex: 1, backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}>
                        {(isLoading || isFetching) ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {[
                                    { title: 'Total Clicks', value: overviewData?.totalClicks?.toLocaleString() || '0', icon: <MouseOutlinedIcon sx={{ color: '#7367f0', fontSize: 32 }} />, color: 'rgba(115, 103, 240, 0.12)' },
                                    { title: 'Total Impressions', value: overviewData?.totalImpressions?.toLocaleString() || '0', icon: <VisibilityOutlinedIcon sx={{ color: '#00cfe8', fontSize: 32 }} />, color: 'rgba(0, 207, 232, 0.12)' },
                                    { title: 'Average CTR', value: `${((overviewData?.avgCtr || 0) * 100).toFixed(2)}%`, icon: <AdsClickOutlinedIcon sx={{ color: '#28c76f', fontSize: 32 }} />, color: 'rgba(40, 199, 111, 0.12)' },
                                    { title: 'Average Position', value: (overviewData?.avgPosition || 0).toFixed(2), icon: <FilterCenterFocusOutlinedIcon sx={{ color: '#ff9f43', fontSize: 32 }} />, color: 'rgba(255, 159, 67, 0.12)' },
                                    { title: 'Total Ranking Queries', value: overviewData?.totalQueries?.toLocaleString() || '0', icon: <SearchOutlinedIcon sx={{ color: '#ea5455', fontSize: 32 }} />, color: 'rgba(234, 84, 85, 0.12)' },
                                    { title: 'Pages Getting Traffic', value: overviewData?.totalPages?.toLocaleString() || '0', icon: <WebOutlinedIcon sx={{ color: '#82868b', fontSize: 32 }} />, color: 'rgba(130, 134, 139, 0.12)' }
                                ].map((stat, idx) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                                        <Card elevation={0} sx={{ border: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, bgcolor: 'transparent', borderRadius: '8px' }}>
                                            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3, '&:last-child': { pb: 3 } }}>
                                                <Box sx={{ bgcolor: stat.color, p: 1.5, borderRadius: '50%', mr: 2, display: 'flex' }}>
                                                    {stat.icon}
                                                </Box>
                                                <Box>
                                                    <Typography variant="h4" sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b', mb: 0.5 }}>
                                                        {stat.value}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 500 }}>
                                                        {stat.title}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                ) : dimension === 'date' ? (
                    <Box sx={{ p: 3, flex: 1, backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}>
                        {(isLoading || isFetching) ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                            </Box>
                        ) : (
                            <Box className="flex flex-col gap-6">
                                <Grid container spacing={3}>
                                    {[
                                        { title: 'Total Clicks', value: overviewData?.totalClicks?.toLocaleString() || '0', icon: <MouseOutlinedIcon sx={{ color: '#7367f0', fontSize: 32 }} />, color: 'rgba(115, 103, 240, 0.12)' },
                                        { title: 'Total Impressions', value: overviewData?.totalImpressions?.toLocaleString() || '0', icon: <VisibilityOutlinedIcon sx={{ color: '#00cfe8', fontSize: 32 }} />, color: 'rgba(0, 207, 232, 0.12)' },
                                        { title: 'Average CTR', value: `${((overviewData?.avgCtr || 0) * 100).toFixed(2)}%`, icon: <AdsClickOutlinedIcon sx={{ color: '#28c76f', fontSize: 32 }} />, color: 'rgba(40, 199, 111, 0.12)' },
                                        { title: 'Average Position', value: (overviewData?.avgPosition || 0).toFixed(2), icon: <FilterCenterFocusOutlinedIcon sx={{ color: '#ff9f43', fontSize: 32 }} />, color: 'rgba(255, 159, 67, 0.12)' },
                                    ].map((stat, idx) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                                            <Card elevation={0} sx={{ border: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, bgcolor: 'transparent', borderRadius: '8px' }}>
                                                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3, '&:last-child': { pb: 3 } }}>
                                                    <Box sx={{ bgcolor: stat.color, p: 1.5, borderRadius: '50%', mr: 2, display: 'flex' }}>
                                                        {stat.icon}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="h4" sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b', mb: 0.5 }}>
                                                            {stat.value}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 500 }}>
                                                            {stat.title}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Box sx={{ width: '100%', mt: 4, pt: 2, borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>
                                    <Box className="flex justify-between items-center mb-4">
                                        <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>Performance Trend</Typography>
                                        <FormControl size="small" sx={{ minWidth: 130 }}>
                                            <Autocomplete
                                                size="small"
                                                options={[
                                                    { label: 'Daily', value: 'daily' },
                                                    { label: 'Weekly', value: 'weekly' },
                                                    { label: 'Monthly', value: 'monthly' }
                                                ]}
                                                getOptionLabel={(option) => option.label || ''}
                                                value={
                                                    [
                                                        { label: 'Daily', value: 'daily' },
                                                        { label: 'Weekly', value: 'weekly' },
                                                        { label: 'Monthly', value: 'monthly' }
                                                    ].find(opt => opt.value === graphInterval) || { label: 'Daily', value: 'daily' }
                                                }
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
                                                    if (graphInterval === 'monthly') return moment(tick).format('MMM YYYY');
                                                    return moment(tick).format('MMM DD');
                                                }} 
                                                stroke={isDarkMode ? '#b4b7bd' : '#6e6b7b'}
                                                tick={{ fill: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}
                                            />
                                            <YAxis 
                                                yAxisId="left" 
                                                stroke="#7367f0" 
                                                tick={{ fill: isDarkMode ? '#b4b7bd' : '#6e6b7b' }} 
                                            />
                                            <YAxis 
                                                yAxisId="right" 
                                                orientation="right" 
                                                stroke="#00cfe8" 
                                                tick={{ fill: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}
                                            />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: isDarkMode ? '#283046' : '#fff', borderColor: isDarkMode ? '#404656' : '#d8d6de', color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }}
                                                labelFormatter={(label) => {
                                                    if (graphInterval === 'weekly') {
                                                        const endOfWeek = moment(label).endOf('isoWeek');
                                                        return `${moment(label).format('MMM DD')} - ${endOfWeek.format('MMM DD, YYYY')}`;
                                                    }
                                                    if (graphInterval === 'monthly') return moment(label).format('MMMM YYYY');
                                                    return moment(label).format('dddd, MMM DD, YYYY');
                                                }}
                                            />
                                            <Legend wrapperStyle={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke="#7367f0" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                            <Line yAxisId="right" type="monotone" dataKey="impressions" name="Impressions" stroke="#00cfe8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                        </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <>
                        {/* Table */}
                        <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        backgroundImage: 'none',
                        boxShadow: 'none',
                        borderRadius: 0,
                        overflowX: 'auto',
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 900, borderCollapse: 'separate', borderSpacing: 0 }}>
                        <TableHead>
                            <TableRow sx={{
                                'height': '48px',
                                '& th': {
                                    backgroundColor: isDarkMode ? '#283046' : '#f3f2f7',
                                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                    borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                    py: 0,
                                    px: 2,
                                }
                            }}>
                                <TableCell align="center" width={70}>#</TableCell>
                                {dimension === 'country' && <TableCell align="center" width={70}>FLAG</TableCell>}
                                <TableCell sortDirection={sortConfig.key === 'dimensionValue' ? sortConfig.direction : false}>
                                    <TableSortLabel
                                        active={sortConfig.key === 'dimensionValue'}
                                        direction={sortConfig.key === 'dimensionValue' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('dimensionValue')}
                                        sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', '&.Mui-active': { color: isDarkMode ? '#e2e8f0' : '#1e293b' }, '& .MuiTableSortLabel-icon': { color: isDarkMode ? '#e2e8f0 !important' : '#1e293b !important' } }}
                                    >
                                        {dimension.toUpperCase()}
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" sortDirection={sortConfig.key === 'clicks' ? sortConfig.direction : false}>
                                    <TableSortLabel
                                        active={sortConfig.key === 'clicks'}
                                        direction={sortConfig.key === 'clicks' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('clicks')}
                                        sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', '&.Mui-active': { color: isDarkMode ? '#e2e8f0' : '#1e293b' }, '& .MuiTableSortLabel-icon': { color: isDarkMode ? '#e2e8f0 !important' : '#1e293b !important' } }}
                                    >
                                        CLICKS
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" sortDirection={sortConfig.key === 'impressions' ? sortConfig.direction : false}>
                                    <TableSortLabel
                                        active={sortConfig.key === 'impressions'}
                                        direction={sortConfig.key === 'impressions' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('impressions')}
                                        sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', '&.Mui-active': { color: isDarkMode ? '#e2e8f0' : '#1e293b' }, '& .MuiTableSortLabel-icon': { color: isDarkMode ? '#e2e8f0 !important' : '#1e293b !important' } }}
                                    >
                                        IMPRESSIONS
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" sortDirection={sortConfig.key === 'ctr' ? sortConfig.direction : false}>
                                    <TableSortLabel
                                        active={sortConfig.key === 'ctr'}
                                        direction={sortConfig.key === 'ctr' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('ctr')}
                                        sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', '&.Mui-active': { color: isDarkMode ? '#e2e8f0' : '#1e293b' }, '& .MuiTableSortLabel-icon': { color: isDarkMode ? '#e2e8f0 !important' : '#1e293b !important' } }}
                                    >
                                        CTR
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" sortDirection={sortConfig.key === 'position' ? sortConfig.direction : false}>
                                    <TableSortLabel
                                        active={sortConfig.key === 'position'}
                                        direction={sortConfig.key === 'position' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('position')}
                                        sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', '&.Mui-active': { color: isDarkMode ? '#e2e8f0' : '#1e293b' }, '& .MuiTableSortLabel-icon': { color: isDarkMode ? '#e2e8f0 !important' : '#1e293b !important' } }}
                                    >
                                        AVG POSITION
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isFetching) ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : results.length === 0 ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8, color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: 'none' }}>
                                        <Typography variant="body1">No results found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                results.map((row, index) => (
                                    <TableRow
                                        key={index}
                                        onClick={() => {
                                            if (dimension === 'query') {
                                                setSelectedQuery(row.dimensionValue);
                                            }
                                        }}
                                        sx={{
                                            'height': '60px',
                                            cursor: dimension === 'query' ? 'pointer' : 'default',
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8',
                                            },
                                            '& td': {
                                                borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            }
                                        }}
                                    >
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                {index + 1}
                                            </Typography>
                                        </TableCell>
                                        {dimension === 'country' && (
                                            <TableCell align="center">
                                                {(() => {
                                                    const alpha2 = countries.alpha3ToAlpha2(row.dimensionValue.toUpperCase());
                                                    if (alpha2) {
                                                        return (
                                                            <Box 
                                                                component="img" 
                                                                src={`https://flagcdn.com/w40/${alpha2.toLowerCase()}.png`} 
                                                                alt={alpha2}
                                                                sx={{ width: 28, height: 20, objectFit: 'cover', borderRadius: '2px', display: 'inline-block' }}
                                                            />
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {dimension === 'page' ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {row.image && (
                                                        <Box
                                                            component="img"
                                                            src={getImage(row.image)}
                                                            alt={row.title || "Recipe"}
                                                            sx={{
                                                                width: 96,
                                                                height: 54,
                                                                borderRadius: '6px',
                                                                objectFit: 'cover',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                    )}
                                                    <Box>
                                                        {row.title && <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>{row.title}</Typography>}
                                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', wordBreak: 'break-all', display: 'block' }}>{row.dimensionValue}</Typography>
                                                        {(row.created_at || row.updated_at) && (
                                                            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#94a3b8', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                                                                {row.created_at && `Added: ${moment(row.created_at).format('MMM DD, YYYY')}`}
                                                                {row.created_at && row.updated_at && ' • '}
                                                                {row.updated_at && `Updated: ${moment(row.updated_at).format('MMM DD, YYYY')}`}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {dimension === 'country' ? (countries.getName(row.dimensionValue.toUpperCase(), 'en') || row.dimensionValue) : row.dimensionValue}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">{row.clicks.toLocaleString()}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">{row.impressions.toLocaleString()}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">{(row.ctr * 100).toFixed(2)}%</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">{row.position.toFixed(2)}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ── Pagination ────────────────────────────────────────── */}
                <Box
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0"
                    sx={{
                        px: 3,
                        py: 2,
                        backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                        borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                    }}
                >
                    <Box className="flex items-center gap-3">
                        <Autocomplete
                            freeSolo
                            size="small"
                            options={[10, 25, 50, 100, 150, 200, 250, 300, 350]}
                            getOptionLabel={(option) => String(option)}
                            value={limit || 10}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    setLimit(Number(newValue));
                                    setPage(1);
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                const parsed = Number(newInputValue);
                                if (!isNaN(parsed) && parsed > 0) {
                                    setLimit(parsed);
                                    setPage(1);
                                }
                            }}
                            sx={{
                                width: 100,
                                '& .MuiAutocomplete-inputRoot': {
                                    paddingRight: '30px !important'
                                },
                                '& .MuiAutocomplete-clearIndicator': {
                                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b'
                                },
                                '& .MuiAutocomplete-popupIndicator': {
                                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b'
                                }
                            }}

                            slotProps={{
                                paper: {
                                    sx: {
                                        bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                        '& .MuiAutocomplete-option': {
                                            '&[aria-selected="true"]': {
                                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)',
                                                color: '#7367f0',
                                            },
                                            '&:hover': {
                                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                                            }
                                        }
                                    }
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: isDarkMode ? '#283046' : '#fff',
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            height: 38,
                                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                            '&:hover fieldset': { borderColor: '#7367f0' },
                                            '&.Mui-focused fieldset': { borderColor: '#7367f0', borderWidth: '1px' },
                                        },
                                        '& input': {
                                            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                                            WebkitTextFillColor: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                                        }
                                    }}
                                />
                            )}
                        />
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Entries per page
                        </Typography>
                    </Box>

                    <Box className="flex items-center gap-4">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Showing {Math.min((page - 1) * limit + 1, pagination.total || 0)} to {Math.min(page * limit, pagination.total || 0)} of {pagination.total || 0} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={pagination.totalPages || 1}
                        page={page || 1}
                        onChange={(e, value) => setPage(value)}
                        shape="rounded"
                        showFirstButton
                        showLastButton
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                bgcolor: isDarkMode ? '#323a50' : '#f3f2f7',
                                border: 'none',
                                fontWeight: 500,
                                m: 0.2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(115,103,240,0.18)' : 'rgba(115,103,240,0.1)',
                                    color: isDarkMode ? '#a5b4fc' : '#7367f0',
                                },
                                '&.Mui-selected': {
                                    bgcolor: '#7367f0 !important',
                                    color: '#fff !important',
                                    fontWeight: 700,
                                    '&:hover': {
                                        bgcolor: '#5e50ee !important',
                                    }
                                }
                            },
                            '& .MuiPaginationItem-ellipsis': {
                                bgcolor: 'transparent',
                            }
                        }}
                    />
                </Box>
                    </>
                )}
            </Box>

            <Dialog open={!!selectedQuery} onClose={() => setSelectedQuery(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: isDarkMode ? '#283046' : '#ffffff', color: isDarkMode ? '#d0d2d6' : '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Pages for "{selectedQuery}"
                    <IconButton onClick={() => setSelectedQuery(null)} size="small" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: isDarkMode ? '#283046' : '#ffffff', padding: 3, pt: 1 }}>
                    {isFetchingRelated ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={30} sx={{ color: '#7367f0' }} />
                        </Box>
                    ) : relatedPages.length === 0 ? (
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', textAlign: 'center', py: 4 }}>No related pages found.</Typography>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent', boxShadow: 'none', overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 450 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>Page</TableCell>
                                        <TableCell align="center" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>Clicks</TableCell>
                                        <TableCell align="center" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>Impressions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {relatedPages.map((rp, i) => (
                                        <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ color: isDarkMode ? '#d0d2d6' : '#1e293b', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, maxWidth: 400 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {rp.image && (
                                                        <Box
                                                            component="img"
                                                            src={getImage(rp.image)}
                                                            alt={rp.title || "Recipe"}
                                                            sx={{
                                                                width: 96,
                                                                height: 54,
                                                                borderRadius: '6px',
                                                                objectFit: 'cover',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                    )}
                                                    <Box>
                                                        {rp.title && <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>{rp.title}</Typography>}
                                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', wordBreak: 'break-all', display: 'block' }}>{rp.dimensionValue}</Typography>
                                                        {(rp.created_at || rp.updated_at) && (
                                                            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#94a3b8', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                                                                {rp.created_at && `Added: ${moment(rp.created_at).format('MMM DD, YYYY')}`}
                                                                {rp.created_at && rp.updated_at && ' • '}
                                                                {rp.updated_at && `Updated: ${moment(rp.updated_at).format('MMM DD, YYYY')}`}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ color: isDarkMode ? '#d0d2d6' : '#1e293b', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>{rp.clicks.toLocaleString()}</TableCell>
                                            <TableCell align="center" sx={{ color: isDarkMode ? '#d0d2d6' : '#1e293b', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>{rp.impressions.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default SearchResults;
