"use client";
import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { bannerApi, useGetBannersQuery, useDeleteBannerMutation } from '../../../features/api/bannerApi'
import { Box, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Switch, FormControl, MenuItem, Select, InputAdornment, TextField, Tooltip, Autocomplete, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse, CircularProgress } from '@mui/material'
import { toast } from '../../../utils/toast';
import { ConfirmDialog, AccessDenied, ActionButtons } from '../../../components/common'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import SearchIcon from '@mui/icons-material/Search'
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined'
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined'
import { getImage } from '../../../utils/helper'
import { useTheme } from '../../../context/ThemeContext'
import ViewBannerDialog from './ViewBannerDialog'
import AddBannerDialog from './AddBannerDialog'
import { useUser } from '../../../context/useUser';


const BannerManagement = () => {
    const dispatch = useDispatch()
    const { isDarkMode } = useTheme()
    const { user } = useUser();
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canList = isAdmin || userPermissions.includes('banner.list');
    const canView = isAdmin || userPermissions.includes('banner.view');
    const canCreate = isAdmin || userPermissions.includes('banner.create');
    const canUpdate = isAdmin || userPermissions.includes('banner.update');
    const canDelete = isAdmin || userPermissions.includes('banner.delete');

    if (!canList && !isAdmin) {
        return <AccessDenied message="You do not have permission to view Banner Management." />;
    }

    const { data, isLoading, isFetching, isError } = useGetBannersQuery(undefined, {
        refetchOnFocus: false,
        refetchOnReconnect: false,
    })
    const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation()
    const [addOpen, setAddOpen] = useState(false)
    const [editId, setEditId] = useState(null)
    const [editData, setEditData] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [viewBanner, setViewBanner] = useState(null)

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [debouncedStatus, setDebouncedStatus] = useState('all')
    const [showFilters, setShowFilters] = useState(false)

    const bannersRaw = useMemo(() => (
        Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    ), [data])

    const MAX_BANNERS = 5
    const canAddBanner = bannersRaw.length < MAX_BANNERS

    const handleSearchChange = (e) => {
        const value = e && e.target ? e.target.value : e;
        setSearch(value)
    }

    const handleStatusChange = (e) => {
        setStatus(e.target.value)
    }

    const handleSearch = () => {
        setDebouncedSearch(search);
        setDebouncedStatus(status);
    }

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setDebouncedSearch('');
        setDebouncedStatus('all');
    }

    useEffect(() => {
        document.title = 'Banners'
    }, [])

    useEffect(() => {
        if (editId) {
            const banner = bannersRaw.find(b => b.banner_id === editId)
            setEditData(banner || null)
        } else {
            setEditData(null)
        }
    }, [editId, bannersRaw])

    const filteredBanners = useMemo(() => {
        let result = bannersRaw;
        if (debouncedSearch) {
            result = result.filter(b => 
                b.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                (b.keywords || []).some(k => k.toLowerCase().includes(debouncedSearch.toLowerCase()))
            );
        }
        if (debouncedStatus !== 'all') {
            result = result.filter(b => 
                debouncedStatus === 'hero' ? b.is_hero : !b.is_hero
            );
        }
        return result;
    }, [bannersRaw, debouncedSearch, debouncedStatus])


    const parentLabelForView = null; // not needed but keeping for reference if any

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
        '& .MuiSelect-select': {
            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        },
        '& .MuiSvgIcon-root': {
            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteBanner(deleteId).unwrap();
            
            dispatch(
                bannerApi.util.updateQueryData('getBanners', undefined, (draft) => {
                    if (Array.isArray(draft)) {
                        const index = draft.findIndex((b) => b.banner_id === deleteId);
                        if (index !== -1) draft.splice(index, 1);
                    } else if (draft && Array.isArray(draft.data)) {
                        const index = draft.data.findIndex((b) => b.banner_id === deleteId);
                        if (index !== -1) draft.data.splice(index, 1);
                    }
                })
            );

            toast.success('Banner deleted successfully');
            setDeleteId(null);
        } catch (error) {
            console.error('Failed to delete banner:', error);
            toast.error(error?.data?.message || 'Failed to delete banner');
        }
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
                            Banners
                        </Typography>
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
                        {canAddBanner && canCreate && (
                            <Tooltip title={!canAddBanner ? `Maximum ${MAX_BANNERS} banners allowed` : ''}>
                                <span>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setEditId(null)
                                            setEditData(null)
                                            setAddOpen(true)
                                        }}
                                        disabled={!canAddBanner}
                                        sx={{
                                            height: '38px',
                                            textTransform: 'none',
                                            px: 3,
                                            fontSize: '16px',
                                            bgcolor: '#7367f0',
                                            boxShadow: 'none',
                                            '&:hover': { bgcolor: '#5e50ee', boxShadow: 'none' },
                                        }}
                                    >
                                        + Add
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                <Collapse in={showFilters}>
                    <Box sx={{ p: 3, borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}>
                        <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <Box className="flex flex-wrap items-center gap-4">
                                <Box className="flex items-center gap-2">
                                    <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                        Status:
                                    </Typography>
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <Autocomplete
                                            size="small"
                                            options={[
                                                { label: 'All Status', value: 'all' },
                                                { label: 'Hero', value: 'hero' },
                                                { label: 'Regular', value: 'regular' }
                                            ]}
                                            getOptionLabel={(option) => option.label || ''}
                                            value={
                                                [
                                                    { label: 'All Status', value: 'all' },
                                                    { label: 'Hero', value: 'hero' },
                                                    { label: 'Regular', value: 'regular' }
                                                ].find(opt => opt.value === status) || { label: 'All Status', value: 'all' }
                                            }
                                            onChange={(_, newValue) => {
                                                handleStatusChange({ target: { value: newValue ? newValue.value : 'all' } });
                                            }}
                                            isOptionEqualToValue={(option, value) => option.value === value.value}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="All Status"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            padding: '0 39px 0 0 !important',
                                                            height: 38,
                                                            ...selectStyles,
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
                                                                        bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                                                    }
                                                                },
                                                                '&:hover': {
                                                                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.08) !important' : 'rgba(115, 103, 240, 0.08) !important',
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
                                
                                <Box className="flex items-center gap-2">
                                    <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                        Search:
                                    </Typography>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={handleSearchChange}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search banners..."
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
                            </Box>
                            <Box className="flex items-center gap-3">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleClearFilters}
                                    disabled={search === '' && status === 'all' && debouncedSearch === '' && debouncedStatus === 'all'}
                                    sx={{ height: '38px', minWidth: { xs: '38px', sm: '100px' }, textTransform: 'none', px: { xs: 0, sm: 3 } }}
                                >
                                    <ClearAllIcon sx={{ mr: { xs: 0, sm: 1 } }} />
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
                                <TableCell align="center" width={60}>#</TableCell>
                                <TableCell align="center" width={140}>IMAGE</TableCell>
                                <TableCell>TITLE</TableCell>
                                <TableCell align="center">BUTTON TEXT</TableCell>
                                <TableCell align="center">HERO</TableCell>
                                <TableCell align="center">ORDER</TableCell>
                                {(canView || canUpdate || canDelete) && <TableCell align="center" width={150}>ACTIONS</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isFetching) ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredBanners.length === 0 ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8, color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: 'none' }}>
                                        <Typography variant="body1">No banners found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBanners.map((rowItem, index) => {
                                    return (
                                        <TableRow 
                                            key={rowItem.banner_id || index}
                                            sx={{ 
                                                height: '60px',
                                                backgroundColor: index % 2 === 0 ? (isDarkMode ? '#283046' : '#ffffff') : (isDarkMode ? '#283046' : '#fafbfc'),
                                                transition: 'background-color 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8',
                                                },
                                                '& td': {
                                                    borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                    py: 1.5,
                                                    px: 2,
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                }
                                            }}
                                        >
                                            <TableCell align="center">{index + 1}</TableCell>
                                            <TableCell align="center">
                                                {!rowItem.image ? (
                                                    <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>No Image</Typography>
                                                ) : (
                                                    <Box component="img" src={getImage(rowItem.image)} alt={rowItem.title || 'banner'} sx={{ width: 110, height: 60, objectFit: 'cover', borderRadius: '4px' }} />
                                                )}
                                            </TableCell>
                                            <TableCell>{rowItem.title || '—'}</TableCell>
                                            <TableCell align="center">{rowItem.button_text || '—'}</TableCell>
                                            <TableCell align="center">
                                                {rowItem.is_hero ? (
                                                    <CheckCircleIcon sx={{ color: isDarkMode ? '#10b981' : '#059669', fontSize: 20 }} />
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>—</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">{rowItem.is_hero ? rowItem.order : '—'}</TableCell>
                                            {(canView || canUpdate || canDelete) && (
                                                <TableCell align="center">
                                                    <ActionButtons
                                                        onView={() => setViewBanner(rowItem)}
                                                        onEdit={() => { setEditId(rowItem.banner_id); setAddOpen(true); }}
                                                        onDelete={() => setDeleteId(rowItem.banner_id)}
                                                        showView={canView}
                                                        showEdit={canUpdate}
                                                        showDelete={canDelete}
                                                        isDarkMode={isDarkMode}
                                                    />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <AddBannerDialog 
                open={addOpen || !!editId} 
                onClose={() => { setAddOpen(false); setEditId(null); }} 
                mode={editId ? 'edit' : 'add'} 
                bannerId={editId} 
                bannerData={editData} 
                existingBanners={bannersRaw}
            />
            <ViewBannerDialog 
                open={!!viewBanner} 
                onClose={() => setViewBanner(null)} 
                banner={viewBanner} 
            />
            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Banner"
                message={
                    <>
                        Are you sure you want to delete <strong>{bannersRaw.find(b => b.banner_id === deleteId)?.title}</strong>?
                    </>
                }
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                loadingText="Deleting..."
                severity="error"
            />
        </Box>
    )
}

export default BannerManagement
