"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
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
  Pagination,
  Autocomplete,
  TextField,
  Tooltip,
  Collapse
} from '@mui/material'
import { toast } from '../../../utils/toast';
import * as Yup from 'yup'
import { useTheme } from '../../../context/ThemeContext'
import { useGetRecipeCategoriesQuery, useCreateRecipeCategoryMutation, useUpdateRecipeCategoryByIdMutation, useDeleteRecipeCategoryByIdMutation, useLazyGetRecipeCategoryByIdQuery } from '../../../features/api/categoryApi'
import { PageHeader, SearchBar, AccessDenied, ConfirmDialog } from '../../../components/common'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import SearchIcon from '@mui/icons-material/Search'
import { FilterAltOutlined, FilterAltOffOutlined } from '@mui/icons-material'
import { getImage } from '../../../utils/helper'
import ViewCategoryDialog from './ViewCategoryDialog'
import CategoryDialog from './AddCategoryDialog'

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be at most 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .min(150, 'Description must be at least 150 characters')
    .max(300, 'Description must be at most 300 characters'),
  image: Yup.mixed()
    .nullable()
    .test('fileSize', 'File size is too large (max 2MB)', (value) => !value || value.size <= 2 * 1024 * 1024)
    .test(
      'fileType',
      'Unsupported file format (JPEG, PNG, JPG, WEBP only)',
      (value) => !value || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type)
    ),
})

const RecipeCategory = () => {
  useEffect(() => {
    document.title = 'Category Management'
  })
  const { isDarkMode } = useTheme()
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';

  const canCreate = isAdmin || userPermissions.includes('category.create');
  const canUpdate = isAdmin || userPermissions.includes('category.update');
  const canDelete = isAdmin || userPermissions.includes('category.delete');
  const canView = isAdmin || userPermissions.includes('category.view');
  const canList = isAdmin || userPermissions.includes('category.list');

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view this page." />;
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    return p ? parseInt(p, 10) : 1
  })
  const [limit, setLimit] = useState(() => {
    const l = searchParams.get('limit')
    return l ? parseInt(l, 10) : 50
  })

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      let changed = false

      const currentUrlPage = next.get('page')
      if (page > 1) {
        if (currentUrlPage !== String(page)) {
          next.set('page', page)
          changed = true
        }
      } else if (currentUrlPage) {
        next.delete('page')
        changed = true
      }

      const currentUrlLimit = next.get('limit')
      if (limit !== 50) {
        if (currentUrlLimit !== String(limit)) {
          next.set('limit', limit)
          changed = true
        }
      } else if (currentUrlLimit) {
        next.delete('limit')
        changed = true
      }

      return changed ? next : prev
    }, { replace: true })
  }, [page, limit, setSearchParams])
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
  const [debouncedStatus, setDebouncedStatus] = useState(() => searchParams.get('status') || '')
  const [sortByFilter, setSortByFilter] = useState(() => searchParams.get('sortBy') || '')
  const [debouncedSortBy, setDebouncedSortBy] = useState(() => searchParams.get('sortBy') || '')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editCategory, setEditCategory] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteConflict, setDeleteConflict] = useState(null)
  const [viewCategory, setViewCategory] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const fileInputRef = useRef(null)

  const { data, isLoading, isFetching } = useGetRecipeCategoriesQuery(
    { page, limit, search: debouncedSearch, status: debouncedStatus, sortBy: debouncedSortBy },
    { refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: true }
  )

  const [getCategoryById] = useLazyGetRecipeCategoryByIdQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateRecipeCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateRecipeCategoryByIdMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteRecipeCategoryByIdMutation()


  const isEditMode = editId !== null

  const [displayedCategories, setDisplayedCategories] = useState([])
  const [displayedPagination, setDisplayedPagination] = useState({ total: 0, page: 1, limit, totalPages: 1 })

  useEffect(() => {
    if (data && !isFetching) {
      setDisplayedCategories(data.data || [])
      setDisplayedPagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 })
    }
  }, [data, isFetching, limit])

  const categories = displayedCategories
  const pagination = displayedPagination

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      is_active: true,
      image: null,
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      const trimmedName = values.name.trim()
      if (!trimmedName) {
        toast.error('Category name cannot be empty')
        return
      }

      try {
        const formData = new FormData()
        formData.append('name', trimmedName)
        formData.append('description', values.description.trim())
        formData.append('is_active', values.is_active)

        if (values.image instanceof File) {
          formData.append('image', values.image)
        }

        if (isEditMode) {
          await updateCategory({
            id: editId,
            inputData: formData,
          }).unwrap()
          toast.success('Category updated successfully')
          setEditId(null)
        } else {
          await createCategory(formData).unwrap()
          toast.success('Category created successfully')
        }
        formik.resetForm({ values: { name: '', description: '', is_active: true, image: null } })
        setImagePreview(null)
        setDialogOpen(false)
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to save category')
      }
    },
  })

  const handleOpenAdd = () => {
    formik.resetForm({ values: { name: '', description: '', is_active: true, image: null } })
    setImagePreview(null)
    setEditId(null)
    setDialogOpen(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      formik.setFieldValue('image', file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      formik.setFieldValue('image', file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleOpenDeleteConfirm = (categoryId) => {
    setDeleteId(categoryId)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCategory(deleteId).unwrap()
      toast.success('Category deleted successfully')
      setDisplayedCategories((prev) => prev.filter((cat) => cat.category_id !== deleteId))
      setDisplayedPagination((prev) => {
        const nextTotal = prev.total > 0 ? prev.total - 1 : 0
        const nextTotalPages = prev.limit ? Math.max(1, Math.ceil(nextTotal / prev.limit)) : prev.totalPages
        const clampedPage = Math.min(prev.page, nextTotalPages)
        if (clampedPage !== prev.page) {
          setPage(clampedPage)
        }
        return { ...prev, total: nextTotal, totalPages: nextTotalPages, page: clampedPage }
      })
      setDeleteId(null)
      setDeleteConflict(null)
    } catch (err) {
      if (err?.status === 409 && err?.data?.details) {
        setDeleteConflict({
          categoryName: categories?.find((c) => c.category_id === deleteId)?.name,
          ...err.data.details
        })
      } else {
        toast.error(err?.data?.message || 'Failed to delete category')
        setDeleteId(null)
      }
    }
  }

  const handleCloseDeleteConfirm = () => {
    setDeleteId(null)
    setDeleteConflict(null)
  }

  const onEditClick = async (row) => {
    try {
      const response = await getCategoryById(row.category_id).unwrap()
      const category = response.data
      setEditId(category.category_id)
      setEditCategory(category)
      const imagePath = category.image ? getImage(category.image) : null
      setImagePreview(imagePath)
      formik.setValues({
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active !== false,
        image: null,
      })
      setDialogOpen(true)
    } catch (err) {
      toast.error('Failed to fetch category details')
    }
  }

  const handleViewClick = async (category) => {
    try {
      const response = await getCategoryById(category.category_id).unwrap()
      setViewCategory(response.data)
    } catch (err) {
      toast.error('Failed to fetch category details')
    }
  }



  const onSearchChange = (e) => {
    setSearch(e.target.value)
  }

  const handleLimitChange = (e) => {
    setLimit(e.target.value)
    setPage(1)
  }

  const onStatusChange = (e) => {
    setStatusFilter(e.target.value)
  }

  const onSortByChange = (e) => {
    setSortByFilter(e.target.value)
  }

  const handleSearch = () => {
    setDebouncedSearch(search)
    setDebouncedStatus(statusFilter)
    setDebouncedSortBy(sortByFilter)
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (search) next.set('search', search)
      else next.delete('search')
      if (statusFilter) next.set('status', statusFilter)
      else next.delete('status')
      if (sortByFilter) next.set('sortBy', sortByFilter)
      else next.delete('sortBy')
      return next
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setSortByFilter('')
    setDebouncedSearch('')
    setDebouncedStatus('')
    setDebouncedSortBy('')
    setPage(1)
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = search !== '' || statusFilter !== '' || sortByFilter !== '' || debouncedSearch !== '' || debouncedStatus !== '' || debouncedSortBy !== ''

  const selectStyles = {
    height: 38,
    bgcolor: isDarkMode ? '#283046' : '#fff',
    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' }
  };

  const menuPropsStyles = {
    sx: {
        '& .MuiPaper-root': {
            bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            borderRadius: '6px',
            border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
            boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
        },
        '& .MuiMenuItem-root': {
            fontSize: '0.9rem',
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            '&:hover': {
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                color: '#7367f0 !important'
            },
            '&.Mui-selected': {
                bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                color: '#7367f0 !important',
                fontWeight: 500,
                '&:hover': {
                    bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                }
            }
        }
    }
  };

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
        headerName: 'Name',
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
        headerName: 'Image',
        field: 'image',
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
        cellRenderer: (params) => {
          const img = params.value
          if (!img) {
            return (
              <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                No Image
              </Typography>
            )
          }
          return (
            <Box component="img" src={getImage(img)} alt={params.data?.name || 'Recipe Category'} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }} loading="lazy" />
          )
        },
      },

      {
        headerName: 'Recipes',
        field: 'recipe_count',
        width: 100,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Sub-Categories',
        field: 'subcategory_count',
        width: 130,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
      },
      {
        headerName: 'Status',
        field: 'is_active',
        width: 100,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        headerClass: 'ag-header-center',
        cellRenderer: (params) => (
          <Typography
            variant="body2"
            sx={{
              color: params.value ? '#10b981' : '#ef4444',
              fontWeight: 'bold',
            }}
          >
            {params.value ? 'Active' : 'Inactive'}
          </Typography>
        ),
      },
      {
        headerName: 'Actions',
        width: 140,
        cellStyle: { textAlign: 'center' },
        headerClass: 'ag-header-center',
        hide: !(canView || canUpdate || canDelete),
        cellRenderer: (params) => {
          const category = params.data
          return (
            <Box className="flex gap-2 justify-center items-center h-full">
              {canView && (
                <Tooltip title="View" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleViewClick(category)}
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
                    onClick={() => onEditClick(category)}
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
                    onClick={() => handleOpenDeleteConfirm(category.category_id)}
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
          )
        },
      },
    ],
    [isDarkMode, canView, canUpdate, canDelete]
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
                        Categories
                    </Typography>
                </Box>
                <Box className="flex gap-2 sm:gap-4 flex-wrap items-center">
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
                            onClick={handleOpenAdd}
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
            <Box className="flex flex-col p-5 gap-4">
                <Box className="flex flex-wrap items-center gap-4">
                    <Box className="flex items-center gap-2">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Name:
                        </Typography>
                        <input
                            type="text"
                            value={search}
                            onChange={onSearchChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="px-3 py-2 border rounded outline-none transition-colors"
                            style={{
                                height: '38px',
                                width: '200px',
                                backgroundColor: isDarkMode ? '#283046' : '#fff',
                                borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                borderRadius: '4px',
                            }}
                        />
                    </Box>
                    <Box className="flex items-center gap-2">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Sort By:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 190 }}>
                            <Autocomplete
                                size="small"
                                options={[
                                    { label: 'Default Sorting', value: '' },
                                    { label: 'Most Added Recipes', value: 'most_recipes' },
                                    { label: 'Less Added Recipes', value: 'least_recipes' }
                                ]}
                                getOptionLabel={(option) => option.label || ''}
                                value={
                                    [
                                        { label: 'Default Sorting', value: '' },
                                        { label: 'Most Added Recipes', value: 'most_recipes' },
                                        { label: 'Less Added Recipes', value: 'least_recipes' }
                                    ].find(opt => opt.value === sortByFilter) || { label: 'Default Sorting', value: '' }
                                }
                                onChange={(_, newValue) => {
                                    onSortByChange({ target: { value: newValue ? newValue.value : '' } });
                                }}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Default Sorting"
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
                            Status:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Autocomplete
                                size="small"
                                options={[
                                    { label: 'All Status', value: '' },
                                    { label: 'Active', value: 'active' },
                                    { label: 'Inactive', value: 'inactive' }
                                ]}
                                getOptionLabel={(option) => option.label || ''}
                                value={
                                    [
                                        { label: 'All Status', value: '' },
                                        { label: 'Active', value: 'active' },
                                        { label: 'Inactive', value: 'inactive' }
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
                </Box>
                {/* Action Buttons */}
                <Box className="flex justify-end items-center gap-3">
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                        startIcon={<ClearAllIcon />}
                        sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3 }}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSearch}
                        startIcon={<SearchIcon />}
                        sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3, bgcolor: '#7367f0', '&:hover': { bgcolor: '#5e50ee' }, boxShadow: 'none' }}
                    >
                        Search
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
                            <TableCell align="center" width={70}>#</TableCell>
                            <TableCell>NAME</TableCell>
                            <TableCell align="center">IMAGE</TableCell>
                            <TableCell align="center">RECIPES</TableCell>
                            <TableCell align="center">SUB-CATEGORIES</TableCell>
                            <TableCell align="center">STATUS</TableCell>
                            {(canView || canUpdate || canDelete) && (
                                <TableCell align="center">ACTIONS</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading || isFetching ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                    <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                        No categories found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category, index) => {
                                return (
                                    <TableRow 
                                        key={category.category_id}
                                        sx={{ 
                                            'height': '60px',
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8',
                                            },
                                            '& td': {
                                                borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            }
                                        }}
                                    >
                                        <TableCell align="center">{(page - 1) * limit + index + 1}</TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell align="center">
                                            {category.image ? (
                                                <Box component="img" src={getImage(category.image)} alt={category.name || 'Recipe Category'} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }} loading="lazy" />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                                                    No Image
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">{category.recipe_count}</TableCell>
                                        <TableCell align="center">{category.subcategory_count}</TableCell>
                                        <TableCell align="center">
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: category.is_active ? '#10b981' : '#ef4444',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </Typography>
                                        </TableCell>
                                        {(canView || canUpdate || canDelete) && (
                                            <TableCell align="center">
                                                <Box display="flex" gap={1} justifyContent="center" alignItems="center" height="100%">
                                                    {canView && (
                                                        <Tooltip title="View" arrow>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleViewClick(category)} 
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
                                                                onClick={() => onEditClick(category)}
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
                                                                onClick={() => handleOpenDeleteConfirm(category.category_id)} 
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

            {/* ── Pagination ────────────────────────────────────────── */}
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
                        value={limit || 10}
                        onChange={(event, newValue) => {
                            if (newValue) {
                                setLimit(Number(newValue));
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
                        sx={{
                            width: 100,
                            '& .MuiAutocomplete-inputRoot': {
                                paddingRight: '30px !important'
                            },
                            '& .MuiAutocomplete-clearIndicator': {
                                color: isDarkMode ? '#b4b7bd' : '#6e6b7b'
                            },
                            '& .MuiAutocomplete-popupIndicator': {
                                color: isDarkMode ? '#b4b7bd' : '#6e6b7b'
                            }
                        }}
                        ListboxProps={{
                            sx: {
                                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            }
                        }}
                        slotProps={{
                            paper: {
                                sx: {
                                    bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                    border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                    '& .MuiAutocomplete-option': {
                                        '&[aria-selected="true"]': {
                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)',
                                            color: '#7367f0',
                                        },
                                        '&:hover': {
                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                                        }
                                    }
                                }
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDarkMode ? '#283046' : '#fff',
                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        height: 38,
                                        '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                        '&:hover fieldset': { borderColor: '#7367f0' },
                                        '&.Mui-focused fieldset': { borderColor: '#7367f0', borderWidth: '1px' },
                                    },
                                    '& input': {
                                        color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                                        WebkitTextFillColor: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                                    }
                                }}
                            />
                        )}
                    />
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                        Entries per page
                    </Typography>
                </Box>

                <Box className="flex items-center gap-4">
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                        Showing {Math.min((page - 1) * limit + 1, displayedPagination.total || 0)} to {Math.min(page * limit, displayedPagination.total || 0)} of {displayedPagination.total || 0} entries
                    </Typography>
                </Box>

                <Pagination
                    count={displayedPagination.totalPages || 1}
                    page={page || 1}
                    onChange={(e, value) => setPage(value)}
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

      

      <CategoryDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditId(null)
          setEditCategory(null)
          setImagePreview(null)
          formik.resetForm({ values: { name: '', description: '', is_active: true, image: null } })
        }}
        isLoading={isCreating}
        mode={isEditMode ? 'edit' : 'add'}
        categoryId={editId}
        category={editCategory}
      />

      <ConfirmDialog
        open={!!deleteId && !deleteConflict}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Category"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>{categories?.find((c) => c.category_id === deleteId)?.name}</strong>?
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        loadingText="Deleting..."
        severity="error"
      />

      <Dialog
        open={!!deleteConflict}
        onClose={handleCloseDeleteConfirm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            borderRadius: { xs: 0, sm: '16px' },
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            backgroundImage: 'none',
            border: isDarkMode ? '1px solid #1e293b' : 'none',
          },
        }}
      >
        <DialogTitle 
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            p: 3,
            pb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a', letterSpacing: '-0.025em' }}>
              Cannot Delete Category
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDeleteConfirm}
            size="small"
            sx={{ 
                color: isDarkMode ? '#94a3b8' : '#64748b',
                backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                '&:hover': {
                    backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5
          }}
        >
          {deleteConflict && (
            <Box className="flex flex-col gap-3">
              <Box sx={{ 
                p: 2.5, 
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', 
                border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fca5a5'}`,
                borderRadius: '12px' 
              }}>
                <Typography variant="body1" sx={{ color: isDarkMode ? '#fca5a5' : '#dc2626', fontWeight: 600, mb: 2 }}>
                  Cannot delete category "<strong>{deleteConflict.categoryName}</strong>" because it is currently in use:
                </Typography>
                <Box sx={{ pl: 2, borderLeft: `2px solid ${isDarkMode ? '#ef4444' : '#ef4444'}` }}>
                  {deleteConflict.subCategories > 0 && (
                    <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      • Used in <strong>{deleteConflict.subCategories}</strong> sub-categor{deleteConflict.subCategories === 1 ? 'y' : 'ies'}
                    </Typography>
                  )}
                  {deleteConflict.recipes > 0 && (
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      • Used in <strong>{deleteConflict.recipes}</strong> recipe{deleteConflict.recipes === 1 ? '' : 's'}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 500, fontStyle: 'italic' }}>
                * Please remove or reassign all associated sub-categories and recipes before deleting this category.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            gap: 2,
            justifyContent: 'flex-end'
          }}
        >
          <Button
            onClick={handleCloseDeleteConfirm}
            variant="outlined"
            sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                color: isDarkMode ? '#94a3b8' : '#64748b',
                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                '&:hover': {
                    borderColor: isDarkMode ? '#475569' : '#94a3b8',
                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(100, 116, 139, 0.04)',
                }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ViewCategoryDialog
        open={!!viewCategory}
        onClose={() => setViewCategory(null)}
        category={viewCategory}
      />
    </Box>
  )
}

export default RecipeCategory
