"use client";
import React, { useState, useMemo, useEffect } from 'react'
import { Box, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Switch, FormControl, MenuItem, Select, InputAdornment, TextField, Autocomplete, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse, CircularProgress } from '@mui/material'
import { useTheme } from '../../../context/ThemeContext'
import { toast } from '../../../utils/toast';
import { PageHeader, ConfirmDialog } from '../../../components/common'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import SearchIcon from '@mui/icons-material/Search'
import { FilterAltOutlined, FilterAltOffOutlined } from '@mui/icons-material'
import { useGetFooterItemsQuery, useDeleteFooterItemMutation, useUpdateFooterItemMutation } from '../../../features/api/footerApi'
import AddFooterItemDialog from './AddFooterItemDialog'
import ViewFooterItemDialog from './ViewFooterItemDialog'
import { useSelector } from 'react-redux';
import { AccessDenied } from '../../../components/common';

const FooterManagement = () => {
    const { isDarkMode } = useTheme()
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canList = isAdmin || userPermissions.includes('footer.list');
    const canView = isAdmin || userPermissions.includes('footer.view');
    const canCreate = isAdmin || userPermissions.includes('footer.create');
    const canUpdate = isAdmin || userPermissions.includes('footer.update');
    const canDelete = isAdmin || userPermissions.includes('footer.delete');
    const canPublish = isAdmin || userPermissions.includes('footer.publish');

    useEffect(() => {
        document.title = 'Footer'
    }, [])

    const { data: footerItems, isLoading, isFetching } = useGetFooterItemsQuery(undefined, { skip: !canList && !isAdmin })
    const [deleteFooterItem, { isLoading: isDeleting }] = useDeleteFooterItemMutation()
    const [updateFooterItem, { isLoading: isUpdating }] = useUpdateFooterItemMutation()

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
            await deleteFooterItem(deleteId).unwrap()
            toast.success('Footer item deleted successfully')
            setDeleteId(null)
        } catch (error) {
            toast.error('Failed to delete footer item')
        }
    }

    const confirmToggleActive = async () => {
        if (!toggleItem) return;
        try {
            await updateFooterItem({
                id: toggleItem.id,
                label: toggleItem.label,
                path: toggleItem.path,
                open_in_new_tab: toggleItem.open_in_new_tab,
                order_index: toggleItem.order_index,
                is_active: !toggleItem.is_active
            }).unwrap()
            toast.success('Status updated successfully')
            setToggleItem(null)
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const rowData = useMemo(() => {
        if (!Array.isArray(footerItems?.data)) return [];

        let filteredItems = footerItems.data;
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

        const sortedItems = [...filteredItems].sort((a, b) => {
            return a.order_index - b.order_index;
        });

        return sortedItems;
    }, [footerItems, debouncedSearch, debouncedStatus])

    const totalCount = rowData.length;

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
        return <AccessDenied message="You do not have permission to view Footer Management." />;
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
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                        >
                            Footer
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
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
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
                                    px: 3,
                                    fontSize: '16px',
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
                        <Box className="flex flex-wrap items-center justify-between gap-4">
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
                                                { label: 'Active', value: 'active' },
                                                { label: 'Inactive', value: 'inactive' }
                                            ]}
                                            getOptionLabel={(option) => option.label || ''}
                                            value={
                                                [
                                                    { label: 'All Status', value: 'all' },
                                                    { label: 'Active', value: 'active' },
                                                    { label: 'Inactive', value: 'inactive' }
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
                                            sx={{ 
                                                width: '100%',
                                                '& .MuiAutocomplete-popupIndicator': {
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                },
                                                '& .MuiAutocomplete-clearIndicator': {
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
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
                                        placeholder="Search footer items..."
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
                                <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>NEW TAB</TableCell>
                                <TableCell align="center">ORDER</TableCell>
                                <TableCell align="center">LIVE</TableCell>
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
                            ) : rowData.length === 0 ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8, color: isDarkMode ? '#b4b7bd' : '#6e6b7b', borderBottom: 'none' }}>
                                        <Typography variant="body1">No footer items found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rowData.map((rowItem, index) => {
                                    const pathDisplay = rowItem.path ? (rowItem.path.startsWith('/') || rowItem.path.startsWith('http') ? rowItem.path : `/${rowItem.path}`) : '-';

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
                                                    {index + 1}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#334155' }}>
                                                    {rowItem.label}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                    {pathDisplay}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                    {rowItem.open_in_new_tab ? 'Yes' : 'No'}
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
                                                    disabled={!canPublish}
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
            </Box>

            <AddFooterItemDialog 
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                editItem={editItem}
            />

            <ViewFooterItemDialog 
                open={!!viewItem}
                onClose={() => setViewItem(null)}
                item={viewItem}
            />
            
            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Item"
                message={
                    <>
                        Are you sure you want to remove this footer item?
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
                        Are you sure you want to {toggleItem?.is_active ? 'deactivate' : 'activate'} this footer item?
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

export default FooterManagement
