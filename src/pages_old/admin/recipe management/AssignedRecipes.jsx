"use client";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  CircularProgress,
  Autocomplete,
  TextField,
  Pagination,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTheme } from "../../../context/ThemeContext";

import { PageHeader, SearchBar, ConfirmDialog } from "../../../components/common";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast } from '../../../utils/toast';
import moment from "moment";
import { useSelector } from "react-redux";
import { AccessDenied } from "../../../components/common";
import { useGetAssignedRecipesQuery, useDeleteAssignedRecipeByIdMutation, useGetAssignedUsersQuery } from "../../../features/api/assignedRecipeApi";
import { useGetAllUsersQuery } from "../../../features/api/authApi";
import { useGetRecipeCategoryDropdownQuery } from "../../../features/api/categoryApi";
import AddEditAssignedRecipeDialog from "./AddEditAssignedRecipeDialog";
import ViewAssignedRecipeDialog from "./ViewAssignedRecipeDialog";


const STATUS_OPTIONS = [
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On hold" },
];

const statusLabel = (v) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v;

const AssignedRecipes = () => {
  const { isDarkMode } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === "admin" || user?.role_name === "admin";
  const canList =
    isAdmin ||
    userPermissions.includes("assigned_recipe.list") ||
    userPermissions.includes("assigned_recipe.list_all");
  const canCreate = isAdmin || userPermissions.includes("assigned_recipe.create");
  const canUpdate = isAdmin || userPermissions.includes("assigned_recipe.update");
  const canDelete = isAdmin || userPermissions.includes("assigned_recipe.delete");
  const canUserList = isAdmin || userPermissions.includes("user.list");
  const canListAll = isAdmin || userPermissions.includes("assigned_recipe.list_all");



  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(() => {
    const urlPage = parseInt(searchParams.get("page"));
    return urlPage > 0 ? urlPage : 1;
  });
  const [limit, setLimit] = useState(() => {
    const urlLimit = parseInt(searchParams.get("limit"));
    return urlLimit > 0 ? urlLimit : 50;
  });

  const syncUrlParams = (newPage, newLimit) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newPage > 1) next.set("page", newPage);
      else next.delete("page");
      if (newLimit !== 50) next.set("limit", newLimit);
      else next.delete("limit");
      return next;
    });
  };
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "");
  const [statusInput, setStatusInput] = useState(() => searchParams.get("status") || "");
  const [assignedToInput, setAssignedToInput] = useState(() => searchParams.get("assignedTo") ? parseInt(searchParams.get("assignedTo"), 10) : "");
  const [assignedToFilter, setAssignedToFilter] = useState(() => searchParams.get("assignedTo") ? parseInt(searchParams.get("assignedTo"), 10) : "");
  const [categoryInput, setCategoryInput] = useState(() => searchParams.get("category") ? parseInt(searchParams.get("category"), 10) : "");
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get("category") ? parseInt(searchParams.get("category"), 10) : "");
  const [subCategoryInput, setSubCategoryInput] = useState(() => searchParams.get("subCategory") ? parseInt(searchParams.get("subCategory"), 10) : "");
  const [subCategoryFilter, setSubCategoryFilter] = useState(() => searchParams.get("subCategory") ? parseInt(searchParams.get("subCategory"), 10) : "");
  const [createdInput, setCreatedInput] = useState(() => searchParams.get("created") || "");
  const [createdFilter, setCreatedFilter] = useState(() => searchParams.get("created") || "");
  
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [editRow, setEditRow] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: usersData } = useGetAssignedUsersQuery({});
  const { data: categoriesData } = useGetRecipeCategoryDropdownQuery({});

  const userOptions = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.map(u => ({ label: u.name || u.email, value: u.user_id }));
  }, [usersData]);

  const categoryOptions = useMemo(() => {
    if (!categoriesData?.data) return [];
    return categoriesData.data.map(c => {
      let subs = [];
      if (Array.isArray(c.sub_categories)) {
        subs = c.sub_categories;
      } else if (typeof c.sub_categories === "string") {
        try { subs = JSON.parse(c.sub_categories); } catch (e) {}
      }
      return { label: c.name, value: c.category_id, subCategories: subs };
    });
  }, [categoriesData]);

  const subCategoryOptions = useMemo(() => {
    if (!categoryOptions || categoryOptions.length === 0) return [];
    
    if (categoryInput) {
      const cat = categoryOptions.find(c => c.value === categoryInput);
      if (!cat) return [];
      return cat.subCategories.map(sc => ({ label: sc.name, value: sc.sub_category_id }));
    }
    
    // If no category is selected, return all sub-categories from all categories
    let allSubCats = [];
    categoryOptions.forEach(cat => {
      cat.subCategories.forEach(sc => {
        allSubCats.push({ 
          label: `${sc.name} (${cat.label})`, 
          value: sc.sub_category_id 
        });
      });
    });
    return allSubCats;
  }, [categoryInput, categoryOptions]);

  const { data, isLoading, isFetching } = useGetAssignedRecipesQuery(
    {
      search: debouncedSearch,
      page,
      limit,
      status: statusFilter,
      assignedTo: assignedToFilter,
      category: categoryFilter,
      subCategory: subCategoryFilter,
      created: createdFilter,
    },
    { refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: true }
  );

  const [deleteAssignedRecipe, { isLoading: isDeleting }] = useDeleteAssignedRecipeByIdMutation();

  const [tableRows, setTableRows] = useState([]);
  const [tablePagination, setTablePagination] = useState({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  });

  useEffect(() => {
    document.title = "Assigned Recipes";
  }, []);

  useEffect(() => {
    if (data && !isFetching) {
      setTableRows(data.data || []);
      setTablePagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
    }
  }, [data, isFetching, limit]);

  const searchTimerRef = useRef(null);
  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("search", value);
        else next.delete("search");
        return next;
      });
    }, 400);
  };

  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("status", value);
      else next.delete("status");
      return next;
    });
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const rows = tableRows;

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode("add");
    setEditRow(null);
  };

  const handleOpenAdd = () => {
    setEditRow(null);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleOpenEdit = useCallback((row) => {
    setEditRow(row);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  const handleOpenView = useCallback((row) => {
    setEditRow(row);
    setDialogMode("view");
    setDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAssignedRecipe(deleteId).unwrap();
      toast.success("Assigned recipe deleted");
      setTableRows((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteId(null);
  };

  const handleCopyRecipeName = (recipeName) => {
    navigator.clipboard.writeText(recipeName).then(() => {
      toast.success("Recipe name copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy recipe name");
    });
  };

  const statusColors = useMemo(
    () => ({
      assigned: isDarkMode ? "#3b82f6" : "#2563eb",
      "in-progress": isDarkMode ? "#f59e0b" : "#d97706",
      completed: isDarkMode ? "#10b981" : "#059669",
      "on-hold": isDarkMode ? "#9ca3af" : "#6b7280",
    }),
    [isDarkMode]
  );

  const pagination = tablePagination;

  
  const handleClearFilters = () => {
    setSearch('')
    setStatusInput('')
    setStatusFilter('')
    setAssignedToInput('')
    setAssignedToFilter('')
    setCategoryInput('')
    setCategoryFilter('')
    setSubCategoryInput('')
    setSubCategoryFilter('')
    setCreatedInput('')
    setCreatedFilter('')
    setDebouncedSearch('')
    setPage(1)
    setSearchParams(new URLSearchParams())
  }

  const handleSearch = () => {
    setDebouncedSearch(search)
    setStatusFilter(statusInput)
    setAssignedToFilter(assignedToInput)
    setCategoryFilter(categoryInput)
    setSubCategoryFilter(subCategoryInput)
    setCreatedFilter(createdInput)
    setPage(1)
    setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (search) next.set('search', search)
        else next.delete('search')
        if (statusInput) next.set('status', statusInput)
        else next.delete('status')
        if (assignedToInput) next.set('assignedTo', assignedToInput)
        else next.delete('assignedTo')
        if (categoryInput) next.set('category', categoryInput)
        else next.delete('category')
        if (subCategoryInput) next.set('subCategory', subCategoryInput)
        else next.delete('subCategory')
        if (createdInput) next.set('created', createdInput)
        else next.delete('created')
        next.delete('page')
        return next
    })
  }

  const hasActiveFilters = search !== '' || statusInput !== '' || statusFilter !== '' || debouncedSearch !== '' || assignedToInput !== '' || assignedToFilter !== '' || categoryInput !== '' || categoryFilter !== '' || subCategoryInput !== '' || subCategoryFilter !== '' || createdInput !== '' || createdFilter !== '';

  const selectStyles = {
    height: 38,
    bgcolor: isDarkMode ? '#283046' : '#fff',
    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' }
  };

  
  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to view assigned recipes." />;
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
                        Assigned Recipes
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
                {/* Search and Refresh Row */}
                <Box className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full flex-wrap gap-3">
                    <Box className="flex items-center gap-2 flex-wrap">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search assigned recipes..."
                            className="px-3 py-2 border rounded outline-none transition-colors"
                            style={{
                                height: '38px',
                                width: '250px',
                                backgroundColor: isDarkMode ? '#283046' : '#fff',
                                borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                borderRadius: '4px',
                            }}
                        />

                    </Box>
                    <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowFilters(!showFilters)}
                            startIcon={<FilterListIcon />}
                            sx={{
                                height: '38px',
                                textTransform: 'none',
                                borderColor: showFilters ? (isDarkMode ? '#10b981' : '#059669') : (isDarkMode ? '#404656' : '#d8d6de'),
                                color: showFilters ? (isDarkMode ? '#10b981' : '#059669') : (isDarkMode ? '#d0d2d6' : '#6e6b7b'),
                            }}
                        >
                            Filters
                        </Button>
                    </Box>
                </Box>

                <Box
                    ref={filterRef}
                    sx={{
                        display: showFilters ? 'grid' : { xs: 'none', lg: 'grid' },
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)',
                            xl: 'repeat(6, 1fr)',
                        },
                        gap: 2,
                        width: '100%',
                        alignItems: 'center',
                        transition: 'all 0.3s ease-in-out',
                        '& > *': { width: '100%', m: 0 }
                    }}
                >
                    {/* Status Filter */}
                    <FormControl size="small" sx={{ width: '100%' }}>
                        <Autocomplete
                            size="small"
                            options={[
                                { label: 'All Status', value: '' },
                                ...STATUS_OPTIONS
                            ]}
                            getOptionLabel={(option) => option.label || ''}
                            value={
                                [
                                    { label: 'All Status', value: '' },
                                    ...STATUS_OPTIONS
                                ].find(opt => opt.value === statusInput) || { label: 'All Status', value: '' }
                            }
                            onChange={(_, newValue) => {
                                setStatusInput(newValue ? newValue.value : '');
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

                    {/* Assigned To Filter */}
                    {canListAll && (
                        <FormControl size="small" sx={{ width: '100%' }}>
                            <Autocomplete
                                size="small"
                                options={[
                                    { label: 'All Users', value: '' },
                                    ...userOptions
                                ]}
                                getOptionLabel={(option) => option.label || ''}
                                value={
                                    [
                                        { label: 'All Users', value: '' },
                                        ...userOptions
                                    ].find(opt => opt.value === assignedToInput) || { label: 'All Users', value: '' }
                                }
                                onChange={(_, newValue) => {
                                    setAssignedToInput(newValue ? newValue.value : '');
                                }}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="All Users"
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
                    )}

                    {/* Category Filter */}
                    <FormControl size="small" sx={{ width: '100%' }}>
                        <Autocomplete
                            size="small"
                            options={[
                                { label: 'All Categories', value: '' },
                                ...categoryOptions
                            ]}
                            getOptionLabel={(option) => option.label || ''}
                            value={
                                [
                                    { label: 'All Categories', value: '' },
                                    ...categoryOptions
                                ].find(opt => opt.value === categoryInput) || { label: 'All Categories', value: '' }
                            }
                            onChange={(_, newValue) => {
                                setCategoryInput(newValue ? newValue.value : '');
                                setSubCategoryInput(''); // Reset sub-category when category changes
                            }}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="All Categories"
                                    sx={{
                                        '& .MuiOutlinedInput-root': { padding: '0 39px 0 0 !important', height: 38, ...selectStyles, },
                                        '& .MuiInputBase-input': { padding: '8px 14px !important', height: 'auto', color: isDarkMode ? '#d0d2d6' : '#6e6b7b', }
                                    }}
                                />
                            )}
                            disablePortal={true}
                            slotProps={{
                                paper: {
                                    sx: {
                                        bgcolor: isDarkMode ? '#283046' : '#ffffff', color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        borderRadius: '6px', border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                        boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                                        '& .MuiAutocomplete-listbox': { padding: '0', '& .MuiAutocomplete-option': { fontSize: '0.9rem', '&:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' } } }
                                    }
                                }
                            }}
                        />
                    </FormControl>

                    {/* Sub Category Filter */}
                    <FormControl size="small" sx={{ width: '100%' }}>
                        <Autocomplete
                            size="small"
                            options={[
                                { label: 'All Sub-categories', value: '' },
                                ...subCategoryOptions
                            ]}
                            getOptionLabel={(option) => option.label || ''}
                            value={
                                [
                                    { label: 'All Sub-categories', value: '' },
                                    ...subCategoryOptions
                                ].find(opt => opt.value === subCategoryInput) || { label: 'All Sub-categories', value: '' }
                            }
                            onChange={(_, newValue) => {
                                setSubCategoryInput(newValue ? newValue.value : '');
                            }}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="All Sub-categories"
                                    sx={{
                                        '& .MuiOutlinedInput-root': { padding: '0 39px 0 0 !important', height: 38, ...selectStyles, },
                                        '& .MuiInputBase-input': { padding: '8px 14px !important', height: 'auto', color: isDarkMode ? '#d0d2d6' : '#6e6b7b', }
                                    }}
                                />
                            )}
                            disablePortal={true}
                            slotProps={{
                                paper: {
                                    sx: {
                                        bgcolor: isDarkMode ? '#283046' : '#ffffff', color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        borderRadius: '6px', border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                        boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                                        '& .MuiAutocomplete-listbox': { padding: '0', '& .MuiAutocomplete-option': { fontSize: '0.9rem', '&:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' } } }
                                    }
                                }
                            }}
                        />
                    </FormControl>

                    {/* Created Filter */}
                    <FormControl size="small" sx={{ width: '100%' }}>
                        <input
                            type="date"
                            value={createdInput}
                            onChange={(e) => setCreatedInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="px-3 py-2 border rounded outline-none transition-colors"
                            style={{
                                height: '38px',
                                width: '100%',
                                backgroundColor: isDarkMode ? '#283046' : '#fff',
                                borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                borderRadius: '4px',
                            }}
                        />
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Button 
                            variant="outlined" 
                            onClick={handleClearFilters} 
                            color="error" 
                            disabled={!hasActiveFilters}
                            sx={{ flex: 1, height: '38px', textTransform: 'none' }}
                        >
                            Clear
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSearch} 
                            sx={{ flex: 1, height: '38px', bgcolor: '#7367f0', '&:hover': { bgcolor: '#5e50ee' }, textTransform: 'none' }}
                        >
                            Search
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* ── AG Grid ───────────────────────────────────────────────── */}

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
                        borderRadius: '4px' 
                    },
                    '&::-webkit-scrollbar-thumb:hover': { 
                        background: isDarkMode ? '#505666' : '#a8a8a8' 
                    }
                }}
            >
                <Table stickyHeader sx={{ minWidth: 1000, borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                        <TableRow>
                            {['#', 'Recipe name', 'Status', 'Assigned to', 'Category', 'Sub-category', 'Created', ...(canUpdate || canDelete ? ['Actions'] : [])].map((headCell, index) => (
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
                                <TableCell colSpan={canUpdate || canDelete ? 8 : 7} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    <Typography sx={{ mt: 2, color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Loading...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : tableRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canUpdate || canDelete ? 8 : 7} align="center" sx={{ py: 8 }}>
                                    <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No assigned recipes found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tableRows.map((row, index) => {
                                const statusVal = row.status || "assigned";
                                const statusColor = statusColors[statusVal] || (isDarkMode ? "#e5e7eb" : "#374151");
                                
                                return (
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
                                        }
                                    }}
                                >
                                    <TableCell align="center">
                                        {(page - 1) * limit + index + 1}
                                    </TableCell>
                                    
                                    <TableCell align="center">
                                        <Box className="flex gap-2 items-center justify-center h-full">
                                            <Typography variant="body2">{row.recipe_name || "-"}</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopyRecipeName(row.recipe_name)}
                                                sx={{
                                                    color: isDarkMode ? "#3b82f6" : "#2563eb",
                                                    padding: "4px",
                                                    "&:hover": {
                                                        backgroundColor: isDarkMode ? "#1e3a8a" : "#dbeafe",
                                                    },
                                                }}
                                                title="Copy recipe name"
                                            >
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Typography
                                            variant="body2"
                                            sx={{ color: statusColor, fontWeight: "bold" }}
                                        >
                                            {statusLabel(statusVal)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Box sx={{ textAlign: "center", lineHeight: 1.35 }}>
                                            <Typography variant="body2">{row.assigned_user_name || "-"}</Typography>
                                            <Typography variant="caption" sx={{ display: "block", opacity: 0.8 }}>
                                                {row.assigned_user_email || (row.assign_user_id ? `ID: ${row.assign_user_id}` : "Unassigned")}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        {row.category_name || "-"}
                                    </TableCell>

                                    <TableCell align="center">
                                        {row.sub_category_name || "-"}
                                    </TableCell>

                                    <TableCell align="center">
                                        {row.created_at ? moment(row.created_at).format("MMM D, YYYY HH:mm") : "-"}
                                    </TableCell>

                                    {(canUpdate || canDelete) && (
                                        <TableCell align="center">
                                            <Box className="flex gap-2 justify-center items-center h-full">
                                                <Tooltip title="View" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenView(row)}
                                                        sx={{
                                                            color: isDarkMode ? "#10b981" : "#059669",
                                                            "&:hover": {
                                                                backgroundColor: isDarkMode ? "#064e3b" : "#d1fae5",
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
                                                            onClick={() => handleOpenEdit(row)}
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
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )})
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

      <AddEditAssignedRecipeDialog
        open={dialogOpen && dialogMode !== "view"}
        onClose={handleCloseDialog}
        mode={dialogMode}
        assignedRecipe={dialogMode === "edit" ? editRow : null}
        canUserList={canUserList}
      />

      <ViewAssignedRecipeDialog
        open={dialogOpen && dialogMode === "view"}
        onClose={handleCloseDialog}
        assignedRecipe={editRow}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Assigned Recipe"
        message={
          tableRows?.find((r) => r.id === deleteId) ? (
            <>
              Are you sure you want to delete the assignment for{" "}
              <strong>{tableRows.find((r) => r.id === deleteId)?.recipe_name}</strong>? This cannot be undone.
            </>
          ) : (
            "This cannot be undone."
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

export default AssignedRecipes;

