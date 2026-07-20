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
} from '@mui/material'
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext'
import { 
    useGetAllPermissionsQuery
} from '../../../features/api/rbacApi'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { PageHeader, SearchBar } from '../../../components/common'
import CloseIcon from '@mui/icons-material/Close'

ModuleRegistry.registerModules([AllCommunityModule])

import { useSelector } from 'react-redux';
import { AccessDenied } from '../../../components/common'

const PermissionManagement = () => {
  useEffect(() => {
    document.title = 'Permission Management'
  })
  const { isDarkMode } = useTheme()
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canList = isAdmin || userPermissions.includes('permission.list');

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view Permission Management." />;
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(500)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')

  const { data, isLoading, isFetching } = useGetAllPermissionsQuery(
    { page, limit, search: debouncedSearch },
    { refetchOnMountOrArgChange: true }
  )

  const [displayedPermissions, setDisplayedPermissions] = useState([])
  const [displayedPagination, setDisplayedPagination] = useState({ total: 0, page: 1, limit, totalPages: 1 })

  useEffect(() => {
    if (data && !isFetching) {
      setDisplayedPermissions(data.data || [])
      setDisplayedPagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 })
    }
  }, [data, isFetching, limit])

  const permissions = displayedPermissions
  const pagination = displayedPagination

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
        headerName: 'Permission Name',
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
    ],
    [isDarkMode]
  )

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
              Permissions
            </Typography>
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
            rowData={permissions}
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
            overlayNoRowsTemplate='<span>No permissions found</span>'
          />
        </Box>
      </Box>
    </Box>
  )
}

export default PermissionManagement

