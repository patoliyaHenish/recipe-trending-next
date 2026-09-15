"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, IconButton, Typography, Collapse, CircularProgress, Tooltip, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, InputAdornment, Chip, Pagination, Autocomplete } from '@mui/material';
import { ConfirmDialog, AccessDenied } from '../../components/common';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { toast } from '../../utils/toast';
import { useTheme } from '../../context/ThemeContext';
import { useGetUnusedImagesQuery, useDeleteUnusedImagesMutation } from '../../features/api/unusedImageApi';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const UnusedImages = () => {
    useEffect(() => {
        document.title = 'Unused Images Management';
    }, []);

    const { isDarkMode } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const canList = userPermissions.includes('unused_image.list');
    const canDelete = userPermissions.includes('unused_image.delete');

    if (!canList) {
        return <AccessDenied message="You do not have permission to view unused images." />;
    }

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => {
        const urlPage = parseInt(searchParams.get('page'));
        return urlPage > 0 ? urlPage : 1;
    });
    const [limit, setLimit] = useState(() => {
        const urlLimit = parseInt(searchParams.get('limit'));
        return urlLimit > 0 ? urlLimit : 10;
    });
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSingleKey, setDeleteSingleKey] = useState(null);

    const syncUrlParams = (newPage, newLimit) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (newPage > 1) next.set('page', newPage.toString());
            else next.delete('page');
            if (newLimit !== 10) next.set('limit', newLimit.toString());
            else next.delete('limit');
            return next;
        });
    };

    const [deleteUnusedImages] = useDeleteUnusedImagesMutation();

    const { data, isLoading, isFetching, refetch } = useGetUnusedImagesQuery({ page, limit, search: debouncedSearch }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: false,
        refetchOnReconnect: true,
    });

    const images = useMemo(() => data?.data || [], [data]);
    const total = data?.total || 0;
    const totalFiltered = total;
    const totalPages = data?.totalPages || 1;
    const currentPage = data?.page || page;

    const paginatedImages = images;

    const allSelected = paginatedImages.length > 0 && selectedKeys.length === paginatedImages.length;
    const someSelected = selectedKeys.length > 0 && !allSelected;

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
    };

    const handleSearch = () => {
        setDebouncedSearch(search);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setSelectedKeys([]);
    };

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedKeys([]);
        } else {
            setSelectedKeys(paginatedImages.map((img) => img.key));
        }
    };

    const handleToggleSelect = (key) => {
        setSelectedKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedKeys.length === 0) return;
        try {
            setIsDeleting(true);
            await deleteUnusedImages(selectedKeys).unwrap();
            toast.success(`${selectedKeys.length} unused image(s) deleted successfully`);
            setSelectedKeys([]);
            setDeleteDialogOpen(false);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete unused images');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteSingle = async () => {
        if (!deleteSingleKey) return;
        try {
            setIsDeleting(true);
            await deleteUnusedImages([deleteSingleKey]).unwrap();
            toast.success('Image deleted successfully');
            setSelectedKeys((prev) => prev.filter((k) => k !== deleteSingleKey));
            setDeleteSingleKey(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete image');
        } finally {
            setIsDeleting(false);
        }
    };

    const hasActiveFilters = search !== '' || debouncedSearch !== '';

    const selectStyles = {
        bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDarkMode ? '#404656 !important' : '#d8d6de !important',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#7367f0 !important',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#7367f0 !important',
            borderWidth: '1px !important',
        },
        '& .MuiInputBase-input': {
            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        },
        '& .MuiSvgIcon-root': {
            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        },
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
                    className="flex flex-row justify-between items-center p-4 sm:p-5 border-b gap-4"
                    sx={{
                        borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                    }}
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
                            Unused Images
                        </Typography>
                        {total > 0 && (
                            <Chip
                                label={total}
                                size="small"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : '#fee2e2',
                                    color: isDarkMode ? '#fca5a5' : '#dc2626',
                                }}
                            />
                        )}
                    </Box>
                    <Box className="flex gap-4">
                        <Button
                            variant="outlined"
                            onClick={() => setShowFilters(!showFilters)}
                            startIcon={showFilters ? <FilterAltOffOutlined /> : <FilterAltOutlined />}
                            sx={{
                                textTransform: 'none',
                                borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                '&:hover': {
                                    borderColor: '#7367f0',
                                    color: '#7367f0',
                                    backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)'
                                }
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Box>
                        </Button>
                        {canDelete && selectedKeys.length > 0 && (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={isDeleting}
                                sx={{
                                    height: '38px',
                                    textTransform: 'none',
                                    px: 3,
                                    fontSize: '16px',
                                    boxShadow: 'none',
                                    '&:hover': { boxShadow: 'none' },
                                }}
                                startIcon={isDeleting ? <CircularProgress size={16} style={{ color: '#fff' }} /> : <DeleteIcon />}
                            >
                                Delete Selected ({selectedKeys.length})
                            </Button>
                        )}
                    </Box>
                </Box>

                <Collapse in={showFilters}>
                    <Box sx={{ p: 3, borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}>
                        <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <Box className="flex flex-wrap items-center gap-4">
                                <Box className="flex items-center gap-2">
                                    <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                        Search:
                                    </Typography>
                                    <TextField
                                        size="small"
                                        value={search}
                                        onChange={handleSearchChange}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by filename..."
                                        sx={{
                                            minWidth: 220,
                                            ...selectStyles,
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
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b', fontSize: 20 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Box className="flex items-center gap-3">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleClearFilters}
                                    disabled={!hasActiveFilters}
                                    sx={{ height: '38px', minWidth: { xs: '38px', sm: '100px' }, textTransform: 'none', px: { xs: 0, sm: 3 } }}
                                >
                                    <CloseIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Clear</Box>
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSearch}
                                    sx={{
                                        height: '38px',
                                        minWidth: { xs: '38px', sm: '100px' },
                                        textTransform: 'none',
                                        px: { xs: 0, sm: 3 },
                                        bgcolor: '#7367f0',
                                        '&:hover': { bgcolor: '#5e50ee' },
                                        boxShadow: 'none',
                                    }}
                                >
                                    <SearchIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Search</Box>
                                </Button>
                            </Box>
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
                                height: '48px',
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
                                {canDelete && (
                                    <TableCell align="center" width={60}>
                                        <Checkbox
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            onChange={handleSelectAll}
                                            sx={{ color: isDarkMode ? '#a5b4fc' : '#7367f0' }}
                                        />
                                    </TableCell>
                                )}
                                <TableCell align="center" width={140}>PREVIEW</TableCell>
                                <TableCell>FILENAME</TableCell>
                                <TableCell>URL</TableCell>
                                {canDelete && (
                                    <TableCell align="center" width={120}>ACTIONS</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isFetching) ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={canDelete ? 5 : 4} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedImages.length === 0 ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={canDelete ? 5 : 4} align="center" sx={{ py: 8, color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: 'none' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <CheckCircleIcon sx={{ fontSize: 48, color: isDarkMode ? '#10b981' : '#059669', mb: 1 }} />
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                                                No unused images found
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                All R2 images are referenced in the database.
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedImages.map((img, index) => {
                                    const isSelected = selectedKeys.includes(img.key);
                                    return (
                                        <TableRow
                                            key={img.key}
                                            sx={{
                                                height: '60px',
                                                backgroundColor: isSelected
                                                    ? (isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.06)')
                                                    : index % 2 === 0 ? (isDarkMode ? '#283046' : '#ffffff') : (isDarkMode ? '#283046' : '#fafbfc'),
                                                transition: 'background-color 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: isSelected
                                                        ? (isDarkMode ? 'rgba(115, 103, 240, 0.18)' : 'rgba(115, 103, 240, 0.1)')
                                                        : (isDarkMode ? '#2f3851' : '#f8f8f8'),
                                                },
                                                '& td': {
                                                    borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                    py: 1.5,
                                                    px: 2,
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                }
                                            }}
                                        >
                                            {canDelete && (
                                                <TableCell align="center">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelect(img.key)}
                                                        sx={{ color: isDarkMode ? '#a5b4fc' : '#7367f0' }}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell align="center">
                                                <Box
                                                    component="img"
                                                    src={img.url}
                                                    alt={img.key}
                                                    sx={{
                                                        width: 110,
                                                        height: 60,
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                        border: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                        backgroundColor: isDarkMode ? '#1a1d27' : '#f1f5f9',
                                                    }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 500, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {img.key}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={img.url}>
                                                    <Button
                                                        size="small"
                                                        href={img.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            color: '#7367f0',
                                                            textTransform: 'none',
                                                            '&:hover': { backgroundColor: 'rgba(115, 103, 240, 0.08)' },
                                                        }}
                                                        startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                                    >
                                                        Open
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                            {canDelete && (
                                                <TableCell align="center">
                                                    <Tooltip title="Delete this image">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setDeleteSingleKey(img.key)}
                                                            disabled={isDeleting}
                                                            sx={{ color: '#ef4444', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' } }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 20 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

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
                            options={[10, 25, 50, 100]}
                            value={limit}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    const parsed = Number(newValue);
                                    setLimit(parsed);
                                    setPage(1);
                                    syncUrlParams(1, parsed);
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                const parsed = Number(newInputValue);
                                if (!isNaN(parsed) && parsed > 0) {
                                    setLimit(parsed);
                                    setPage(1);
                                    syncUrlParams(1, parsed);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    sx={{
                                        width: '100px',
                                        '& .MuiOutlinedInput-root': {
                                            height: '32px',
                                            backgroundColor: isDarkMode ? '#283046' : '#fff',
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                        },
                                        '& .MuiInputBase-input': {
                                            padding: '0 8px !important',
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
                                        '& .MuiAutocomplete-listbox': {
                                            '& .MuiAutocomplete-option': {
                                                fontSize: '0.9rem',
                                                '&[aria-selected="true"]': { bgcolor: 'rgba(115, 103, 240, 0.12) !important', color: '#7367f0 !important' },
                                                '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' }
                                            }
                                        }
                                    }
                                }
                            }}
                            sx={{
                                '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                                '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                            }}
                        />
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Entries per page
                        </Typography>
                    </Box>

                    <Box className="flex items-center gap-4">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Showing {Math.min((currentPage - 1) * limit + 1, totalFiltered || 0)} to {Math.min(currentPage * limit, totalFiltered || 0)} of {totalFiltered || 0} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(event, value) => {
                            setPage(value);
                            syncUrlParams(value, limit);
                        }}
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

                {canDelete && (
                    <>
                        <ConfirmDialog
                            open={deleteDialogOpen}
                            onClose={() => setDeleteDialogOpen(false)}
                            onConfirm={handleDeleteSelected}
                            title="Delete Unused Images"
                            message={
                                <>
                                    Are you sure you want to permanently delete <strong>{selectedKeys.length}</strong> unused image(s) from Cloudflare R2? This action cannot be undone.
                                </>
                            }
                            confirmText="Delete"
                            cancelText="Cancel"
                            isLoading={isDeleting}
                            loadingText="Deleting..."
                            severity="error"
                        />
                        <ConfirmDialog
                            open={!!deleteSingleKey}
                            onClose={() => setDeleteSingleKey(null)}
                            onConfirm={handleDeleteSingle}
                            title="Delete Image"
                            message={
                                <>
                                    Are you sure you want to permanently delete <strong>{deleteSingleKey}</strong> from Cloudflare R2? This action cannot be undone.
                                </>
                            }
                            confirmText="Delete"
                            cancelText="Cancel"
                            isLoading={isDeleting}
                            loadingText="Deleting..."
                            severity="error"
                        />
                    </>
                )}
            </Box>
        </Box>
    );
};

export default UnusedImages;
