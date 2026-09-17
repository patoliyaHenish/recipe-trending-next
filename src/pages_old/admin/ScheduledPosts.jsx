"use client";
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Button,
    IconButton,
    Tooltip,
    TextField,
    Collapse,
    FormControl,
    Select,
    MenuItem,
    Pagination,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    InputAdornment
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import InstagramIcon from '@mui/icons-material/Instagram';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';

import { useTheme } from '../../context/ThemeContext';
import { useGetAllScheduledPostsQuery, useCancelScheduledPostMutation } from '../../features/api/instagramApi';
import { toast } from '../../utils/toast';
import { getImage } from '../../utils/helper';
import { AccessDenied, ConfirmDialog } from '../../components/common';

const ScheduledPosts = () => {
    useEffect(() => {
        document.title = 'Scheduled Instagram Posts'
    })

    const [searchParams, setSearchParams] = useSearchParams();
    const { isDarkMode } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const canList = userPermissions.includes('instagram.schedule.list');
    const canCancel = userPermissions.includes('instagram.schedule.delete');

    if (!canList) {
        return <AccessDenied message="You do not have permission to view Scheduled Instagram Posts." />;
    }

    const [page, setPage] = useState(() => {
        const p = searchParams.get('page')
        return p ? parseInt(p, 10) : 1
    })
    const [limit, setLimit] = useState(() => {
        const l = searchParams.get('limit')
        return l ? parseInt(l, 10) : 20
    })
    const [search, setSearch] = useState(() => searchParams.get('search') || '')
    const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')
    const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
    const [debouncedStatusFilter, setDebouncedStatusFilter] = useState(() => searchParams.get('status') || '')
    const [showFilters, setShowFilters] = useState(false);
    const [viewPost, setViewPost] = useState(null);
    const [cancelId, setCancelId] = useState(null);

    const { data, isLoading, isFetching, refetch } = useGetAllScheduledPostsQuery({
        status: debouncedStatusFilter || undefined,
        search: debouncedSearch,
        page,
        limit
    });

    const [cancelScheduledPost, { isLoading: isCancelling }] = useCancelScheduledPostMutation();

    const scheduledPosts = data?.data || [];
    const pagination = data?.pagination || { total: 0, page: 1, limit, totalPages: 1 };

    const hasActiveFilters = search !== '' || statusFilter !== '';

    useEffect(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            let changed = false

            const currentUrlPage = next.get('page')
            if (page > 1) {
                if (currentUrlPage !== String(page)) {
                    next.set('page', page)
                    changed = true
                }
            } else if (currentUrlPage) {
                next.delete('page')
                changed = true
            }

            const currentUrlLimit = next.get('limit')
            if (limit !== 20) {
                if (currentUrlLimit !== String(limit)) {
                    next.set('limit', limit)
                    changed = true
                }
            } else if (currentUrlLimit) {
                next.delete('limit')
                changed = true
            }

            const currentUrlSearch = next.get('search')
            if (debouncedSearch) {
                if (currentUrlSearch !== debouncedSearch) {
                    next.set('search', debouncedSearch)
                    changed = true
                }
            } else if (currentUrlSearch) {
                next.delete('search')
                changed = true
            }

            const currentUrlStatus = next.get('status')
            if (debouncedStatusFilter) {
                if (currentUrlStatus !== debouncedStatusFilter) {
                    next.set('status', debouncedStatusFilter)
                    changed = true
                }
            } else if (currentUrlStatus) {
                next.delete('status')
                changed = true
            }

            return changed ? next : prev
        }, { replace: true })
    }, [page, limit, debouncedSearch, debouncedStatusFilter, setSearchParams])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedStatusFilter(statusFilter)
        }, 500)
        return () => clearTimeout(timer)
    }, [statusFilter])

    const handleSearch = () => {
        setDebouncedSearch(search);
        setDebouncedStatusFilter(statusFilter);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setDebouncedSearch('')
        setDebouncedStatusFilter('')
        setPage(1)
    }

    const handleCopyUrl = (url) => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        toast.success('Post URL copied to clipboard!');
    };

    const handleCancelScheduledPost = async () => {
        if (!cancelId) return;

        try {
            const res = await cancelScheduledPost(cancelId).unwrap();

            if (res.success) {
                toast.success('Scheduled post cancelled successfully!')
                setCancelId(null)
                setViewPost(null)
                refetch()
            } else {
                toast.error(res?.message || 'Failed to cancel scheduled post.')
                setCancelId(null)
            }
        } catch (err) {
            const msg = err?.data?.message || err?.message || 'Failed to cancel scheduled post.'
            toast.error(msg)
            setCancelId(null)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
            case 'published':
                return isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
            case 'failed':
                return isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'
            case 'cancelled':
                return isDarkMode ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.1)'
            default:
                return isDarkMode ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.1)'
        }
    }

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'pending':
                return '#3b82f6'
            case 'published':
                return '#10b981'
            case 'failed':
                return '#ef4444'
            case 'cancelled':
                return '#6b7280'
            default:
                return '#6b7280'
        }
    }

    const selectStyles = {
        height: 38,
        bgcolor: isDarkMode ? '#283046' : '#fff',
        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' }
    };

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
                {/* ── Card header ───────────────────────────────────────────── */}
                <Box
                    className="flex flex-wrap justify-between items-center p-4 sm:p-5 border-b gap-3"
                    sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
                >
                    <Box className="flex items-center flex-wrap gap-2">
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                letterSpacing: '0.5px',
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                        >
                            Scheduled Instagram Posts
                        </Typography>
                    </Box>
                    <Box className="flex gap-2 sm:gap-4 flex-wrap items-center">
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
                </Box>

                {/* ── Filters row ───────────────────────────────────────────── */}
                <Collapse in={showFilters}>
                    <Box className="flex flex-col p-5 gap-4">
                        <Box className="flex flex-wrap items-center gap-4">
                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                    Status:
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 160, ...selectStyles }}>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        displayEmpty
                                        sx={{ height: 38 }}
                                    >
                                        <MenuItem value="">All Statuses</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="published">Published</MenuItem>
                                        <MenuItem value="failed">Failed</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                    Search:
                                </Typography>
                                <TextField
                                    size="small"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by title or recipe..."
                                    sx={{
                                        width: 260,
                                        '& .MuiOutlinedInput-root': {
                                            height: 38,
                                            backgroundColor: isDarkMode ? '#283046' : '#fff',
                                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                            '&:hover fieldset': { borderColor: '#7367f0' },
                                            '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                                        },
                                        '& .MuiInputBase-input': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            '&::placeholder': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b', opacity: 1 }
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                        {/* Action Buttons */}
                        <Box className="flex justify-end items-center gap-3">
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleClearFilters}
                                disabled={!hasActiveFilters}
                                startIcon={<ClearAllIcon />}
                                sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3 }}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSearch}
                                startIcon={<SearchIcon />}
                                sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3, bgcolor: '#7367f0', '&:hover': { bgcolor: '#5e50ee' }, boxShadow: 'none' }}
                            >
                                Search
                            </Button>
                        </Box>
                    </Box>
                </Collapse>

                {/* ── Table ───────────────────────────────────────────────── */}
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
                                <TableCell>RECIPE</TableCell>
                                <TableCell>TITLE</TableCell>
                                <TableCell>STATUS</TableCell>
                                 <TableCell align="center">CREATED BY</TableCell>
                                 <TableCell align="center">SCHEDULED AT</TableCell>
                                 <TableCell align="center">CREATED AT</TableCell>
                                 <TableCell align="center">ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading || isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : scheduledPosts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                            No scheduled posts found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                scheduledPosts.map((post, index) => (
                                    <TableRow
                                        key={post.id}
                                        sx={{
                                            'height': '60px',
                                            borderLeft: post.status === 'failed' ? '3px solid #ef4444' : 'none',
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8',
                                            },
                                            '& td': {
                                                borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            }
                                        }}
                                    >
                                        <TableCell align="center">{(page - 1) * limit + index + 1}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                {post.image_url ? (
                                                    <Box
                                                        component="img"
                                                        src={post.image_url}
                                                        alt={post.title || 'Scheduled Post'}
                                                        sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '6px' }}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <Box sx={{ width: 40, height: 40, borderRadius: '6px', backgroundColor: isDarkMode ? '#3b4253' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <InstagramIcon sx={{ fontSize: 20, color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }} />
                                                    </Box>
                                                )}
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                                                    {post.recipe_title || `Recipe #${post.recipe_id}`}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                                                {post.title || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                {post.created_by_name || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={post.status}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getStatusColor(post.status),
                                                    color: getStatusTextColor(post.status),
                                                    fontWeight: 500,
                                                    fontSize: '0.7rem',
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {post.created_at ? new Date(post.created_at).toLocaleString() : '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" gap={0.5} justifyContent="center" alignItems="center">
                                                {post.status === 'published' && post.post_url && (
                                                    <Tooltip title="View on Instagram" arrow>
                                                        <IconButton
                                                            size="small"
                                                            href={post.post_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{ color: '#E1306C' }}
                                                        >
                                                            <OpenInNewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {post.status === 'published' && post.post_url && (
                                                    <Tooltip title="Copy Link" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopyUrl(post.post_url)}
                                                            sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}
                                                        >
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {post.status === 'pending' && canCancel && (
                                                    <Tooltip title="Cancel Schedule" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setCancelId(post.id)}
                                                            sx={{ color: isDarkMode ? '#ef4444' : '#dc2626' }}
                                                        >
                                                            <CancelIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
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
                                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)',
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
            </Box>

            {/* ── View Post Dialog ────────────────────────────────────────── */}
            <Dialog
                open={!!viewPost}
                onClose={() => setViewPost(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                        color: isDarkMode ? '#d0d2d6' : '#1e293b',
                        border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`
                    }
                }}
            >
                {viewPost && (
                    <>
                        <DialogTitle sx={{ borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Scheduled Post Details</Typography>
                            <IconButton onClick={() => setViewPost(null)} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                                <Box sx={{ flex: '0 0 300px' }}>
                                    {viewPost.image_url ? (
                                        <Box
                                            sx={{
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                                                backgroundColor: isDarkMode ? '#1a1d27' : '#f8f8f8'
                                            }}
                                        >
                                            <img
                                                src={viewPost.image_url}
                                                alt={viewPost.title}
                                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                borderRadius: '8px',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                                                backgroundColor: isDarkMode ? '#1a1d27' : '#f8f8f8',
                                                height: 300,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <InstagramIcon sx={{ fontSize: 64, color: isDarkMode ? '#b4b7bd' : '#6e6b7b', opacity: 0.3 }} />
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', textTransform: 'uppercase', fontWeight: 600 }}>Recipe</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: isDarkMode ? '#e2e8f0' : '#1e293b', mt: 0.5 }}>
                                            {viewPost.recipe_title || `Recipe #${viewPost.recipe_id}`}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', textTransform: 'uppercase', fontWeight: 600 }}>Title</Typography>
                                        <Typography variant="body2" sx={{ color: isDarkMode ? '#d0d2d6' : '#1e293b', mt: 0.5 }}>
                                            {viewPost.title || '-'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', textTransform: 'uppercase', fontWeight: 600 }}>Status</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={viewPost.status}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getStatusColor(viewPost.status),
                                                    color: getStatusTextColor(viewPost.status),
                                                    fontWeight: 500,
                                                    fontSize: '0.7rem',
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', textTransform: 'uppercase', fontWeight: 600 }}>Scheduled At</Typography>
                                        <Typography variant="body2" sx={{ color: isDarkMode ? '#d0d2d6' : '#1e293b', mt: 0.5 }}>
                                            {viewPost.scheduled_at ? new Date(viewPost.scheduled_at).toLocaleString() : '-'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', textTransform: 'uppercase', fontWeight: 600 }}>Caption</Typography>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                mt: 0.5,
                                                p: 1.5,
                                                backgroundColor: isDarkMode ? '#1a1d27' : '#f8f8f8',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                                                borderRadius: '6px',
                                                maxHeight: 150,
                                                overflow: 'auto'
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ color: isDarkMode ? '#d0d2d6' : '#1e293b', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                                                {viewPost.caption || '-'}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', textTransform: 'uppercase', fontWeight: 600 }}>Created At</Typography>
                                        <Typography variant="body2" sx={{ color: isDarkMode ? '#d0d2d6' : '#1e293b', mt: 0.5 }}>
                                            {viewPost.created_at ? new Date(viewPost.created_at).toLocaleString() : '-'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, px: 3, py: 2 }}>
                            {viewPost.post_url && viewPost.status === 'published' && (
                                <Button
                                    href={viewPost.post_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="contained"
                                    startIcon={<OpenInNewIcon />}
                                    sx={{
                                        backgroundColor: '#E1306C',
                                        '&:hover': { backgroundColor: '#c0355e' },
                                        textTransform: 'none',
                                        borderRadius: '6px'
                                    }}
                                >
                                    View on Instagram
                                </Button>
                            )}
                            {viewPost.post_url && viewPost.status === 'published' && (
                                <Button
                                    variant="outlined"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={() => handleCopyUrl(viewPost.post_url)}
                                    sx={{
                                        borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        textTransform: 'none',
                                        borderRadius: '6px'
                                    }}
                                >
                                    Copy Link
                                </Button>
                            )}
                            <Button
                                onClick={() => setViewPost(null)}
                                sx={{ textTransform: 'none', borderRadius: '6px', color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <ConfirmDialog
                open={!!cancelId}
                onClose={() => setCancelId(null)}
                onConfirm={handleCancelScheduledPost}
                title="Cancel Scheduled Post"
                message="Are you sure you want to cancel this scheduled Instagram post? This action cannot be undone."
                confirmText="Cancel Schedule"
                cancelText="Keep Scheduled"
                severity="warning"
                isLoading={isCancelling}
                loadingText="Cancelling..."
            />
        </Box>
    );
};

export default ScheduledPosts;
