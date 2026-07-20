"use client";

import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material'
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext'
import { 
    useGetAllRolesQuery, 
    useDeleteRoleMutation 
} from '../../../features/api/rbacApi'
import { PageHeader, SearchBar } from '../../../components/common'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ViewRoleDialog from './ViewRoleDialog'

import { useSelector } from 'react-redux';
import { AccessDenied, ConfirmDialog } from '../../../components/common'

const RoleManagement = () => {
  useEffect(() => {
    document.title = 'Role Management'
  })
  const { isDarkMode } = useTheme()
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canList = isAdmin || userPermissions.includes('role.list');
  const canView = isAdmin || userPermissions.includes('role.view');
  const canCreate = isAdmin || userPermissions.includes('role.create');
  const canUpdate = isAdmin || userPermissions.includes('role.update');
  const canDelete = isAdmin || userPermissions.includes('role.delete');

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view Role Management." />;
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')
  const [viewId, setViewId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading, isFetching } = useGetAllRolesQuery(
    { page, limit, search: debouncedSearch },
    { refetchOnMountOrArgChange: true }
  )

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation()



  const [displayedRoles, setDisplayedRoles] = useState([])
  const [displayedPagination, setDisplayedPagination] = useState({ total: 0, page: 1, limit, totalPages: 1 })

  useEffect(() => {
    if (data && !isFetching) {
      setDisplayedRoles(data.data || [])
      setDisplayedPagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 })
    }
  }, [data, isFetching, limit])

  const roles = displayedRoles
  const pagination = displayedPagination

  const handleOpenAdd = () => {
    navigate('/admin/manage-roles/create')
  }

  const handleOpenDeleteConfirm = (id) => {
    setDeleteId(id)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteRole(deleteId).unwrap()
      toast.success('Role deleted successfully')
      setDeleteId(null)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete role')
    }
  }

  const onEditClick = (row) => {
    navigate(`/admin/manage-roles/edit/${row.role_id}`)
  }

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

  const handleLimitChange = (e) => {
    setLimit(e.target.value)
    setPage(1)
  }

  const showActions = canUpdate || canDelete
  const colSpan = showActions ? 5 : 4

  return (
    <Box className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full">
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '6px',
          backgroundColor: isDarkMode ? '#283046 !important' : '#ffffff !important',
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
              Roles
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
              <span style={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Search:</span>
              <input
                type="text"
                value={search}
                onChange={onSearchChange}
                placeholder="Search roles..."
                className="px-3 py-2 border rounded outline-none transition-colors"
                style={{
                  height: '38px',
                  width: '250px',
                  backgroundColor: isDarkMode ? '#283046' : '#fff',
                  borderColor: isDarkMode ? '#404656' : '#d8d6de',
                  color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                }}
              />
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
          <Table stickyHeader sx={{ minWidth: 800, borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              <TableRow>
                {['#', 'Role Name', 'Description', 'Permissions Count', ...(showActions ? ['Actions'] : [])].map((headCell, index) => (
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
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                    <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No roles found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role, index) => (
                  <TableRow
                    key={role.role_id || index}
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
                    <TableCell align="center">{role.name || '-'}</TableCell>
                    <TableCell align="center">{role.description || '-'}</TableCell>
                    <TableCell align="center">{role.permission_count || 0}</TableCell>
                    {showActions && (
                      <TableCell align="center">
                        <Box className="flex gap-2 justify-center items-center h-full">
                          {canView && (
                            <Tooltip title="View" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setViewId(role.role_id)}
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
                                disabled={role.name === 'admin' || role.name === 'user'}
                                onClick={() => onEditClick(role)}
                                sx={{
                                  color: isDarkMode ? '#3b82f6' : '#2563eb',
                                  '&:hover': {
                                    backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                                  },
                                  '&:disabled': {
                                    opacity: 0.3,
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
                                disabled={role.name === 'admin' || role.name === 'user'}
                                onClick={() => handleOpenDeleteConfirm(role.role_id)}
                                sx={{
                                  color: isDarkMode ? '#ef4444' : '#dc2626',
                                  '&:hover': {
                                    backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                                  },
                                  '&:disabled': {
                                    opacity: 0.3,
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>


      </Box>

      {/* RoleDialog removed */}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role?"
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        isLoading={isDeleting}
      />

      <ViewRoleDialog
        open={!!viewId}
        onClose={() => setViewId(null)}
        roleId={viewId}
      />
    </Box>
  )
}

export default RoleManagement


