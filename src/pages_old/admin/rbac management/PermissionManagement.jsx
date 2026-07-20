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
    useGetAllPermissionsQuery
} from '../../../features/api/rbacApi'
import { PageHeader, SearchBar } from '../../../components/common'
import CloseIcon from '@mui/icons-material/Close'

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
          <Table stickyHeader sx={{ minWidth: 600, borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              <TableRow>
                {['#', 'Permission Name', 'Description'].map((headCell, index) => (
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
                  <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                    <Typography sx={{ mt: 2, color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                    <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No permissions found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((permission, index) => (
                  <TableRow
                    key={permission.permission_id || permission.name || index}
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
                    <TableCell align="center">{permission.name || '-'}</TableCell>
                    <TableCell align="center">{permission.description || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}

export default PermissionManagement

