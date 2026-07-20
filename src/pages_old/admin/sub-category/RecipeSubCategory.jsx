"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
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
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  Autocomplete,
  TextField,
  Tooltip,
} from '@mui/material';
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext';
import {
  useGetAllRecipeSubCategorieDetailsQuery,
  useDeleteRecipeSubCategoryMutation,
  useLazyGetRecipeSubCategoryByIdQuery
} from '../../../features/api/subCategoryApi';
import { useGetRecipeCategoryDropdownQuery } from '../../../features/api/categoryApi';
;
;
;
;
import { PageHeader, SearchBar, ConfirmDialog } from '../../../components/common';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SearchIcon from '@mui/icons-material/Search';
import { getImage } from '../../../utils/helper';
import AddSubCategoryDialog from './AddSubCategoryDialog';
import ViewSubCategoryDialogV2 from './ViewSubCategoryDialogV2';

import { AccessDenied } from '../../../components/common';

const RecipeSubCategory = () => {
  useEffect(() => {
    document.title = 'Sub-Category Management';
  }, []);

  const { isDarkMode } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';

  const canCreate = isAdmin || userPermissions.includes('subcategory.create');
  const canUpdate = isAdmin || userPermissions.includes('subcategory.update');
  const canDelete = isAdmin || userPermissions.includes('subcategory.delete');
  const canView = isAdmin || userPermissions.includes('subcategory.view');
  const canList = isAdmin || userPermissions.includes('subcategory.list');

  const [searchParams, setSearchParams] = useSearchParams();

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view this page." />;
  }

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
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category_id') || '')
  const [debouncedCategory, setDebouncedCategory] = useState(() => searchParams.get('category_id') || '')

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [editSubCategoryId, setEditSubCategoryId] = useState(null);
  const [editSubCategoryData, setEditSubCategoryData] = useState(null);
  const [viewSubCategory, setViewSubCategory] = useState(null);
  const [deleteConflict, setDeleteConflict] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

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

  const handleSearch = () => {
    setDebouncedSearch(search)
    setDebouncedStatus(statusFilter)
    setDebouncedCategory(categoryFilter)
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (search) next.set('search', search)
      else next.delete('search')
      if (statusFilter) next.set('status', statusFilter)
      else next.delete('status')
      if (categoryFilter) next.set('category_id', categoryFilter)
      else next.delete('category_id')
      return next
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setCategoryFilter('')
    setDebouncedSearch('')
    setDebouncedStatus('')
    setDebouncedCategory('')
    setPage(1)
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = search !== '' || statusFilter !== '' || categoryFilter !== '' || debouncedSearch !== '' || debouncedStatus !== '' || debouncedCategory !== ''

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

  const { data: categoryDropdownData } = useGetRecipeCategoryDropdownQuery();

  const { data, isLoading, isFetching } = useGetAllRecipeSubCategorieDetailsQuery(
    { page, limit, search: debouncedSearch, status: debouncedStatus, categoryId: debouncedCategory },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  );

  const [getSubCategoryById] = useLazyGetRecipeSubCategoryByIdQuery();
  const [deleteSubCategory, { isLoading: isDeleting }] = useDeleteRecipeSubCategoryMutation();

  const [displayedSubCategories, setDisplayedSubCategories] = useState([]);
  const [displayedPagination, setDisplayedPagination] = useState({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  });

  useEffect(() => {
    if (data && !isFetching) {
      setDisplayedSubCategories(data.data || []);
      setDisplayedPagination(
        data.pagination || { total: 0, page: 1, limit, totalPages: 1 }
      );
    }
  }, [data, isFetching, limit]);

  const handleViewClick = async (sc) => {

    try {
      const res = await getSubCategoryById(sc.sub_category_id).unwrap();
      setViewSubCategory(res.data);
    } catch (err) {
      toast.error('Failed to fetch sub-category details');
    }
  };

  const handleDialogOpen = async (mode = 'add', subCategoryId = null) => {
    setDialogMode(mode);
    setEditSubCategoryId(mode === 'edit' ? subCategoryId : null);

    if (mode === 'edit' && subCategoryId) {
      try {
        const res = await getSubCategoryById(subCategoryId).unwrap();
        setEditSubCategoryData(res.data);
      } catch (err) {
        toast.error('Failed to fetch sub-category details');
        return;
      }
    } else {
      setEditSubCategoryData(null);
    }

    setDialogOpen(true);
  };


  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditSubCategoryId(null);
    setEditSubCategoryData(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const subCat = displayedSubCategories.find((sc) => sc.sub_category_id === deleteId);
    if (subCat && subCat.recipe_count > 0) {
      setDeleteConflict({
        name: subCat.name,
        recipes: subCat.recipe_count,
      });
      setDeleteId(null);
      return;
    }
    try {
      await deleteSubCategory({ subCategoryId: deleteId }).unwrap();
      toast.success('Sub-category deleted successfully');
      setDisplayedSubCategories((prev) =>
        prev.filter((item) => item.sub_category_id !== deleteId)
      );
      setDeleteId(null);
      setDeleteConflict(null);
    } catch (err) {
      if (err?.status === 409 && err?.data?.details) {
        setDeleteConflict({
          subCategoryName: displayedSubCategories.find(
            (sc) => sc.sub_category_id === deleteId
          )?.name,
          ...err.data.details,
        });
      } else {
        toast.error(err?.data?.message || 'Failed to delete sub-category');
        setDeleteId(null);
      }
    }
  };

  const handleOpenDeleteConfirm = (id) => {
    setDeleteId(id);
    setDeleteConflict(null);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteId(null);
  };

  const handleCloseDeleteConflict = () => {
    setDeleteConflict(null);
    setDeleteId(null);
  };

  const columnDefs = useMemo(() => [
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
      headerName: 'Sub-category Name',
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
      headerName: 'Category Name',
      field: 'category_name',
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
      width: 140,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      },
      headerClass: 'ag-header-center',
      cellRenderer: (params) => {
        const img = params.value;
        if (!img) {
          return (
            <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              No Image
            </Typography>
          );
        }
        return (
          <Box
            component="img"
            src={getImage(img)}
            alt={params.data?.name || 'Recipe Sub-Category'}
            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }}
            loading="lazy"
          />
        );
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
      width: 170,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      },
      headerClass: 'ag-header-center',
      hide: !(canView || canUpdate || canDelete),
      cellRenderer: (params) => {
        const subCategory = params.data;
        return (
          <Box className="flex gap-2 justify-center items-center h-full">
            {canView && (
              <Tooltip title="View" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleViewClick(subCategory)}
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
                  onClick={() => handleDialogOpen('edit', subCategory.sub_category_id)}
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
                  onClick={() => handleOpenDeleteConfirm(subCategory.sub_category_id)}
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
        );
      },
    },
  ], [isDarkMode, canView, canUpdate, canDelete]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);

  const totalCount = displayedPagination.total ?? displayedSubCategories.length;

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
                        Sub-categories
                    </Typography>
                </Box>
                {canCreate && (
                    <Button
                        variant="contained"
                        onClick={() => handleDialogOpen('add')}
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
            <Box className="flex flex-col p-5 gap-4">
                <Box className="flex flex-wrap items-center gap-4">
                    <Box className="flex items-center gap-2">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', whiteSpace: 'nowrap' }}>
                            Sub-category Name:
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
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', whiteSpace: 'nowrap' }}>
                            Category:
                        </Typography>
                        <Autocomplete
                            size="small"
                            options={categoryDropdownData?.data || []}
                            getOptionLabel={(option) => option.name || ''}
                            value={categoryDropdownData?.data?.find(cat => cat.category_id === categoryFilter) || null}
                            onChange={(_, newValue) => {
                                setCategoryFilter(newValue ? newValue.category_id : '');
                            }}
                            isOptionEqualToValue={(option, value) => option.category_id === value.category_id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="All Categories"
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
                                minWidth: 200,
                                '& .MuiAutocomplete-popupIndicator': {
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                },
                                '& .MuiAutocomplete-clearIndicator': {
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                }
                            }}
                        />
                    </Box>

                    <Box className="flex items-center gap-2">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', whiteSpace: 'nowrap' }}>
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
                                    setStatusFilter(newValue ? newValue.value : '');
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
                            <TableCell>SUB-CATEGORY NAME</TableCell>
                            <TableCell align="center">CATEGORY NAME</TableCell>
                            <TableCell align="center">IMAGE</TableCell>
                            <TableCell align="center">RECIPES</TableCell>
                            <TableCell align="center">STATUS</TableCell>
                            {(canView || canUpdate || canDelete) && (
                                <TableCell align="center">ACTIONS</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isFetching ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                </TableCell>
                            </TableRow>
                        ) : displayedSubCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                    <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                        No sub-categories found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedSubCategories.map((subCategory, index) => {
                                return (
                                    <TableRow 
                                        key={subCategory.sub_category_id}
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
                                        <TableCell>{subCategory.name}</TableCell>
                                        <TableCell align="center">{subCategory.category_name}</TableCell>
                                        <TableCell align="center">
                                            {subCategory.image ? (
                                                <Box component="img" src={getImage(subCategory.image)} alt={subCategory.name || 'Recipe Sub-Category'} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }} loading="lazy" />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                                                    No Image
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">{subCategory.recipe_count}</TableCell>
                                        <TableCell align="center">
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: subCategory.is_active ? '#10b981' : '#ef4444',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {subCategory.is_active ? 'Active' : 'Inactive'}
                                            </Typography>
                                        </TableCell>
                                        {(canView || canUpdate || canDelete) && (
                                            <TableCell align="center">
                                                <Box display="flex" gap={1} justifyContent="center" alignItems="center" height="100%">
                                                    {canView && (
                                                        <Tooltip title="View" arrow>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleViewClick(subCategory)} 
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
                                                                onClick={() => handleDialogOpen('edit', subCategory.sub_category_id)}
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
                                                                onClick={() => handleOpenDeleteConfirm(subCategory.sub_category_id)} 
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

      

      <AddSubCategoryDialog
        key={dialogMode + '-' + (editSubCategoryId || 'new')}
        open={dialogOpen}
        onClose={handleDialogClose}
        mode={dialogMode}
        subCategoryId={editSubCategoryId}
        subCategoryData={editSubCategoryData}
      />

      <ViewSubCategoryDialogV2
        open={!!viewSubCategory}
        onClose={() => setViewSubCategory(null)}
        subCategory={viewSubCategory}
      />

      <ConfirmDialog
        open={!!deleteId && !deleteConflict}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Sub-Category"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>
              {displayedSubCategories.find((sc) => sc.sub_category_id === deleteId)?.name || 'this sub-category'}
            </strong>?
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
        onClose={handleCloseDeleteConflict}
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
              Cannot Delete Sub-Category
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDeleteConflict}
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
                  Cannot delete sub-category "<strong>{deleteConflict.name || deleteConflict.subCategoryName || ''}</strong>" because it is currently in use:
                </Typography>
                <Box sx={{ pl: 2, borderLeft: `2px solid ${isDarkMode ? '#ef4444' : '#ef4444'}` }}>
                  {deleteConflict.recipes > 0 && (
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      • Used in <strong>{deleteConflict.recipes}</strong> recipe{deleteConflict.recipes === 1 ? '' : 's'}
                    </Typography>
                  )}
                  {deleteConflict.homeSections > 0 && (
                    <Typography variant="body2" sx={{ mt: 1, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      • Used in <strong>{deleteConflict.homeSections}</strong> home section{deleteConflict.homeSections === 1 ? '' : 's'}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 500, fontStyle: 'italic' }}>
                * Please remove or reassign all associated recipes and home sections before deleting this sub-category.
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
            onClick={handleCloseDeleteConflict}
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
    </Box>
  );
};

export default RecipeSubCategory;

