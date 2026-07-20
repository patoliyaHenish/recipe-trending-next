"use client";
import React, { useEffect, useState, useRef } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { toast } from '../../utils/toast';
import { useTheme } from '../../context/ThemeContext'
import { useGetAllFailedLogsQuery, useDeleteFailedLogMutation, useClearFailedLogsMutation } from '../../features/api/failedLogApi'
import { PageHeader, SearchBar, ConfirmDialog } from '../../components/common'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import moment from 'moment'

import { useSelector } from 'react-redux';
import { AccessDenied } from '../../components/common';

const FailedLogs = () => {
  useEffect(() => {
    document.title = 'Failed Logs Management'
  }, [])

  const { isDarkMode } = useTheme()
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canList = isAdmin || userPermissions.includes('failed_logs.list');
  const canViewDetail = isAdmin || userPermissions.includes('failed_logs.view');
  const canDelete = isAdmin || userPermissions.includes('failed_logs.delete');

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view System Logs." />;
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')
  const [logType, setLogType] = useState(() => searchParams.get('type') || '')
  
  const [deleteId, setDeleteId] = useState(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [viewLog, setViewLog] = useState(null)

  const { data, isLoading, isFetching } = useGetAllFailedLogsQuery(
    { page, limit, log_type: logType, search: debouncedSearch },
    { refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: true }
  )

  const [deleteLog, { isLoading: isDeleting }] = useDeleteFailedLogMutation()
  const [clearLogs, { isLoading: isClearing }] = useClearFailedLogsMutation()

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
  const colCount = canViewDetail || canDelete ? 7 : 6
  const headerCells = ['#', 'Type', 'User / Email', 'IP Address', 'API URL', 'Timestamp', ...(canViewDetail || canDelete ? ['Actions'] : [])]

  const searchTimerRef = useRef(null)
  const onSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set('search', value)
        else next.delete('search')
        return next
      })
    }, 400)
  }

  const handleTypeChange = (e) => {
    const value = e.target.value
    setLogType(value)
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('type', value)
      else next.delete('type')
      return next
    })
  }

  const handleLimitChange = (e) => {
    setLimit(e.target.value)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteLog(deleteId).unwrap()
      toast.success('Log entry deleted successfully')
      setDisplayedLogs((prev) => prev.filter((log) => log.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete log')
    }
  }

  const handleClearAll = async () => {
    if (!logType) return
    try {
      await clearLogs(logType).unwrap()
      toast.success(`${logType} logs cleared successfully`)
      setClearDialogOpen(false)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clear logs')
    }
  }

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

  const DetailRow = ({ label, value, children }) => (
      <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {label}
              </Typography>
          </Box>
          {children ? children : (
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                  {value || 'N/A'}
              </Typography>
          )}
      </Box>
  );

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
                    className="flex flex-col gap-4 p-4 sm:p-5 border-b"
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
                            Failed Logs
                        </Typography>
                    </Box>
                    <Box className="flex flex-wrap items-center gap-3 w-full">
                        <FormControl size="small" sx={{ minWidth: 260 }}>
                            <Autocomplete
                                size="small"
                                options={[
                                    { label: 'All Types', value: '' },
                                    { label: 'Failed Logins', value: 'login' },
                                    { label: 'API Errors', value: 'api_error' },
                                ]}
                                getOptionLabel={(option) => option.label || ''}
                                value={
                                    [
                                        { label: 'All Types', value: '' },
                                        { label: 'Failed Logins', value: 'login' },
                                        { label: 'API Errors', value: 'api_error' },
                                    ].find(opt => opt.value === logType) || { label: 'All Types', value: '' }
                                }
                                onChange={(_, newValue) => {
                                    const value = newValue ? newValue.value : '';
                                    setLogType(value);
                                    setPage(1);
                                    setSearchParams((prev) => {
                                        const next = new URLSearchParams(prev);
                                        if (value) next.set('type', value); else next.delete('type');
                                        return next;
                                    });
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

                        <TextField
                            size="small"
                            placeholder="Search logs..."
                            value={search}
                            onChange={onSearchChange}
                            sx={{
                                minWidth: 260,
                                '& .MuiOutlinedInput-root': {
                                    height: 38,
                                    ...selectStyles,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '8px 14px',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                },
                            }}
                        />

                        {canDelete && (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => setClearDialogOpen(true)}
                                disabled={!logType}
                                startIcon={<ClearAllIcon />}
                                sx={{ height: '40px', px: 3, textTransform: 'none' }}
                            >
                                Clear {logType === 'login' ? 'Logins' : logType === 'api_error' ? 'Errors' : ''}
                            </Button>
                        )}
                    </Box>
                </Box>

                <TableContainer
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'auto',
                        backgroundColor: 'transparent',
                        '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': {
                            background: isDarkMode ? '#404656' : '#c1c1c1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: isDarkMode ? '#505666' : '#a8a8a8',
                        },
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 1000, borderCollapse: 'separate', borderSpacing: 0 }}>
                        <TableHead>
                            <TableRow>
                                {headerCells.map((headCell, index) => (
                                    <TableCell
                                        key={index}
                                        align="center"
                                        sx={{
                                            backgroundColor: isDarkMode ? '#283046' : '#f3f2f7',
                                            color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                            py: 2,
                                        }}
                                    >
                                        {headCell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading || isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={colCount} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                        <Typography sx={{ mt: 2, color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Loading...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={colCount} align="center" sx={{ py: 8 }}>
                                        <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No logs found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((row, index) => (
                                    <TableRow
                                        key={row.id || index}
                                        sx={{
                                            backgroundColor: index % 2 === 0 ? (isDarkMode ? '#283046' : '#ffffff') : (isDarkMode ? '#283046' : '#fafbfc'),
                                            transition: 'background-color 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? '#2f3851 !important' : '#f8f8f8 !important',
                                            },
                                            '& td': {
                                                borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                py: 1.5,
                                            },
                                        }}
                                    >
                                        <TableCell align="center">{index + 1}</TableCell>
                                        <TableCell align="center">
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: row.log_type === 'login' ? '#f59e0b' : '#ef4444',
                                                    fontWeight: 'bold',
                                                    backgroundColor: row.log_type === 'login' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    letterSpacing: '0.5px',
                                                    display: 'inline-block',
                                                }}
                                            >
                                                {row.log_type === 'login' ? 'LOGIN' : 'API ERROR'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">{row.user_email || 'Guest'}</TableCell>
                                        <TableCell align="center">{row.ip_address || '-'}</TableCell>
                                        <TableCell align="center">{row.api_url || '-'}</TableCell>
                                        <TableCell align="center">
                                            {row.created_at ? moment(row.created_at).format('MMM D, h:mm A') : '-'}
                                        </TableCell>
                                        {(canViewDetail || canDelete) && (
                                            <TableCell align="center">
                                                <Box className="flex gap-2 justify-center items-center h-full">
                                                    {canViewDetail && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setViewLog(row)}
                                                            sx={{
                                                                color: isDarkMode ? '#10b981' : '#059669',
                                                                '&:hover': {
                                                                    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                                                                },
                                                            }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    {canDelete && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setDeleteId(row.id)}
                                                            sx={{
                                                                color: isDarkMode ? '#ef4444' : '#dc2626',
                                                                '&:hover': {
                                                                    backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                                                                },
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
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
            Log Details
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
                  label={viewLog?.log_type?.toUpperCase() || 'GENERAL'} 
                  size="small" 
                  sx={{ 
                      backgroundColor: viewLog?.log_type === 'login' ? (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7') : (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'),
                      color: viewLog?.log_type === 'login' ? (isDarkMode ? '#fbbf24' : '#d97706') : (isDarkMode ? '#f87171' : '#dc2626'),
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
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>User Email</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>{viewLog?.user_email || 'Guest'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>IP Address</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>{viewLog?.ip_address || 'N/A'}</Typography>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>API URL</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#10b981' : '#059669' }}>
                {viewLog?.api_url || 'N/A'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ 
              bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', mb: 1, display: 'block' }}>Payload / Details</Typography>
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
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {viewLog?.details ? JSON.stringify(viewLog.details, null, 2) : 'No details available'}
              </pre>
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

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Log Entry"
        message="Are you sure you want to permanently delete this log entry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={clearDialogOpen}
        title={`Clear ${logType} Logs`}
        message={`Are you sure you want to delete all ${logType} logs? This action cannot be undone.`}
        onConfirm={handleClearAll}
        onCancel={() => setClearDialogOpen(false)}
      />
    </Box>
  )
}

export default FailedLogs

