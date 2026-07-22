"use client";
import React, { useState, useMemo, useEffect } from 'react'
import { Box, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Switch, Chip, FormControl, Select, MenuItem, Pagination, Autocomplete, TextField, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse, CircularProgress } from '@mui/material'
import { useTheme } from '../../../context/ThemeContext'
import { toast } from '../../../utils/toast';
import { PageHeader, ConfirmDialog, SearchBar } from '../../../components/common'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import SearchIcon from '@mui/icons-material/Search'
import { FilterAltOutlined, FilterAltOffOutlined } from '@mui/icons-material'
import { useGetNavItemsQuery, useDeleteNavItemMutation, useUpdateNavItemMutation } from '../../../features/api/navItemApi'
import AddNavItemDialog from './AddNavItemDialog'
import ViewNavItemDialog from './ViewNavItemDialog'
import { useSelector } from 'react-redux';
import { AccessDenied } from '../../../components/common';

const NavbarManagement = () => {
    const { isDarkMode } = useTheme()
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canList = isAdmin || userPermissions.includes('nav.list');
    const canView = isAdmin || userPermissions.includes('nav.view');
    const canCreate = isAdmin || userPermissions.includes('nav.create');
    const canUpdate = isAdmin || userPermissions.includes('nav.update');
    const canDelete = isAdmin || userPermissions.includes('nav.delete');
    const canPublish = isAdmin || userPermissions.includes('nav.publish');

    useEffect(() => {
        document.title = 'Navbar'
    }, [])

    const { data: navItems, isLoading, isFetching } = useGetNavItemsQuery(undefined, { skip: !canList && !isAdmin })
    const [deleteNavItem, { isLoading: isDeleting }] = useDeleteNavItemMutation()
    const [updateNavItem, { isLoading: isUpdating }] = useUpdateNavItemMutation()

    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [viewItem, setViewItem] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [toggleItem, setToggleItem] = useState(null)

    const [showFilters, setShowFilters] = useState(false)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [debouncedStatus, setDebouncedStatus] = useState('all')

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

    const handleEdit = (item) => {
        setEditItem(item)
        setAddDialogOpen(true)
    }

    const handleDelete = (id) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        try {
            await deleteNavItem(deleteId).unwrap()
            toast.success('Navigation item deleted successfully')
            setDeleteId(null)
        } catch (error) {
            toast.error('Failed to delete navigation item')
        }
    }

    const confirmToggleActive = async () => {
        if (!toggleItem) return;
        try {
            await updateNavItem({
                id: toggleItem.id,
                label: toggleItem.label,
                path: toggleItem.path,
                parent_id: toggleItem.parent_id,
                order_index: toggleItem.order_index,
                visibility: toggleItem.visibility,
                open_in_new_tab: toggleItem.open_in_new_tab,
                is_active: !toggleItem.is_active
            }).unwrap()
            toast.success('Status updated successfully')
            setToggleItem(null)
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const getVisibilityColor = (visibility) => {
        switch (visibility) {
            case 'ADMIN': return '#ef4444';
            case 'AUTH': return '#3b82f6';
            default: return '#10b981';
        }
    }

    const rowData = useMemo(() => {
        if (!Array.isArray(navItems?.data)) return [];

        let filteredItems = navItems.data;
        if (debouncedSearch) {
            filteredItems = filteredItems.filter(item =>
                item.label.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (item.path && item.path.toLowerCase().includes(debouncedSearch.toLowerCase()))
            );
        }
        if (debouncedStatus !== 'all') {
            filteredItems = filteredItems.filter(item =>
                debouncedStatus === 'active' ? item.is_active : !item.is_active
            );
        }

        const visibilityPriority = { 'PUBLIC': 1, 'AUTH': 2, 'ADMIN': 3 };
        const visibilityLabels = { 'PUBLIC': 'Public Navigation', 'AUTH': 'Authenticated Navigation', 'ADMIN': 'Admin Navigation' };

        const sortedItems = [...filteredItems].sort((a, b) => {
            if (visibilityPriority[a.visibility] !== visibilityPriority[b.visibility]) {
                return visibilityPriority[a.visibility] - visibilityPriority[b.visibility];
            }
            return a.order_index - b.order_index;
        });

        const result = [];
        const processedIds = new Set();

        const addItemsRecursively = (parentId) => {
            const children = sortedItems.filter(item => item.parent_id === parentId);
            children.forEach(child => {
                if (!processedIds.has(child.id)) {
                    processedIds.add(child.id);
                    result.push(child);
                    addItemsRecursively(child.id);
                }
            });
        };

        ['PUBLIC', 'AUTH', 'ADMIN'].forEach(vis => {
            const topLevelItems = sortedItems.filter(item => item.visibility === vis && !item.parent_id);
            if (topLevelItems.length > 0) {
                result.push({
                    isHeader: true,
                    headerLabel: visibilityLabels[vis],
                    visibility: vis,
                    id: `header-${vis}`
                });

                topLevelItems.forEach(parent => {
                    if (!processedIds.has(parent.id)) {
                        processedIds.add(parent.id);
                        result.push(parent);
                        addItemsRecursively(parent.id);
                    }
                });
            }
        });

        sortedItems.forEach(item => {
            if (!processedIds.has(item.id)) {
                result.push(item);
                processedIds.add(item.id);
            }
        });

        return result;
    }, [navItems, debouncedSearch, debouncedStatus])

    const parentLabelForView = viewItem?.parent_id ? navItems?.data?.find(i => i.id === viewItem.parent_id)?.label : null;

    const selectStyles = {
        bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
        color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
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
        '& .MuiSvgIcon-root': {
            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        },
    };

    if (!canList && !isAdmin) {
        return <AccessDenied message="You do not have permission to view Navbar." />;
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
                            Navbar
                        </Typography>
                    </Box>
                    <Box className="flex gap-2 sm:gap-4 flex-wrap">
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
                        {canCreate && (
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setEditItem(null)
                                    setAddDialogOpen(true)
                                }}
                                sx={{
                                    height: '38px',
                                    textTransform: 'none',
                                    px: { xs: 2, sm: 3 },
                                    fontSize: { xs: '14px', sm: '16px' },
                                    bgcolor: '#7367f0',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#5e50ee', boxShadow: 'none' },
                                }}
                            >
                                + Add
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* ── Filters row ───────────────────────────────────────────── */}
                <Collapse in={showFilters}>
                    <Box className="flex flex-col p-5 gap-4" sx={{ borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>
                        <Box className="flex items-center gap-3" sx={{ width: '100%' }}>
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}>
                                    Search:
                                </Typography>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={handleSearchChange}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search nav items..."
                                    className="px-3 py-2 border rounded outline-none transition-colors"
                                    style={{
                                        height: '38px',
                                        flex: 1,
                                        minWidth: 0,
                                        backgroundColor: isDarkMode ? '#283046' : '#fff',
                                        borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        borderRadius: '4px',
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleClearFilters}
                                    disabled={search === '' && status === 'all' && debouncedSearch === '' && debouncedStatus === 'all'}
                                    sx={{ height: '38px', minWidth: { xs: '38px', sm: '100px' }, textTransform: 'none', px: { xs: 0, sm: 3 }, flexShrink: 0 }}
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
                                        flexShrink: 0,
                                    }}
                                >
                                    <SearchIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Search</Box>
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
                                <TableCell align="center" width={60}>#</TableCell>
                                <TableCell>LABEL</TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>PATH</TableCell>
                                <TableCell align="center">VISIBILITY</TableCell>
                                <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>PARENT</TableCell>
                                <TableCell align="center">ORDER</TableCell>
                                <TableCell align="center">LIVE</TableCell>
                                {(canView || canUpdate || canDelete) && <TableCell align="center" width={150}>ACTIONS</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isFetching) ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : rowData.length === 0 ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8, color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: 'none' }}>
                                        <Typography variant="body1">No navbar items found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rowData.map((rowItem, index) => {
                                    if (rowItem.isHeader) {
                                        return (
                                            <TableRow key={`header-${index}`}>
                                                <TableCell colSpan={8} sx={{
                                                    backgroundColor: isDarkMode ? '#283046' : '#f3f4f6',
                                                    fontWeight: 800,
                                                    fontSize: '0.75rem',
                                                    color: rowItem.visibility === 'ADMIN' ? '#ef4444' : (isDarkMode ? '#10b981' : '#059669'),
                                                    padding: '0 20px',
                                                    height: '40px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1.5px',
                                                    borderBottom: `2px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                    borderTop: 'none'
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Box component="span" sx={{ opacity: 0.6, mr: 1, fontSize: '0.6rem' }}>▶</Box>
                                                        {rowItem.headerLabel}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    let count = 0;
                                    for (let i = 0; i <= index; i++) {
                                        if (rowData[i] && !rowData[i].isHeader) count++;
                                    }


                                    const pathDisplay = rowItem.path ? (rowItem.path.startsWith('/') || rowItem.path.startsWith('http') ? rowItem.path : `/${rowItem.path}`) : '-';
                                    const parentLabel = rowItem.parent_id ? navItems?.data?.find(item => item.id === rowItem.parent_id)?.label : '-';
                                    const isParentInactive = rowItem.parent_id && navItems?.data?.find(item => item.id === rowItem.parent_id)?.is_active === false;

                                    return (
                                        <TableRow
                                            key={rowItem.id}
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
                                                }
                                            }}
                                        >
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                    {count}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    paddingLeft: rowItem.parent_id ? '20px' : '0px',
                                                    fontWeight: rowItem.parent_id ? 400 : 600,
                                                    color: rowItem.parent_id && isDarkMode ? '#9ca3af' : (isDarkMode ? '#e5e7eb' : '#334155')
                                                }}>
                                                    {rowItem.parent_id && (
                                                        <Box component="span" sx={{ mr: 1, opacity: 0.5 }}>└</Box>
                                                    )}
                                                    {rowItem.label}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                    {pathDisplay}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={rowItem.visibility}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        height: '20px',
                                                        fontWeight: 700,
                                                        color: getVisibilityColor(rowItem.visibility),
                                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                                                        border: `1px solid ${getVisibilityColor(rowItem.visibility)}33`,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                    {parentLabel}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                    {rowItem.order_index}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Switch
                                                    checked={rowItem.is_active}
                                                    onChange={() => setToggleItem(rowItem)}
                                                    color="success"
                                                    size="small"
                                                    disabled={isParentInactive || !canPublish}
                                                />
                                            </TableCell>
                                            {(canView || canUpdate || canDelete) && (
                                                <TableCell align="center">
                                                    <Box display="flex" gap={1} justifyContent="center" alignItems="center">
                                                        {canView && (
                                                            <Tooltip title="View" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => setViewItem(rowItem)}
                                                                    sx={{
                                                                        color: isDarkMode ? '#10b981' : '#059669',
                                                                        '&:hover': {
                                                                            backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5',
                                                                        },
                                                                    }}
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                        <circle cx="12" cy="12" r="3"></circle>
                                                                    </svg>
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {canUpdate && (
                                                            <Tooltip title="Edit" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleEdit(rowItem)}
                                                                    sx={{
                                                                        color: isDarkMode ? '#3b82f6' : '#2563eb',
                                                                        '&:hover': {
                                                                            backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                                                                        },
                                                                    }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {canDelete && (
                                                            <Tooltip title="Delete" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDelete(rowItem.id)}
                                                                    disabled={isDeleting}
                                                                    sx={{
                                                                        color: isDarkMode ? '#ef4444' : '#dc2626',
                                                                        '&:hover': {
                                                                            backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                                                                        },
                                                                    }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ── Pagination ────────────────────────────────────────────── */}
            </Box>

            <AddNavItemDialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                editItem={editItem}
            />

            <ViewNavItemDialog
                open={!!viewItem}
                onClose={() => setViewItem(null)}
                item={viewItem}
                parentLabel={parentLabelForView}
            />

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Item"
                message={
                    <>
                        Are you sure you want to remove this navigation item?
                    </>
                }
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                loadingText="Deleting..."
                severity="error"
            />

            <ConfirmDialog
                open={!!toggleItem}
                onClose={() => setToggleItem(null)}
                onConfirm={confirmToggleActive}
                title="Change Status"
                message={
                    <>
                        Are you sure you want to {toggleItem?.is_active ? 'deactivate' : 'activate'} this navigation item?
                    </>
                }
                confirmText="Confirm"
                cancelText="Cancel"
                isLoading={isUpdating}
                loadingText="Updating..."
                severity="primary"
            />
        </Box>
    )
}

export default NavbarManagement
