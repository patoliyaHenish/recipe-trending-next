"use client";
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography, Autocomplete, Chip, FormControl, Select, MenuItem, Pagination, useMediaQuery, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast } from '../../utils/toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '../../context/ThemeContext';
import {
  useGetIngredientsPaginatedQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
  useLazyGetIngredientByIdQuery,
} from '../../features/api/ingredientApi';
import { useGetAllIngredientUnitsQuery } from '../../features/api/ingredientUnitApi';

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Ingredient name is required')
    .min(2, 'Ingredient name must be at least 2 characters')
    .max(100, 'Ingredient name must be at most 100 characters'),
});

import { AccessDenied, ConfirmDialog } from '../../components/common';

const IngredientManagement = () => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const customInputSx = {
    '& .MuiOutlinedInput-root': {
      color: isDarkMode ? '#e2e8f0' : '#1e293b',
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
      borderRadius: '8px',
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#475569' : '#cbd5e1',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#6366f1',
        borderWidth: '2px',
      },
      '&.Mui-focused': {
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
      }
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#94a3b8' : '#64748b',
      '&.Mui-focused': {
        color: '#6366f1',
      }
    },
    '& .MuiFormHelperText-root': {
      color: '#ef4444',
      marginLeft: '4px',
      marginTop: '4px',
    },
    '& .MuiSelect-icon': {
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    '& .MuiTypography-root': {
      color: isDarkMode ? '#e2e8f0' : '#1e293b',
    }
  };
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';

  const canCreate = isAdmin || userPermissions.includes('ingredient.create');
  const canUpdate = isAdmin || userPermissions.includes('ingredient.update');
  const canDelete = isAdmin || userPermissions.includes('ingredient.delete');
  const canList = isAdmin || userPermissions.includes('ingredient.list');

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view this page." />;
  }

  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(() => Number(searchParams.get('limit')) || 50);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [usageInput, setUsageInput] = useState(() => searchParams.get('usage') || 'all');
  const [usageFilter, setUsageFilter] = useState(() => searchParams.get('usage') || 'all');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [getIngredient, { isFetching: isFetchingDetails }] = useLazyGetIngredientByIdQuery();

  const handleOpenView = async (ingredient) => {
    setViewData(ingredient); // initial fallback
    setViewDialogOpen(true);
    try {
      const res = await getIngredient(ingredient.ingredient_id).unwrap();
      if (res?.data) {
        setViewData(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch latest details');
    }
  };
  const handleCloseView = () => {
    setViewDialogOpen(false);
    setViewData(null);
  };

  const hasActiveFilters = search !== '' || usageInput !== 'all' || usageFilter !== 'all' || debouncedSearch !== '';

  const selectStyles = {
    height: 38,
    bgcolor: isDarkMode ? '#283046' : '#fff',
    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' }
  };
  const { data, isLoading, isFetching } = useGetIngredientsPaginatedQuery({ page, limit, search: debouncedSearch, usage: usageFilter }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  const { data: allUnitsData } = useGetAllIngredientUnitsQuery(undefined, { skip: !dialogOpen });


  const [createIngredient, { isLoading: isCreating }] = useCreateIngredientMutation();
  const [updateIngredient, { isLoading: isUpdating }] = useUpdateIngredientMutation();
  const [deleteIngredient, { isLoading: isDeleting }] = useDeleteIngredientMutation();

  const [usageInfo, setUsageInfo] = useState(null);

  const isEditMode = editId !== null;

  const [tableIngredients, setTableIngredients] = useState([]);
  const [tablePagination, setTablePagination] = useState({ total: 0, page: 1, limit, totalPages: 1 });

  useEffect(() => {
    document.title = 'Ingredients Management';
  });

  useEffect(() => {
    if (data && !isFetching) {
      setTableIngredients(data.data || []);
      setTablePagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
    }
  }, [data, isFetching, limit]);


  const currentIngredient = useMemo(() => tableIngredients.find(i => i.ingredient_id === deleteId), [tableIngredients, deleteId]);
  const availableUnits = useMemo(() => allUnitsData?.data || [], [allUnitsData]);

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      const trimmedName = values.name.trim();
      if (!trimmedName) {
        toast.error('Ingredient name is required');
        return;
      }

      try {
        if (isEditMode) {
          await updateIngredient({ id: editId, name: trimmedName }).unwrap();
          setTableIngredients((prev) =>
            prev.map((item) =>
              item.ingredient_id === editId
                ? {
                  ...item,
                  name: trimmedName,
                }
                : item
            )
          );
          toast.success('Ingredient updated');
        } else {
          await createIngredient({ name: trimmedName }).unwrap();
          toast.success('Ingredient added');
          setPage(1);
        }

        setDialogOpen(false);
        setEditId(null);
        formik.resetForm();
      } catch (err) {
        toast.error(err?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} ingredient`);
      }
    },
  });

  useEffect(() => {
    if (!editId) {
      formik.resetForm({ values: { name: '' } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleOpenAdd = () => {
    formik.resetForm({ values: { name: '' } });
    setEditId(null);
    setDialogOpen(true);
  };

  const handleOpenDeleteConfirm = (ingredientId) => {
    setDeleteId(ingredientId);
    setUsageInfo(null);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteIngredient(deleteId).unwrap();
      toast.success('Ingredient deleted and removed from all recipes');
      setDeleteId(null);
      setDeleteConfirmOpen(false);
      setTableIngredients((prev) => prev.filter((i) => i.ingredient_id !== deleteId));
      setTablePagination((prev) => {
        const nextTotal = prev.total > 0 ? prev.total - 1 : 0;
        const nextTotalPages = prev.limit ? Math.max(1, Math.ceil(nextTotal / prev.limit)) : prev.totalPages;
        const clampedPage = Math.min(prev.page, nextTotalPages);
        if (clampedPage !== prev.page) {
          setPage(clampedPage);
        }
        return { ...prev, total: nextTotal, totalPages: nextTotalPages, page: clampedPage };
      });
      setUsageInfo(null);
    } catch (err) {
      // Check if this is a usage conflict (409)
      if (err?.status === 409 && err?.data?.data) {
        setUsageInfo(err.data.data);
        toast.error(err?.data?.message || 'This ingredient is used in recipes');
      } else {
        toast.error(err?.data?.message || 'Failed to delete ingredient');
        setDeleteId(null);
        setDeleteConfirmOpen(false);
        setUsageInfo(null);
      }
    }
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteId(null);
    setDeleteConfirmOpen(false);
    setUsageInfo(null);
  };

  const onEditClick = (row) => {
    setEditId(row.ingredient_id);
    formik.setValues({ name: row.name || '' });
    setDialogOpen(true);
  };

  const handleClearFilters = () => {
    setSearch('');
    setUsageInput('all');
    setUsageFilter('all');
    setDebouncedSearch('');
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const handleSearch = () => {
    setDebouncedSearch(search);
    setUsageFilter(usageInput);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (search) next.set('search', search);
      else next.delete('search');
      if (usageInput && usageInput !== 'all') next.set('usage', usageInput);
      else next.delete('usage');
      next.delete('page');
      return next;
    });
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

  const handleLimitChange = (e) => {
    setLimit(e.target.value);
    setPage(1);
    syncUrlParams(1, e.target.value);
  };

  const showUsageCol = canCreate || canUpdate;
  const showActionsCol = canList || canUpdate || canDelete;
  const tableColCount = 2 + (showUsageCol ? 1 : 0) + (showActionsCol ? 1 : 0);
  const headerCells = ['#', 'Name', ...(showUsageCol ? ['Usage'] : []), ...(showActionsCol ? ['Actions'] : [])];

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
              Ingredients
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search ingredients..."
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
                Usage:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Autocomplete
                  size="small"
                  options={[
                    { label: 'All Usage', value: 'all' },
                    { label: 'Used', value: 'used' },
                    { label: 'Unused', value: 'unused' },
                    { label: 'Most Used', value: 'most_used' }
                  ]}
                  getOptionLabel={(option) => option.label || ''}
                  value={
                    [
                      { label: 'All Usage', value: 'all' },
                      { label: 'Used', value: 'used' },
                      { label: 'Unused', value: 'unused' },
                      { label: 'Most Used', value: 'most_used' }
                    ].find(opt => opt.value === usageInput) || { label: 'All Usage', value: 'all' }
                  }
                  onChange={(_, newValue) => {
                    setUsageInput(newValue ? newValue.value : 'all');
                  }}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="All Usage"
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
              sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3 }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ height: '38px', minWidth: '120px', textTransform: 'none', px: 3, bgcolor: '#7367f0', '&:hover': { bgcolor: '#5e50ee' }, boxShadow: 'none' }}
            >
              Search
            </Button>
          </Box>
        </Box>

        {/* ── Native Table ───────────────────────────────────────────────── */}
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
          <Table stickyHeader sx={{ minWidth: 550, borderCollapse: 'separate', borderSpacing: 0 }}>
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
                  <TableCell colSpan={tableColCount} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                    <Typography sx={{ mt: 2, color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : tableIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColCount} align="center" sx={{ py: 8 }}>
                    <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No ingredients found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tableIngredients.map((row, index) => (
                  <TableRow
                    key={row.ingredient_id || index}
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
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell align="center">
                      {row.name || '-'}
                    </TableCell>
                    {showUsageCol && (
                      <TableCell align="center">
                        {`${row.usage_count != null ? Number(row.usage_count) : 0} Recipes`}
                      </TableCell>
                    )}
                    {showActionsCol && (
                      <TableCell align="center">
                        <Box className="flex gap-2 justify-center items-center h-full">
                          <Tooltip title="View" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenView(row)}
                              sx={{
                                color: isDarkMode ? '#10b981' : '#059669',
                                '&:hover': {
                                  backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5',
                                },
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canUpdate && (
                            <Tooltip title="Edit" arrow>
                              <IconButton
                                size="small"
                                onClick={() => onEditClick(row)}
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
                                onClick={() => handleOpenDeleteConfirm(row.ingredient_id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Pagination ────────────────────────────────────────────── */}
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
                            getOptionLabel={(option) => String(option)}
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
              Showing {Math.min((tablePagination.page - 1) * limit + 1, tablePagination.total || 0)} to {Math.min(tablePagination.page * limit, tablePagination.total || 0)} of {tablePagination.total || 0} entries
            </Typography>
          </Box>

          <Pagination
            count={tablePagination.totalPages || 1}
            page={tablePagination.page || 1}
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
        key={`ingredient-dialog-${dialogOpen}`}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditId(null);
          formik.resetForm({ values: { name: '' } });
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            borderRadius: isMobile ? 0 : '16px',
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
              {isEditMode ? 'Edit Ingredient' : 'Add Ingredient'}
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setDialogOpen(false);
              setEditId(null);
              formik.resetForm({ values: { name: '' } });
            }}
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
        <form onSubmit={formik.handleSubmit} noValidate>
          <DialogContent
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
            }}
          >
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Ingredient Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
              disabled={isCreating || isUpdating}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              size="medium"
              sx={customInputSx}
            />
          </DialogContent>
          <DialogActions
            sx={{
              p: 3,
              pt: 2,
              gap: 2,
            }}
          >
            <Button
              onClick={() => {
                setDialogOpen(false);
                setEditId(null);
                formik.resetForm({ values: { name: '' } });
              }}
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={(isCreating || isUpdating) || !formik.values.name.trim()}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                backgroundColor: '#7367f0',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#5e50ee',
                  boxShadow: 'none',
                },
              }}
            >
              {isCreating ? 'Adding...' : isUpdating ? 'Updating...' : isEditMode ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDelete}
        title={`Delete ${currentIngredient ? currentIngredient.name : ''}`}
        severity={usageInfo && (usageInfo.usageCount ?? 0) > 0 ? "error" : "error"}
        isLoading={isDeleting}
        confirmText="Delete"
        confirmDisabled={usageInfo && (usageInfo.usageCount ?? 0) > 0}
        message={
          currentIngredient && (
            <Box className="flex flex-col gap-3 text-left">
              <Typography variant="body1" sx={{ textAlign: 'center' }}>
                Are you sure you want to delete <strong>{currentIngredient?.name}</strong>?
              </Typography>

              {usageInfo && (usageInfo.usageCount ?? 0) > 0 && (
                <Box sx={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '2px solid #fdba74',
                  borderLeft: '4px solid #ea580c',
                  borderRadius: '4px',
                  mt: 2
                }}>
                  <Box sx={{ display: 'flex', gap: 1, marginBottom: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 600 }}>
                      ⚠️ Warning
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 600, marginBottom: '8px' }}>
                    This ingredient is used in <strong>{usageInfo.usageCount ?? 0}</strong> recipe{(usageInfo.usageCount ?? 0) === 1 ? '' : 's'}:
                  </Typography>
                  <Box sx={{ marginLeft: '16px', marginBottom: '8px' }}>
                    {usageInfo.recipes?.slice(0, 5).map((recipe) => (
                      <Typography key={recipe.recipe_id} variant="body2" sx={{ color: '#b45309', fontSize: '0.875rem' }}>
                        • {recipe.title}
                      </Typography>
                    ))}
                    {usageInfo.recipes && usageInfo.recipes.length > 5 && (
                      <Typography variant="body2" sx={{ color: '#b45309', fontSize: '0.875rem', marginTop: '4px' }}>
                        ...and {usageInfo.recipes.length - 5} more
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#92400e' }}>
                    Deleting this ingredient will remove it from all recipes and the ingredient will be completely deleted from the system.
                  </Typography>
                </Box>
              )}
            </Box>
          )
        }
      />


      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseView}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
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
            Ingredient Details
          </Typography>
          <IconButton onClick={handleCloseView} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
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
          {isFetchingDetails ? (
            <Typography variant="body1" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              Loading latest details...
            </Typography>
          ) : viewData ? (
            <>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 3,
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
              }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Name
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                    {viewData.name || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                  {viewData.created_at && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          Created At
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {new Date(viewData.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                    </Box>
                  )}
                  {viewData.updated_at && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          Updated At
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {new Date(viewData.updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                gap: 2,
              }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Usage</Typography>
                  <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 700 }}>{viewData.usage_count || 0} Recipes</Typography>
                </Box>
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">No details found.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
          <Button
            onClick={handleCloseView}
            variant="outlined"
            sx={{
              borderRadius: '6px',
              color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
              borderColor: isDarkMode ? '#404656' : '#d8d6de',
              '&:hover': {
                borderColor: isDarkMode ? '#d0d2d6' : '#4b4b4b',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
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

export default IngredientManagement;

