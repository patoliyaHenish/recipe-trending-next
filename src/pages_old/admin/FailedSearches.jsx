    "use client";
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    Box,
    Button,
    Typography,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Pagination,
    Tooltip,
    Autocomplete,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Collapse,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';
import moment from 'moment';
import { toast } from '../../utils/toast';
import { useTheme } from '../../context/ThemeContext';
import { useGetAllFailedSearchesQuery, useDeleteFailedSearchMutation } from '../../features/api/failedSearchApi';
import { ConfirmDialog, AccessDenied } from '../../components/common';
import { useSelector } from 'react-redux';

const FailedSearches = () => {
    const { isDarkMode } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canList = isAdmin || userPermissions.includes('search_failed.list');
    const canDelete = isAdmin || userPermissions.includes('search_failed.delete');


    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const setSearchParams = React.useCallback((updater, options = {}) => {
        const next = new URLSearchParams(Array.from(searchParams.entries()));
        let finalParams = updater;
        if (typeof updater === 'function') {
            finalParams = updater(next);
        }
        if (finalParams) {
             const newUrl = `${pathname}?${finalParams.toString()}`;
             if (options.replace) {
                  router.replace(newUrl, { scroll: false });
             } else {
                  router.push(newUrl, { scroll: false });
             }
        }
    }, [searchParams, pathname, router]);

    const [page, setPage] = useState(() => {
        const p = searchParams.get('page');
        return p ? parseInt(p, 10) : 1;
    });
    const [limit, setLimit] = useState(() => {
        const l = searchParams.get('limit');
        return l ? parseInt(l, 10) : 50;
    });
    const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '');
    const [userInput, setUserInput] = useState(() => searchParams.get('user') || '');
    const [debouncedUser, setDebouncedUser] = useState(() => searchParams.get('user') || '');
    const [createdAtInput, setCreatedAtInput] = useState(() => searchParams.get('createdAt') || null);
    const [debouncedCreatedAt, setDebouncedCreatedAt] = useState(() => searchParams.get('createdAt') || null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    // Sync page & limit to URL
    useEffect(() => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            let changed = false;
            const currentPage = next.get('page');
            if (page > 1) {
                if (currentPage !== String(page)) { next.set('page', page); changed = true; }
            } else if (currentPage) { next.delete('page'); changed = true; }

            const currentLimit = next.get('limit');
            if (limit !== 50) {
                if (currentLimit !== String(limit)) { next.set('limit', limit); changed = true; }
            } else if (currentLimit) { next.delete('limit'); changed = true; }

            return changed ? next : prev;
        }, { replace: true });
    }, [page, limit]);

    useEffect(() => {
        document.title = 'Failed Searches';
    }, []);

    const { data: searchesData, isLoading, isFetching } = useGetAllFailedSearchesQuery({
        page,
        limit,
        search: debouncedSearch,
        user: debouncedUser,
        createdAt: debouncedCreatedAt ? moment(debouncedCreatedAt).format('YYYY-MM-DD') : ''
    }, {
        skip: !canList && !isAdmin
    });

    const searches = useMemo(() => searchesData?.data || [], [searchesData]);
    const pagination = useMemo(() => ({
        total: searchesData?.pagination?.total || 0,
        page: searchesData?.pagination?.page || page,
        limit: searchesData?.pagination?.limit || limit,
        totalPages: searchesData?.pagination?.totalPages || 1,
    }), [searchesData, page, limit]);

    const [deleteFailedSearch, { isLoading: isDeleting }] = useDeleteFailedSearchMutation();

    const handleDeleteClick = useCallback((id) => {
        setSelectedId(id);
        setDeleteDialogOpen(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        try {
            const res = await deleteFailedSearch({ id: selectedId, page, limit }).unwrap();
            toast.success(res.message || 'Failed search deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedId(null);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete search');
        }
    };

    const hasActiveFilters = searchInput !== '' || userInput !== '' || createdAtInput !== null;

    const handleClearFilters = () => {
        setSearchInput('');
        setDebouncedSearch('');
        setUserInput('');
        setDebouncedUser('');
        setCreatedAtInput(null);
        setDebouncedCreatedAt(null);
        setPage(1);
        setSearchParams(new URLSearchParams());
    };

    // ── Styles matching UserManagement ──────────────────────────────────────────
    const selectStyles = {
        height: 38,
        bgcolor: isDarkMode ? '#283046' : '#fff',
        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
    };

    const datePickerTextFieldStyles = {
        size: 'small',
        sx: {
            width: '170px',
            '& .MuiInputBase-root': {
                height: 38,
                bgcolor: isDarkMode ? '#283046' : '#fff',
                borderRadius: '4px',
                color: isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
                '-webkit-text-fill-color': isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#404656' : '#d8d6de'
            },
            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#6b7280' : '#b4b7bd'
            },
            '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#7367f0',
                borderWidth: '1px'
            },
            '& input': {
                color: isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
                '-webkit-text-fill-color': `${isDarkMode ? '#ffffff' : '#6e6b7b'} !important`,
                WebkitTextFillColor: `${isDarkMode ? '#ffffff' : '#6e6b7b'} !important`,
                opacity: 1,
            },
            '& input::placeholder': {
                color: isDarkMode ? '#b4b7bd !important' : '#9ca3af !important',
                '-webkit-text-fill-color': `${isDarkMode ? '#b4b7bd' : '#9ca3af'} !important`,
                WebkitTextFillColor: `${isDarkMode ? '#b4b7bd' : '#9ca3af'} !important`,
                opacity: 1
            },
            '& *': {
                color: isDarkMode ? '#ffffff !important' : 'inherit',
                '-webkit-text-fill-color': isDarkMode ? '#ffffff !important' : 'inherit',
            },
            '& .MuiSvgIcon-root': {
                color: isDarkMode ? '#d0d2d6' : '#6e6b7b'
            }
        },
        inputProps: {
            style: {
                color: isDarkMode ? '#ffffff' : '#6e6b7b',
                WebkitTextFillColor: isDarkMode ? '#ffffff' : '#6e6b7b',
                opacity: 1
            }
        }
    };

    const datePickerDayStyles = {
        sx: {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            backgroundColor: 'transparent',
            '&.Mui-selected': {
                backgroundColor: '#7367f0 !important',
                color: '#ffffff !important',
            },
            '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important',
            },
            '&.MuiPickersDay-today': {
                borderColor: '#7367f0 !important',
            }
        }
    };

    const datePickerPopperStyles = {
        sx: {
            '& .MuiPaper-root': {
                bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                backgroundImage: 'none',
            },
            '& .MuiPickersCalendarHeader-root': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& .MuiPickersCalendarHeader-label': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& .MuiDayCalendar-weekDayLabel': {
                color: isDarkMode ? '#b4b7bd !important' : '#6e6b7b !important',
            },
            '& .MuiIconButton-root': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& button.MuiPickersDay-root': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                backgroundColor: 'transparent',
            },
            '& button.MuiPickersDay-root:not(.Mui-selected)': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& button.MuiPickersDay-dayOutsideMonth': {
                color: isDarkMode ? '#6e6b7b !important' : '#b4b7bd !important',
            },
            '& button.MuiPickersDay-root:hover': {
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important',
            },
            '& button.MuiPickersDay-root.Mui-selected': {
                bgcolor: '#7367f0 !important',
                color: '#ffffff !important',
            },
            '& .MuiPickersYear-yearButton': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& .MuiPickersMonth-monthButton': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            }
        }
    };

    const calendarDarkSx = {
        bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
        color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        backgroundImage: 'none',
        '& .MuiPickersCalendarHeader-root': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiPickersCalendarHeader-label': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiDayCalendar-weekDayLabel': {
            color: isDarkMode ? '#b4b7bd !important' : '#6e6b7b !important',
        },
        '& .MuiIconButton-root': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& button.MuiPickersDay-root': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            backgroundColor: 'transparent',
        },
        '& button.MuiPickersDay-root:not(.Mui-selected)': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& button.MuiPickersDay-dayOutsideMonth': {
            color: isDarkMode ? '#6e6b7b !important' : '#b4b7bd !important',
        },
        '& button.MuiPickersDay-root:hover': {
            backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important',
        },
        '& button.MuiPickersDay-root.Mui-selected': {
            backgroundColor: '#7367f0 !important',
            color: '#ffffff !important',
        },
        '& .MuiPickersYear-yearButton': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiPickersMonth-monthButton': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiDialogActions-root .MuiButton-root': {
            color: isDarkMode ? '#7367f0 !important' : '#7367f0 !important',
        },
        '& .MuiPickersToolbar-root': {
            bgcolor: isDarkMode ? '#1a2035 !important' : '#7367f0 !important',
            color: '#ffffff !important',
            '& *': { color: '#ffffff !important' },
        },
    };

    const datePickerDialogStyles = {
        sx: {
            '& .MuiDialog-paper': {
                ...calendarDarkSx,
                border: isDarkMode ? '1px solid #404656' : 'none',
                boxShadow: isDarkMode
                    ? '0 8px 32px 0 rgba(0,0,0,0.48)'
                    : '0 8px 32px 0 rgba(34,41,47,0.18)',
            },
        },
    };

    const datePickerMobilePaperStyles = {
        sx: calendarDarkSx,
    };

    const menuPropsStyles = {
        sx: {
            '& .MuiPaper-root': {
                bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                borderRadius: '6px',
                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
            },
            '& .MuiMenuItem-root': {
                fontSize: '0.9rem',
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                    color: '#7367f0 !important',
                },
                '&.Mui-selected': {
                    bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                    color: '#7367f0 !important',
                    fontWeight: 500,
                    '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.16) !important' },
                },
            },
        },
    };

    // ── Table data mapping ───────────────────────────────────────────────────────

    if (!canList && !isAdmin) {
        return <AccessDenied message="You do not have permission to view Failed Searches." />;
    }

    return (
        <Box
            className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full"
        >
            {/* ── Card wrapper ──────────────────────────────────────────────── */}
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
                {/* ── Card header ───────────────────────────────────────────── */}
                <Box
                    className="flex flex-wrap justify-between items-center p-4 sm:p-5 border-b gap-3"
                    sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
                >
                    <Box className="flex items-center gap-2">
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, color: isDarkMode ? '#e2e8f0' : '#1e293b', letterSpacing: '0.5px', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                        >
                            Failed Searches
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={() => setShowFilters(!showFilters)}
                        startIcon={showFilters ? <FilterAltOffOutlined /> : <FilterAltOutlined />}
                        sx={{ 
                            textTransform: 'none', 
                            borderColor: isDarkMode ? '#404656' : '#d8d6de', 
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            px: { xs: 1.5, sm: 2 },
                            '&:hover': {
                                borderColor: '#7367f0',
                                color: '#7367f0',
                                backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)'
                            }
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Box>
                    </Button>
                </Box>

                {/* ── Filters row ───────────────────────────────────────────── */}
                <Collapse in={showFilters} timeout="auto" unmountOnExit>
                    <Box className="flex flex-col p-5 gap-4" sx={{ borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>
                        <Box className="flex flex-wrap items-center gap-4">
                        {/* Search input */}
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                Query:
                            </Typography>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder=""
                                className="px-3 py-2 border rounded outline-none transition-colors"
                                style={{
                                    height: '38px',
                                    width: '220px',
                                    backgroundColor: isDarkMode ? '#283046' : '#fff',
                                    borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                    borderRadius: '4px',
                                }}
                            />
                        </Box>
                        {/* User input */}
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                User:
                            </Typography>
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder=""
                                className="px-3 py-2 border rounded outline-none transition-colors"
                                style={{
                                    height: '38px',
                                    width: '200px',
                                    backgroundColor: isDarkMode ? '#283046' : '#fff',
                                    borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                    borderRadius: '4px',
                                }}
                            />
                        </Box>
                        {/* Created At filter */}
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                Created At:
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    value={createdAtInput ? moment(createdAtInput) : null}
                                    onChange={(newValue) => setCreatedAtInput(newValue ? newValue.toDate() : null)}
                                    format="MM/DD/YYYY"
                                    slotProps={{ textField: datePickerTextFieldStyles, popper: datePickerPopperStyles, day: datePickerDayStyles, dialog: datePickerDialogStyles, mobilePaper: datePickerMobilePaperStyles }}
                                />
                            </LocalizationProvider>
                        </Box>
                    </Box>

                    {/* ── Action buttons ────────────────────────────────────── */}
                    <Box className="flex justify-end items-center gap-3">
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters}
                            sx={{ height: '38px', minWidth: { xs: '38px', sm: '120px' }, textTransform: 'none', px: { xs: 0, sm: 3 } }}
                        >
                            <ClearAllIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Clear</Box>
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setDebouncedSearch(searchInput);
                                setDebouncedUser(userInput);
                                setDebouncedCreatedAt(createdAtInput);
                                setPage(1);
                                setSearchParams(prev => {
                                    const next = new URLSearchParams(prev);
                                    if (searchInput) next.set('search', searchInput);
                                    else next.delete('search');
                                    
                                    if (userInput) next.set('user', userInput);
                                    else next.delete('user');
                                    
                                    if (createdAtInput) next.set('createdAt', moment(createdAtInput).format('YYYY-MM-DD'));
                                    else next.delete('createdAt');
                                    
                                    return next;
                                }, { replace: true });
                            }}
                            sx={{
                                height: '38px',
                                minWidth: { xs: '38px', sm: '120px' },
                                textTransform: 'none',
                                px: { xs: 0, sm: 3 },
                                bgcolor: '#7367f0',
                                '&:hover': { bgcolor: '#5e50ee' },
                            }}
                        >
                            <SearchIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Search</Box>
                        </Button>
                    </Box>
                </Box>
                </Collapse>

                {/* ── Standard MUI Table ───────────────────────────────────────────── */}
                <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                        flex: 1,
                        width: '100%',
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
                                    borderBottom: 'none',
                                    borderTop: 'none',
                                    py: 0,
                                    px: 2,
                                } 
                            }}>
                                <TableCell align="center" width={70}>#</TableCell>
                                <TableCell>SEARCH QUERY</TableCell>
                                <TableCell>USER</TableCell>
                                <TableCell align="center">CREATED AT</TableCell>
                                {canDelete && <TableCell align="center" width={100}>ACTIONS</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isFetching) ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={canDelete ? 5 : 4} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : searches.length === 0 ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={canDelete ? 5 : 4} align="center" sx={{ py: 8, color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: 'none' }}>
                                        <Typography variant="body1">No failed searches found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                searches.map((search, index) => (
                                    <TableRow 
                                        key={search.id || index}
                                        sx={{ 
                                            height: '60px',
                                            backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                                            transition: 'background-color 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8',
                                            },
                                            '& td': {
                                                borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                py: 1.5,
                                                px: 2,
                                            }
                                        }}
                                    >
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                {(page - 1) * limit + index + 1}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: isDarkMode ? '#e5e7eb' : '#4b4b4b',
                                                    fontFamily: 'monospace',
                                                    bgcolor: isDarkMode ? 'rgba(115,103,240,0.1)' : 'rgba(115,103,240,0.06)',
                                                    px: 1.5,
                                                    py: 0.4,
                                                    borderRadius: '4px',
                                                    fontSize: '0.82rem',
                                                    display: 'inline-block'
                                                }}
                                            >
                                                {search.search_query}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 32, height: 32,
                                                        borderRadius: '50%',
                                                        bgcolor: search.user_name ? '#7367f0' : (isDarkMode ? '#374151' : '#e5e7eb'),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Typography sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {search.user_name ? search.user_name.charAt(0).toUpperCase() : '?'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#e5e7eb' : '#4b4b4b', fontWeight: 500 }}>
                                                    {search.user_name || <span style={{ color: isDarkMode ? '#6b7280' : '#9ca3af', fontStyle: 'italic' }}>Guest</span>}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                                                {search.created_at ? moment(search.created_at).format('MMM D, YYYY h:mm A') : '—'}
                                            </Typography>
                                        </TableCell>

                                        {canDelete && (
                                            <TableCell align="center">
                                                <Tooltip title="Delete" arrow>
                                                    <IconButton
                                                        onClick={() => handleDeleteClick(search.id)}
                                                        size="small"
                                                        sx={{
                                                            color: isDarkMode ? '#ef4444' : '#dc2626',
                                                            '&:hover': {
                                                                color: isDarkMode ? '#f87171' : '#b91c1c',
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ── Pagination ────────────────────────────────────────────── */}
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
                            value={limit}
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
                            ListboxProps={{
                                sx: {
                                    bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
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
                            Showing {pagination.total === 0 ? 0 : Math.min((page - 1) * limit + 1, pagination.total)} to{' '}
                            {Math.min(page * limit, pagination.total)} of {pagination.total} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={pagination.totalPages}
                        page={page}
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
                                    '&:hover': { bgcolor: '#5e50ee !important' },
                                },
                            },
                            '& .MuiPaginationItem-ellipsis': { bgcolor: 'transparent' },
                        }}
                    />
                </Box>
            </Box>

            {/* ── Delete confirm dialog ─────────────────────────────────────── */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => { setDeleteDialogOpen(false); setSelectedId(null); }}
                onConfirm={handleConfirmDelete}
                title="Delete Failed Search"
                message="Are you sure you want to delete this failed search record? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                loadingText="Deleting…"
                severity="error"
            />
        </Box>
    );
};

export default FailedSearches;

