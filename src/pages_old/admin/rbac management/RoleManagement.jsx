"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react'
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
} from '@mui/material'
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext'
import { 
    useGetAllRolesQuery, 
    useDeleteRoleMutation 
} from '../../../features/api/rbacApi'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { PageHeader, SearchBar } from '../../../components/common'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ViewRoleDialog from './ViewRoleDialog'

ModuleRegistry.registerModules([AllCommunityModule])

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
        headerName: 'Role Name',
        field: 'name',
        flex: 1,
        minWidth: 180,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Description',
        field: 'description',
        flex: 2,
        minWidth: 250,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Permissions Count',
        valueGetter: (params) => params.data.permission_count || 0,
        width: 150,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
        ...(canUpdate || canDelete ? [{
          headerName: 'Actions',
          width: 140,
          cellStyle: { textAlign: 'center' },
          headerClass: 'ag-header-center',
          cellRenderer: (params) => {
            const role = params.data
            return (
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
                          opacity: 0.3
                        }
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
                          opacity: 0.3
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )
          },
        }] : []),
    ], [canUpdate, canDelete, isDarkMode]);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
    }),
    []
  )

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

        {/* ── AG Grid ───────────────────────────────────────────────── */}
        <Box
          className={`${isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full xl:max-w-none`}
          sx={{
            flex: 1,
            width: '100%',
            height: 'auto',
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            '& .ag-root-wrapper': {
              backgroundColor: 'transparent !important',
              border: 'none',
              borderRadius: 0,
              width: '100%',
              height: '100%',
            },
            '& .ag-root': { backgroundColor: 'transparent' },
            '& .ag-header': {
              backgroundColor: isDarkMode ? '#283046 !important' : '#f3f2f7 !important',
              borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
              borderTop: 'none',
            },
            '& .ag-header-cell': {
              color: isDarkMode ? '#b4b7bd !important' : '#6e6b7b !important',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            },
            '& .ag-row': {
              borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'} !important`,
              backgroundColor: isDarkMode ? '#283046 !important' : '#ffffff !important',
              color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
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
            '& .ag-row-odd': { backgroundColor: isDarkMode ? '#283046 !important' : '#fafbfc !important' },
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
            rowData={roles}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            rowHeight={70}
            headerHeight={48}
            pagination={false}
            suppressCellFocus={true}
            animateRows={true}
            loading={isLoading || isFetching}
            overlayLoadingTemplate='<span class="ag-overlay-loading-center">Loading...</span>'
            overlayNoRowsTemplate='<span>No roles found</span>'
          />
        </Box>


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


