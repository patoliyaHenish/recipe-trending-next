"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  TextField,
  Pagination,
  Tooltip
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { toast } from '../../utils/toast';
import { useTheme } from '../../context/ThemeContext'
import { useGetAllNotificationsQuery, useDeleteNotificationMutation, useClearNotificationsMutation } from '../../features/api/notificationApi'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import moment from 'moment'

ModuleRegistry.registerModules([AllCommunityModule])

import { useSelector } from 'react-redux';
import { AccessDenied, ConfirmDialog } from '../../components/common';

const Notifications = () => {
  useEffect(() => {
    document.title = 'Notifications Management'
  }, [])

  const { isDarkMode } = useTheme()
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canList = isAdmin || userPermissions.includes('notifications.list');
  const canViewDetail = isAdmin || userPermissions.includes('notifications.view');
  const canDelete = isAdmin || userPermissions.includes('notifications.delete');

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view Notifications." />;
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')
  const [type, setType] = useState(() => searchParams.get('type') || '')
  const [debouncedType, setDebouncedType] = useState(() => searchParams.get('type') || '')
  
  const [deleteId, setDeleteId] = useState(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [viewLog, setViewLog] = useState(null)

  const { data, isLoading, isFetching } = useGetAllNotificationsQuery(
    { page, limit, type: debouncedType, search: debouncedSearch },
    { refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: true }
  )

  const [deleteLog, { isLoading: isDeleting }] = useDeleteNotificationMutation()
  const [clearLogs, { isLoading: isClearing }] = useClearNotificationsMutation()

  const [displayedLogs, setDisplayedLogs] = useState([])
  const [displayedPagination, setDisplayedPagination] = useState({ total: 0, page: 1, limit, totalPages: 1 })

  useEffect(() => {
    if (data && !isFetching) {
      setDisplayedLogs(data.data || [])
      setDisplayedPagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 })
    }
  }, [data, isFetching, limit])

  const logs = displayedLogs
  const pagination = displayedPagination

  const hasActiveFilters = search !== '' || type !== '' || debouncedSearch !== '' || debouncedType !== '';

  const handleSearchClick = () => {
    setDebouncedSearch(search);
    setDebouncedType(type);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (search) next.set('search', search); else next.delete('search');
      if (type) next.set('type', type); else next.delete('type');
      next.set('page', '1');
      return next;
    });
  };

  const typeOptions = useMemo(() => {
    const dbTypes = pagination?.types || [];
    return [
      { label: 'All Types', value: '' },
      ...dbTypes.map(t => ({ label: t, value: t }))
    ];
  }, [pagination?.types]);

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setType('');
    setDebouncedType('');
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('search');
      next.delete('type');
      next.delete('page');
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteLog(deleteId).unwrap()
      toast.success('Notification deleted successfully')
      setDisplayedLogs((prev) => prev.filter((log) => log.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete notification')
    }
  }

  const handleClearAll = async () => {
    if (!type) return
    try {
      await clearLogs(type).unwrap()
      toast.success(`${type} notifications cleared successfully`)
      setClearDialogOpen(false)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clear notifications')
    }
  }

  const columnDefs = useMemo(
    () => [
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 70,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Type',
        field: 'type',
        width: 240,
        cellRenderer: (params) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#3b82f6',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}
                >
                    {params.value || 'General'}
                </Typography>
            </div>
        ),
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Title',
        field: 'title',
        flex: 1,
        minWidth: 150,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        },
      },
      {
        headerName: 'User / Email',
        field: 'user_email',
        flex: 1,
        minWidth: 150,
        valueGetter: (params) => params.data.user_email || 'System',
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Read?',
        field: 'is_read',
        width: 100,
        cellRenderer: (params) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography
                variant="body2"
                sx={{
                    color: params.value ? '#10b981' : '#f59e0b',
                    fontWeight: 'bold',
                    backgroundColor: params.value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                }}
            >
                {params.value ? 'YES' : 'NO'}
            </Typography>
          </div>
        ),
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Timestamp',
        field: 'created_at',
        width: 180,
        valueFormatter: (params) => moment(params.value).format('MMM D, h:mm A'),
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
        ...(canViewDetail || canDelete ? [{
          headerName: 'Actions',
          width: 120,
          cellStyle: { textAlign: 'center' },
          headerClass: 'ag-header-center',
          cellRenderer: (params) => (
            <Box className="flex gap-2 justify-center items-center h-full">
              {canViewDetail && (
                <Tooltip title="View" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setViewLog(params.data)}
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
              {canDelete && (
                <Tooltip title="Delete" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteId(params.data.id)}
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
          ),
        }] : []),
    ], [canViewDetail, canDelete, isDarkMode]);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
    }),
    []
  )

  const selectStyles = {
    backgroundColor: isDarkMode ? '#283046' : '#fff',
    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
    '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
    '&:hover fieldset': { borderColor: '#7367f0 !important' },
    '&.Mui-focused fieldset': { borderColor: '#7367f0 !important' },
  };

  const syncUrlParams = (newPage, newLimit) => {
      setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (newPage > 1) next.set('page', newPage.toString());
          else next.delete('page');
          if (newLimit !== 50) next.set('limit', newLimit.toString());
          else next.delete('limit');
          return next;
      });
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
                            Notifications
                        </Typography>
                    </Box>
                </Box>

                {/* ── Filters row ───────────────────────────────────────────── */}
                <Box className="flex flex-col p-5 gap-4">
                        <Box className="flex flex-wrap items-center gap-4">
                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                    Search:
                                </Typography>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
                                    placeholder="Search notifications..."
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

                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                    Type:
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 260 }}>
                                    <Autocomplete
                                        size="small"
                                        options={typeOptions}
                                        getOptionLabel={(option) => option.label || ''}
                                        value={
                                            typeOptions.find(opt => opt.value === type) || { label: 'All Types', value: '' }
                                        }
                                        onChange={(_, newValue) => {
                                            const value = newValue ? newValue.value : '';
                                            setType(value);
                                        }}
                                        isOptionEqualToValue={(option, value) => option.value === value.value}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="All Types"
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
                                                    '& .MuiAutocomplete-listbox': { padding: '0', '& .MuiAutocomplete-option': { fontSize: '0.9rem', '&:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' } } }
                                                }
                                            }
                                        }}
                                    />
                                </FormControl>
                            </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Box className="flex justify-end items-center gap-3">
                            {canDelete && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => setClearDialogOpen(true)}
                                    disabled={!type && logs.length === 0}
                                    startIcon={<ClearAllIcon />}
                                    sx={{ height: '38px', textTransform: 'none', mr: 'auto', px: 3 }}
                                >
                                    Clear Data
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleClearFilters}
                                disabled={!hasActiveFilters}
                                sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3 }}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSearchClick}
                                sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3, bgcolor: '#7367f0', '&:hover': { bgcolor: '#5e50ee' }, boxShadow: 'none' }}
                            >
                                Search
                            </Button>
                        </Box>
                    </Box>

                <Box
                    className={`${isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full`}
                    sx={{
                        flex: 1,
                        width: '100%',
                        height: 'auto',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        '& .ag-root-wrapper': {
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 0,
                            width: '100%',
                            height: '100%',
                        },
                        '& .ag-root': { backgroundColor: 'transparent' },
                        '& .ag-header': {
                            backgroundColor: isDarkMode ? '#283046' : '#f3f2f7',
                            borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                            borderTop: 'none',
                        },
                        '& .ag-header-cell': {
                            color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        },
                        '& .ag-row': {
                            borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'} !important`,
                            backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            transition: 'background-color 0.2s ease',
                        },
                        '& .ag-row:hover': {
                            backgroundColor: isDarkMode ? '#2f3851 !important' : '#f8f8f8 !important',
                        },
                        '& .ag-header-cell-label': { justifyContent: 'center' },
                        '& .ag-header-center .ag-header-cell-label': { justifyContent: 'center' },
                        '& .ag-body-viewport': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-center-cols-viewport': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-center-cols-container': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-root-wrapper-body': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-body-horizontal-scroll': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-row-even': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-row-odd': { backgroundColor: isDarkMode ? '#283046' : '#fafbfc' },
                        '& .ag-cell': {
                            display: 'flex',
                            alignItems: 'center',
                            border: 'none',
                        },
                    }}
                >
                    <AgGridReact
                        enableCellTextSelection={true}
                        ensureDomOrder={true}
                        rowData={logs}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        domLayout="autoHeight"
                        rowHeight={60}
                        headerHeight={48}
                        animateRows={false}
                        loading={isLoading || isFetching}
                        overlayLoadingTemplate='<span class="ag-overlay-loading-center">Loading...</span>'
                        overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">No notifications found</span>'
                    />
                </Box>

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
                            Showing {Math.min((pagination.page - 1) * limit + 1, pagination.total || 0)} to {Math.min(pagination.page * limit, pagination.total || 0)} of {pagination.total || 0} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={pagination.totalPages || 1}
                        page={pagination.page || 1}
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
            </Box>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewLog}
        onClose={() => setViewLog(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            backgroundColor: isDarkMode ? '#283046' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
            boxShadow: isDarkMode ? '0 15px 30px rgba(0,0,0,0.3)' : '0 15px 30px rgba(0,0,0,0.1)',
          },
        }}
      >
        <DialogTitle
          className="flex items-center justify-between"
          sx={{ borderBottom: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, py: 2.5 }}
        >
          <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
            Notification Details
          </Typography>
          <IconButton onClick={() => setViewLog(null)} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            py: 3,
            backgroundColor: isDarkMode ? '#283046' : '#ffffff',
            borderColor: isDarkMode ? '#404656' : '#ebe9f1',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }, 
              gap: 3,
              bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
          }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Type</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  label={viewLog?.type?.toUpperCase() || 'GENERAL'} 
                  size="small" 
                  sx={{ 
                      backgroundColor: viewLog?.type === 'NEW_RECIPE' ? (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5') : (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe'),
                      color: viewLog?.type === 'NEW_RECIPE' ? (isDarkMode ? '#34d399' : '#059669') : (isDarkMode ? '#60a5fa' : '#2563eb'),
                      fontWeight: 600, 
                      borderRadius: '4px' 
                  }}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Timestamp</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                {moment(viewLog?.created_at).format('MMMM D, YYYY h:mm:ss A')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>User Name</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>{viewLog?.user_name || 'System'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>User Email</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>{viewLog?.user_email || 'System'}</Typography>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Title</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                {viewLog?.title || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
              bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', mb: 1, display: 'block' }}>Message</Typography>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6', 
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflowY: 'auto',
                borderRadius: 1,
                border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                color: isDarkMode ? '#d1d5db' : '#374151'
              }}
            >
              {viewLog?.message}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
          <Button onClick={() => setViewLog(null)} variant="outlined" sx={{ 
              borderColor: isDarkMode ? '#404656' : '#ebe9f1',
              color: isDarkMode ? '#d1d5db' : '#374151',
              '&:hover': {
                  borderColor: isDarkMode ? '#9ca3af' : '#9ca3af',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
              }
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Notification"
        severity="error"
        isLoading={isDeleting}
        confirmText="Delete"
        message={
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Are you sure you want to permanently delete this notification?
          </Typography>
        }
      />

      {/* Clear All Dialog */}
      <ConfirmDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearAll}
        title={`Clear ${type || 'All'} Notifications`}
        severity="error"
        isLoading={isClearing}
        confirmText="Clear All"
        message={
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Are you sure you want to delete <strong>all</strong> {type || 'matching'} notifications? This action cannot be undone.
          </Typography>
        }
      />
    </Box>
  )
}

export default Notifications

