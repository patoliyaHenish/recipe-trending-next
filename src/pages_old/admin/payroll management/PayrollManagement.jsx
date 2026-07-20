"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  Tooltip,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material'
import { toast } from '../../../utils/toast';
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { PageHeader, SearchBar, AccessDenied, ConfirmDialog } from '../../../components/common'
import { useTheme } from '../../../context/ThemeContext'
import { useUser } from '../../../context/useUser'
import { useGetAllUsersQuery } from '../../../features/api/authApi'
import { useGetPaymentSlipsQuery, useDeletePaymentSlipByIdMutation } from '../../../features/api/paymentSlipApi'
import AddPaymentSlipDialog from './AddPaymentSlipDialog'
import ViewPayrollDialog from './ViewPayrollDialog'

const statusOptions = ['pending', 'approved', 'rejected', 'paid']

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

const formatDateOnly = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const PayrollManagement = () => {
  const { isDarkMode } = useTheme()
  const { user } = useUser()
  const userPermissions = user?.permissions || []
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin'

  const canCreate = isAdmin || userPermissions.includes('payment_slip.create')
  const canView = isAdmin || userPermissions.includes('payment_slip.view')
  const canUpdate = isAdmin || userPermissions.includes('payment_slip.update')
  const canDelete = isAdmin || userPermissions.includes('payment_slip.delete')
  const canList = isAdmin || userPermissions.includes('payment_slip.list')

  if (!canList) {
    return <AccessDenied message="You do not have permission to view this page." />
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
  const [debouncedStatus, setDebouncedStatus] = useState(() => searchParams.get('status') || '')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('add')
  const [editSlip, setEditSlip] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [viewSlip, setViewSlip] = useState(null)
  const searchTimerRef = useRef(null)

  useEffect(() => {
    document.title = 'Payroll Management'
  }, [])

  const { data, isLoading, isFetching } = useGetPaymentSlipsQuery(
    { page, limit, search: debouncedSearch, status: debouncedStatus },
    { refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: true }
  )

  const { data: usersData } = useGetAllUsersQuery(
    { page: 1, limit: 200, search: '', verified: '', blocked: '', google: '', preference: '', role: '' },
    { refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: true }
  )
  const users = useMemo(() => usersData?.data || [], [usersData])
  const usersById = useMemo(
    () => users.reduce((acc, currentUser) => {
      acc[currentUser.user_id] = currentUser
      return acc
    }, {}),
    [users]
  )

  const [deletePaymentSlip, { isLoading: isDeleting }] = useDeletePaymentSlipByIdMutation()

  const [displayedSlips, setDisplayedSlips] = useState([])
  const [displayedPagination, setDisplayedPagination] = useState({ total: 0, page: 1, limit, totalPages: 1 })

  useEffect(() => {
    if (data && !isFetching) {
      setDisplayedSlips(data.data || [])
      setDisplayedPagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 })
    }
  }, [data, isFetching, limit])

  const slips = displayedSlips
  const pagination = displayedPagination

  useEffect(() => {
    if (page !== pagination.page) {
      setPage(pagination.page)
    }
  }, [page, pagination.page])

  const handleOpenAdd = () => {
    setEditSlip(null)
    setDialogMode('add')
    setDialogOpen(true)
  }

  const handleOpenEdit = (slip) => {
    setEditSlip(slip)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deletePaymentSlip(deleteId).unwrap()
      toast.success('Payment slip deleted successfully')
      setDeleteId(null)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete payment slip')
    }
  }

  const handleCloseDeleteConfirm = () => {
    setDeleteId(null)
  }

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

  const onStatusChange = (e) => {
    const value = e.target.value
    setStatusFilter(value)
    setDebouncedStatus(value)
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('status', value)
      else next.delete('status')
      return next
    })
  }

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value))
    setPage(1)
  }

  const getRoleLabel = (row) => {
    const rawRole = row?.user_role_name || row?.user_role || row?.role_name || row?.role || usersById[row?.user_id]?.role_name || usersById[row?.user_id]?.role
    if (!rawRole) return '-'
    return String(rawRole)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const statusColors = {
    pending: isDarkMode ? '#f59e0b' : '#d97706',
    approved: isDarkMode ? '#10b981' : '#059669',
    rejected: isDarkMode ? '#ef4444' : '#dc2626',
    paid: isDarkMode ? '#3b82f6' : '#2563eb',
  }

  const showActions = canView || canUpdate || canDelete
  const colSpan = showActions ? 10 : 9

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
              Payment Slips
            </Typography>
          </Box>
          {canCreate && (
            <Button
              variant="contained"
              onClick={handleOpenAdd}
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

        {/* ── Filters row ───────────────────────────────────────────── */}
        <Box className="flex flex-col p-4 sm:p-5 gap-4">
          <Box className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full flex-wrap gap-3">
            <Box className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={search}
                onChange={onSearchChange}
                placeholder="Search payment slips..."
                className="px-3 py-2 border rounded outline-none transition-colors"
                style={{
                  height: '38px',
                  width: '250px',
                  backgroundColor: isDarkMode ? '#283046' : '#fff',
                  borderColor: isDarkMode ? '#404656' : '#d8d6de',
                  color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                }}
              />

              <FormControl size="small" sx={{ width: 140 }}>
                <Autocomplete
                  size="small"
                  options={[
                    { label: 'All Status', value: '' },
                    ...statusOptions.map(opt => ({ label: opt.charAt(0).toUpperCase() + opt.slice(1), value: opt }))
                  ]}
                  getOptionLabel={(option) => option.label || ''}
                  value={
                    [
                      { label: 'All Status', value: '' },
                      ...statusOptions.map(opt => ({ label: opt.charAt(0).toUpperCase() + opt.slice(1), value: opt }))
                    ].find(opt => opt.value === statusFilter) || { label: 'All Status', value: '' }
                  }
                  onChange={(_, newValue) => {
                    onStatusChange({ target: { value: newValue ? newValue.value : '' } });
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
                        '& .MuiAutocomplete-listbox': { padding: '0', '& .MuiAutocomplete-option': { fontSize: '0.9rem', '&:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' } } }
                      }
                    }
                  }}
                />
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* ── Native Table ──────────────────────────────────────────── */}
        <TableContainer
          sx={{
            flex: 1,
            minHeight: 400,
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
          <Table stickyHeader sx={{ minWidth: 1200, borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              <TableRow>
                {['#', 'User', 'Role', 'Rate', 'Total Amount', 'Approved Count', 'Payment Date', 'Status', 'Payment Mode', ...(showActions ? ['Actions'] : [])].map((headCell, index) => (
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
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                    <Typography sx={{ mt: 2, color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : slips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                    <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No payment slips found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                slips.map((slip, index) => {
                  const statusVal = slip.status || 'pending'
                  return (
                    <TableRow
                      key={slip.id || index}
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
                      <TableCell align="center">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ textAlign: 'center', lineHeight: 1.35 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {slip.user_name || `User #${slip.user_id}`}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                            {slip.user_email || `ID: ${slip.user_id}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getRoleLabel(slip)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {moneyFormatter.format(Number(slip.rate || 0))}
                      </TableCell>
                      <TableCell align="center">
                        {moneyFormatter.format(Number(slip.total_amount || 0))}
                      </TableCell>
                      <TableCell align="center">
                        {slip.admin_approved_count ?? '-'}
                      </TableCell>
                      <TableCell align="center">
                        {formatDateOnly(slip.payment_date)}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{
                            color: statusColors[statusVal] || (isDarkMode ? '#e5e7eb' : '#374151'),
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {statusVal}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {slip.payment_mode || '-'}
                      </TableCell>
                      {showActions && (
                        <TableCell align="center">
                          <Box className="flex gap-2 justify-center items-center h-full">
                            {canView && (
                              <Tooltip title="View" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => setViewSlip(slip)}
                                  sx={{
                                    color: isDarkMode ? '#10b981' : '#059669',
                                    '&:hover': { backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5' },
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
                                  onClick={() => handleOpenEdit(slip)}
                                  sx={{
                                    color: isDarkMode ? '#3b82f6' : '#2563eb',
                                    '&:hover': { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe' },
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
                                  onClick={() => setDeleteId(slip.id)}
                                  sx={{
                                    color: isDarkMode ? '#ef4444' : '#dc2626',
                                    '&:hover': { backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2' },
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
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Custom Pagination ─────────────────────────────────────── */}
        <Box
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-t"
          sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1', backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}
        >
          <Box className="flex items-center gap-2">
            <span style={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Show:</span>
            <FormControl
              size="small"
              sx={{ minWidth: 80 }}
            >
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
                      }
                  }}
                  onInputChange={(event, newInputValue) => {
                      const parsed = Number(newInputValue);
                      if (!isNaN(parsed) && parsed > 0) {
                          setLimit(parsed);
                          setPage(1);
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
            </FormControl>
            <span style={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>entries</span>
          </Box>
          <Box className="flex items-center gap-4 self-center justify-center sm:self-auto sm:justify-end">
            <Button
              variant="outlined"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.page === 1}
              sx={{
                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                borderColor: isDarkMode ? '#404656' : '#d8d6de',
                '&:hover': { borderColor: '#7367f0', color: '#7367f0', backgroundColor: 'transparent' },
              }}
            >
              Previous
            </Button>
            <span style={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outlined"
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={pagination.page === pagination.totalPages || pagination.total === 0}
              sx={{
                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                borderColor: isDarkMode ? '#404656' : '#d8d6de',
                '&:hover': { borderColor: '#7367f0', color: '#7367f0', backgroundColor: 'transparent' },
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>

      <AddPaymentSlipDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setDialogMode('add')
          setEditSlip(null)
        }}
        mode={dialogMode}
        paymentSlip={editSlip}
        users={users}
      />

      <ViewPayrollDialog
        open={!!viewSlip}
        onClose={() => setViewSlip(null)}
        slip={viewSlip}
        users={users}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Payment Slip"
        message={
          slips?.find((s) => s.id === deleteId) ? (
            <>
              Are you sure you want to delete this payment slip for{' '}
              <strong>{slips?.find((s) => s.id === deleteId)?.user_name || `User #${slips?.find((s) => s.id === deleteId)?.user_id}`}</strong>? This cannot be undone.
            </>
          ) : (
            "Are you sure you want to delete this payment slip? This cannot be undone."
          )
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        loadingText="Deleting..."
        severity="error"
      />
    </Box>
  );
};

export default PayrollManagement;

