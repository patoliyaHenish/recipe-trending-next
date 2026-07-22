import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
"use client";
import {
  Box,
  Button,
  Typography,
  FormControl,
  MenuItem,
  Select,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Popover,
  MenuList,
  TextField,
  InputBase,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Switch,
  Pagination,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Collapse,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import UpdateIcon from '@mui/icons-material/Update';
import { FilterAltOutlined, FilterAltOffOutlined } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { getImage, getYouTubeThumbnail } from '../../../utils/helper';
import { useSelector } from 'react-redux';
import { AccessDenied } from '../../../components/common';
import PublicApprovedToggle from '../../../components/common/PublicApprovedToggle';
import { toast } from '../../../utils/toast';
import {
  ActionButtons,
  ConfirmDialog,
  PageHeader,
  SearchBar,
  AdminApprovedToggle
} from '../../../components/common';
import { useTheme } from '../../../context/ThemeContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickerDay } from '@mui/x-date-pickers/PickerDay';
import moment from 'moment';
import {
  useCreateRecipeByAdminMutation,
  useDeleteRecipeByAdminMutation,
  useGetAllRecipesForAdminQuery,
  useGetRecipeByIdForAdminQuery,
  useUpdateRecipeByAdminMutation,
  useUpdateRecipePublicApprovedStatusMutation,
  useUpdateRecipeAdminApprovedStatusMutation,
  useUpdateRecipeBadgeMutation,
} from '../../../features/api/recipeApi';
import { useGetAllKeywordsQuery } from '../../../features/api/keywordApi';
import { useGetRecipeCategoryDropdownQuery } from '../../../features/api/categoryApi';
import ViewRecipeDialog from './ViewRecipeDialog';
import RecipeNotesDialog from './RecipeNotesDialog';




const CustomPickerDay = (props) => {
  const { day, selected, outsideCurrentMonth, rangeStart, rangeEnd, isDarkMode, ...other } = props;
  
  if (!rangeStart || !rangeEnd) {
      return <PickerDay day={day} selected={selected} outsideCurrentMonth={outsideCurrentMonth} sx={{ color: isDarkMode ? '#e5e7eb' : '#374151' }} {...other} />;
  }

  const start = moment(rangeStart);
  const end = moment(rangeEnd);
  
  // Sort them just in case
  const actualStart = start.isBefore(end) ? start : end;
  const actualEnd = start.isAfter(end) ? start : end;

  const isSelected = day.isSame(actualStart, 'day') || day.isSame(actualEnd, 'day');
  const isBetween = day.isAfter(actualStart, 'day') && day.isBefore(actualEnd, 'day');
  const isStart = day.isSame(actualStart, 'day');
  const isEnd = day.isSame(actualEnd, 'day');

  return (
    <Box
      sx={{
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(isBetween && {
          backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.25)' : '#e0e7ff',
        }),
        ...(isStart && !isEnd && {
           background: isDarkMode ? 'linear-gradient(to right, transparent 50%, rgba(115, 103, 240, 0.25) 50%)' : 'linear-gradient(to right, transparent 50%, #e0e7ff 50%)'
        }),
        ...(isEnd && !isStart && {
           background: isDarkMode ? 'linear-gradient(to left, transparent 50%, rgba(115, 103, 240, 0.25) 50%)' : 'linear-gradient(to left, transparent 50%, #e0e7ff 50%)'
        })
      }}
    >
      <PickerDay
        {...other}
        day={day}
        selected={isSelected}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          color: isDarkMode ? '#e5e7eb !important' : '#374151 !important',
          width: '36px !important',
          height: '36px !important',
          margin: '0 !important',
          ...(isSelected && {
            backgroundColor: '#7367f0 !important',
            color: '#fff !important',
            borderRadius: '50% !important',
          }),
          ...(!isSelected && {
            backgroundColor: 'transparent !important',
            borderRadius: '50% !important',
          })
        }}
      />
    </Box>
  );
};


const Recipe = () => {
  const { isDarkMode } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canListAll = isAdmin || userPermissions.includes('recipe.list_all');
  const canViewAll = isAdmin || userPermissions.includes('recipe.view_all');
  const canList = isAdmin || userPermissions.includes('recipe.list_all') || userPermissions.includes('recipe.list');
  const canCreate = isAdmin || userPermissions.includes('recipe.create');
  const canUpdate = isAdmin || userPermissions.includes('recipe.update');
  const canDelete = isAdmin || userPermissions.includes('recipe.delete');
  const canView = canViewAll || userPermissions.includes('recipe.view');
  const canPublish = isAdmin || userPermissions.includes('recipe.publish');
  const canUpdateAll = isAdmin || userPermissions.includes('recipe.update_all');
  const canDeleteAll = isAdmin || userPermissions.includes('recipe.delete_all');
  const canPublishAll = isAdmin || userPermissions.includes('recipe.publish_all');
  const canViewAnalytics = isAdmin || userPermissions.includes('recipe.analytics_view');
  const canNotesList = isAdmin || userPermissions.includes('recipe.note_list_all') || userPermissions.includes('recipe.note_list');
  const canNotesAdd = isAdmin || userPermissions.includes('recipe.notes_add');
  const canNotesDelete = isAdmin || userPermissions.includes('recipe.notes_delete');
  const canNotesUpdateStatus = isAdmin || userPermissions.includes('recipe.notes_update_status');

  useEffect(() => {
    document.title = 'Recipes Management'
  })


  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [page, setPage] = useState(() => {
    const urlPage = parseInt(searchParams.get('page'));
    return urlPage > 0 ? urlPage : 1;
  });
  const [limit, setLimit] = useState(() => {
    const urlLimit = parseInt(searchParams.get('limit'));
    return urlLimit > 0 ? urlLimit : 50;
  });
  const [allRecipes, setAllRecipes] = useState([]);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteConflict, setDeleteConflict] = useState(null);
  const [publicToggleItem, setPublicToggleItem] = useState(null);
  const [adminToggleItem, setAdminToggleItem] = useState(null);
  const [editId, setEditId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [noteRecipeId, setNoteRecipeId] = useState(null);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [badgeDialogRecipeId, setBadgeDialogRecipeId] = useState(null);
  const [badgeDialogRecipeData, setBadgeDialogRecipeData] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', note: '', prep_time: '', cook_time: '', serving_size: '', ingredients_id: [], instructions: [], keywords: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [publicApproved, setPublicApproved] = useState(() => searchParams.get('public_approved') || '');
  const [adminApproved, setAdminApproved] = useState(() => searchParams.get('admin_approved') || '');
  const [foodType, setFoodType] = useState(() => searchParams.get('food_type') || '');
  const [badge, setBadge] = useState(() => searchParams.get('badge') || '');
  const [viewFilterType, setViewFilterType] = useState(() => searchParams.get('view_type') || '');
  const [viewFilterOp, setViewFilterOp] = useState(() => searchParams.get('view_op') || '');
  const [viewFilterValue, setViewFilterValue] = useState(() => searchParams.get('view_value') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [subCategory, setSubCategory] = useState(() => searchParams.get('sub_category') || '');
  const [subCategorySearchInput, setSubCategorySearchInput] = useState('');
  const [subCategoryAnchorEl, setSubCategoryAnchorEl] = useState(null);
  const [approvedFrom, setApprovedFrom] = useState(() => searchParams.get('approved_from') || '');
  const [approvedTo, setApprovedTo] = useState(() => searchParams.get('approved_to') || '');
  const [approvedRange, setApprovedRange] = useState(undefined);
  const [rangeAnchorEl, setRangeAnchorEl] = useState(null);
  const [adminApprovedFrom, setAdminApprovedFrom] = useState(() => searchParams.get('admin_approved_from') || '');
  const [adminApprovedTo, setAdminApprovedTo] = useState(() => searchParams.get('admin_approved_to') || '');
  const [adminApprovedRange, setAdminApprovedRange] = useState(undefined);
  const [adminRangeAnchorEl, setAdminRangeAnchorEl] = useState(null);
  const [createdFrom, setCreatedFrom] = useState(() => searchParams.get('created_from') || '');
  const [createdTo, setCreatedTo] = useState(() => searchParams.get('created_to') || '');
  const [createdRange, setCreatedRange] = useState(undefined);
  const [createdRangeAnchorEl, setCreatedRangeAnchorEl] = useState(null);
  const [updatedFrom, setUpdatedFrom] = useState(() => searchParams.get('updated_from') || '');
  const [updatedTo, setUpdatedTo] = useState(() => searchParams.get('updated_to') || '');
  const [updatedRange, setUpdatedRange] = useState(undefined);
  const [updatedRangeAnchorEl, setUpdatedRangeAnchorEl] = useState(null);
  const [pendingNotesOnly, setPendingNotesOnly] = useState(() => searchParams.get('pending_notes') === 'true');
  const [hasUpdatesAfterNotes, setHasUpdatesAfterNotes] = useState(() => searchParams.get('has_updates') === 'true');
  const [showAnalyticsColumns, setShowAnalyticsColumns] = useState(() => searchParams.get('show_analytics') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdatedRecipeId, setLastUpdatedRecipeId] = useState(null);
  const [createdBy, setCreatedBy] = useState(() => searchParams.get('created_by') || '');
  const [keyword, setKeyword] = useState(() => { const kw = searchParams.get('keyword'); return kw ? kw.split(',') : []; });
  const [creatorSearchInput, setCreatorSearchInput] = useState('');
  const [keywordSearchInput, setKeywordSearchInput] = useState('');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort_by') || 'created_at');
  const filterRef = useRef();

  const dropdownSx = {
    height: '38px',
    borderRadius: '4px',
    backgroundColor: isDarkMode ? '#283046' : '#ffffff',
    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
    transition: 'all 0.3s ease',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isDarkMode ? '#404656' : '#d8d6de'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: isDarkMode ? '#3b4253' : '#b4b7bd'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#7367f0'
    },
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      boxSizing: 'border-box',
      py: 0,
      pl: '14px',
      pr: '32px',
      fontSize: '0.9rem'
    },
    '& .MuiSelect-icon': {
      color: isDarkMode ? '#9ca3af' : '#6b7280'
    }
  };

  const menuPropsSx = {
    PaperProps: {
      sx: {
        bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
        color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        borderRadius: '6px',
        border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
        boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
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
    }
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      height: '38px',
      borderRadius: '4px',
      backgroundColor: isDarkMode ? '#283046' : '#ffffff',
      color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
      transition: 'all 0.3s ease',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: isDarkMode ? '#404656' : '#d8d6de'
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: isDarkMode ? '#3b4253' : '#b4b7bd'
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#7367f0'
      }
    },
    '& .MuiInputBase-input': {
      height: '100%',
      boxSizing: 'border-box',
      py: 0,
      fontSize: '0.9rem'
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
      lineHeight: '38px',
      top: '-10px',
      '&.MuiInputLabel-shrink': {
        top: 0
      }
    }
  };

  const [apiFilters, setApiFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    subCategory: searchParams.get('sub_category') || '',
    publicApproved: searchParams.get('public_approved') || '',
    adminApproved: searchParams.get('admin_approved') || '',
    foodType: searchParams.get('food_type') || '',
    approvedFrom: searchParams.get('approved_from') || '',
    approvedTo: searchParams.get('approved_to') || '',
    adminApprovedFrom: searchParams.get('admin_approved_from') || '',
    adminApprovedTo: searchParams.get('admin_approved_to') || '',
    createdFrom: searchParams.get('created_from') || '',
    createdTo: searchParams.get('created_to') || '',
    updatedFrom: searchParams.get('updated_from') || '',
    updatedTo: searchParams.get('updated_to') || '',
    badge: searchParams.get('badge') || '',
    viewType: searchParams.get('view_type') || '',
    viewOp: searchParams.get('view_op') || '',
    viewValue: searchParams.get('view_value') || '',
    createdBy: searchParams.get('created_by') || '',
    keyword: searchParams.get('keyword') || '',
    pendingNotesOnly: searchParams.get('pending_notes') === 'true',
    hasUpdatesAfterNotes: searchParams.get('has_updates') === 'true',
    showAnalyticsColumns: searchParams.get('show_analytics') === 'true',
    sortBy: searchParams.get('sort_by') || 'created_at'
  });

  const { data: categoryDropdownData } = useGetRecipeCategoryDropdownQuery();
  const { data: keywordsData } = useGetAllKeywordsQuery({ limit: 1000 });

  let defaultForm = {
    title: '',
    description: '',
    prep_time: '',
    cook_time: '',
    serving_size: '',
    category_id: '',
    sub_category_id: null,
    ingredients: [],
    recipe_instructions: [],
    keywords: [],
    video_url: '',
    image_url: '',
    slug: '',
    food_type: 'veg',
    isActive: true,
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const { data, isLoading, isFetching, refetch } = useGetAllRecipesForAdminQuery({
    search: apiFilters.search,
    page,
    limit,
    ...(apiFilters.publicApproved === '' ? {} : { public_approved: apiFilters.publicApproved === 'true' }),
    ...(apiFilters.adminApproved === '' ? {} : { admin_approved: apiFilters.adminApproved === 'true' }),
    ...(apiFilters.category ? { category_name: apiFilters.category } : {}),
    ...(apiFilters.subCategory ? { sub_category_name: apiFilters.subCategory } : {}),
    ...(apiFilters.foodType ? { food_type: apiFilters.foodType } : {}),
    ...(apiFilters.approvedFrom ? { public_approved_from: apiFilters.approvedFrom } : {}),
    ...(apiFilters.approvedTo ? { public_approved_to: apiFilters.approvedTo } : {}),
    ...(apiFilters.adminApprovedFrom ? { admin_approved_from: apiFilters.adminApprovedFrom } : {}),
    ...(apiFilters.adminApprovedTo ? { admin_approved_to: apiFilters.adminApprovedTo } : {}),
    ...(apiFilters.createdFrom ? { created_at_from: apiFilters.createdFrom } : {}),
    ...(apiFilters.createdTo ? { created_at_to: apiFilters.createdTo } : {}),
    ...(apiFilters.updatedFrom ? { updated_at_from: apiFilters.updatedFrom } : {}),
    ...(apiFilters.updatedTo ? { updated_at_to: apiFilters.updatedTo } : {}),
    ...(apiFilters.badge ? { badge: apiFilters.badge } : {}),
    ...(apiFilters.createdBy ? { created_by: apiFilters.createdBy } : {}),
    ...(apiFilters.keyword ? { keyword: apiFilters.keyword } : {}),
    ...(apiFilters.pendingNotesOnly ? { pending_notes: true } : {}),
    ...(apiFilters.hasUpdatesAfterNotes ? { has_updates: true } : {}),
    sort_by: apiFilters.sortBy
  }, { refetchOnMountOrArgChange: true });
  const [createRecipeByAdmin, { isLoading: isAdding }] = useCreateRecipeByAdminMutation();
  const [deleteRecipeByAdmin, { isLoading: isDeleting }] = useDeleteRecipeByAdminMutation();
  const [updateRecipeByAdmin, { isLoading: isUpdating }] = useUpdateRecipeByAdminMutation();
  const [updateRecipePublicApprovedStatus, { isLoading: isUpdatingPublicStatus }] = useUpdateRecipePublicApprovedStatusMutation();
  const [updateRecipeAdminApprovedStatus, { isLoading: isUpdatingAdminStatus }] = useUpdateRecipeAdminApprovedStatusMutation();
  const [updateRecipeBadge] = useUpdateRecipeBadgeMutation();

  const { data: editRecipeData } = useGetRecipeByIdForAdminQuery(editId, { skip: !editId || isSubmitting });
  const { data: viewRecipeData, isLoading: isViewLoading, refetch: refetchViewRecipe } = useGetRecipeByIdForAdminQuery(viewId, { skip: !viewId });

  const isAnyDialogOpen = addOpen || !!editId || !!viewId || !!deleteId;
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  useEffect(() => {
    setAllRecipes([]);
  }, []);

  useEffect(() => {
    if (viewId && lastUpdatedRecipeId === viewId) {
      refetchViewRecipe();
      setLastUpdatedRecipeId(null);
    }
  }, [viewId, lastUpdatedRecipeId, refetchViewRecipe]);


  const filterTimerRef = useRef(null);
  const syncUrlParams = (pageVal, limitVal, filters) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const setOrDelete = (key, val) => val ? next.set(key, val) : next.delete(key);
      // Page & limit (only show in URL if not default)
      if (pageVal > 1) next.set('page', String(pageVal)); else next.delete('page');
      if (limitVal !== 50) next.set('limit', String(limitVal)); else next.delete('limit');
      // Filters
      if (filters) {
        setOrDelete('search', filters.search);
        setOrDelete('category', filters.category);
        setOrDelete('sub_category', filters.subCategory);
        setOrDelete('public_approved', filters.publicApproved);
        setOrDelete('admin_approved', filters.adminApproved);
        setOrDelete('food_type', filters.foodType);
        setOrDelete('badge', filters.badge);
        setOrDelete('created_by', filters.createdBy);
        setOrDelete('approved_from', filters.approvedFrom);
        setOrDelete('approved_to', filters.approvedTo);
        setOrDelete('admin_approved_from', filters.adminApprovedFrom);
        setOrDelete('admin_approved_to', filters.adminApprovedTo);
        setOrDelete('created_from', filters.createdFrom);
        setOrDelete('created_to', filters.createdTo);
        setOrDelete('updated_from', filters.updatedFrom);
        setOrDelete('updated_to', filters.updatedTo);
        setOrDelete('pending_notes', filters.pendingNotesOnly ? 'true' : '');
        setOrDelete('has_updates', filters.hasUpdatesAfterNotes ? 'true' : '');
        setOrDelete('keyword', filters.keyword);
        setOrDelete('show_analytics', filters.showAnalyticsColumns ? 'true' : '');
        setOrDelete('sort_by', filters.sortBy);
        setOrDelete('view_type', filters.viewType);
        setOrDelete('view_op', filters.viewOp);
        setOrDelete('view_value', filters.viewValue);
      }
      return next;
    });
  };

  const applyFilters = (overrides = {}, execute = false) => {
    if (!execute) return;
    const current = {
      search, category, subCategory, publicApproved, adminApproved, foodType, approvedFrom, approvedTo, adminApprovedFrom, adminApprovedTo, createdFrom, createdTo, updatedFrom, updatedTo, badge, createdBy, sortBy,
      pendingNotesOnly, keyword, hasUpdatesAfterNotes,
      showAnalyticsColumns,
      viewType: viewFilterType,
      viewOp: viewFilterOp,
      viewValue: viewFilterValue,
      ...overrides
    };
    setApiFilters(current);
    setPage(1);
    syncUrlParams(1, limit, current);
  };

  const handleSearchClick = () => {
    applyFilters({}, true);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    applyFilters({ search: val });
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setCategorySearchInput('');
    setSubCategory('');
    setSubCategorySearchInput('');
    setPublicApproved('');
    setAdminApproved('');
    setFoodType('');
    setBadge('');
    setCreatedBy('');
    setKeyword([]);
    setKeywordSearchInput('');
    setCreatorSearchInput('');
    setApprovedFrom('');
    setApprovedTo('');
    setApprovedRange(undefined);
    setRangeAnchorEl(null);
    setAdminApprovedFrom('');
    setAdminApprovedTo('');
    setAdminApprovedRange(undefined);
    setAdminRangeAnchorEl(null);
    setCreatedFrom('');
    setCreatedTo('');
    setCreatedRange(undefined);
    setCreatedRangeAnchorEl(null);
    setUpdatedFrom('');
    setUpdatedTo('');
    setUpdatedRange(undefined);
    setUpdatedRangeAnchorEl(null);
    setPendingNotesOnly(false);
    setHasUpdatesAfterNotes(false);
    setShowAnalyticsColumns(false);
    setPage(1);
    setViewFilterType('');
    setViewFilterOp('');
    setViewFilterValue('');
    setApiFilters({ search: '', category: '', subCategory: '', publicApproved: '', adminApproved: '', viewType: '', viewOp: '', viewValue: '', foodType: '', approvedFrom: '', approvedTo: '', adminApprovedFrom: '', adminApprovedTo: '', createdFrom: '', createdTo: '', updatedFrom: '', updatedTo: '', badge: '', createdBy: '', keyword: '', pendingNotesOnly: false, hasUpdatesAfterNotes: false, showAnalyticsColumns: false, sortBy: 'created_at' });
    setSearchParams({});
  };

  const formatRangeLabel = (range) => {
    if (!range?.from && !range?.to) return '';
    const startLabel = range.from ? range.from.toLocaleDateString() : 'Start';
    const endLabel = range.to ? range.to.toLocaleDateString() : 'End';
    return `${startLabel} - ${endLabel}`;
  };

  const toDateString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleLimitChange = (e) => {
    const newLimit = e.target.value;
    setLimit(newLimit);
    setPage(1);
    syncUrlParams(1, newLimit);
  };



  const handlePublicApprovedStatusChange = async () => {
    if (!publicToggleItem) return;
    try {
      if (!canPublish && !canPublishAll && !isAdmin) {
        toast.error('You do not have permission to update public approved status');
        setPublicToggleItem(null);
        return;
      }
      const response = await updateRecipePublicApprovedStatus({ id: publicToggleItem.recipe_id, public_approved: !publicToggleItem.public_approved }).unwrap();

      setAllRecipes((prev) => prev.map((r) =>
        r.recipe_id === publicToggleItem.recipe_id
          ? {
            ...r,
            public_approved: !publicToggleItem.public_approved,
            public_approved_time: !publicToggleItem.public_approved ? response.public_approved_time : null
          }
          : r
      ));
      toast.success('Public approved status updated successfully');
      setPublicToggleItem(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update public approved status');
      setPublicToggleItem(null);
    }
  };

  const handleAdminApprovedStatusChange = async () => {
    if (!adminToggleItem) return;
    try {
      if (!isAdmin) {
        toast.error('Only admins can update admin approval status');
        setAdminToggleItem(null);
        return;
      }
      const response = await updateRecipeAdminApprovedStatus({ id: adminToggleItem.recipe_id, is_admin_approved: !adminToggleItem.is_admin_approved }).unwrap();

      setAllRecipes((prev) => prev.map((r) =>
        r.recipe_id === adminToggleItem.recipe_id
          ? {
            ...r,
            is_admin_approved: !adminToggleItem.is_admin_approved,
            admin_approved_time: response.admin_approved_time,
            public_approved: response.public_approved,
            public_approved_time: response.public_approved_time
          }
          : r
      ));
      toast.success('Admin approval status updated successfully');
      setAdminToggleItem(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update admin approval status');
      setAdminToggleItem(null);
    }
  };
  useEffect(() => {
    if (data?.data && !isFetching) {
      setAllRecipes(data.data);
    } else if (!data?.data && !isFetching) {
      setAllRecipes([]);
    }
  }, [data, isFetching]);
  const handleBulkApprove = async () => {
    if (!selectedRows.length) return;
    setIsBulkApproving(true);
    try {
      if (!canPublish && !canPublishAll && !isAdmin) {
        toast.error('You do not have permission to update public approved status');
        return;
      }

      const promises = selectedRows.map(row =>
        updateRecipePublicApprovedStatus({ id: row.recipe_id, public_approved: true }).unwrap()
      );
      const responses = await Promise.all(promises);

      const updatedIds = new Set(selectedRows.map(r => r.recipe_id));
      const firstResponseTime = responses[0]?.public_approved_time;

      setAllRecipes((prev) => prev.map((r) =>
        updatedIds.has(r.recipe_id)
          ? {
            ...r,
            public_approved: true,
            public_approved_time: firstResponseTime || new Date().toISOString()
          }
          : r
      ));
      toast.success(`${selectedRows.length} recipes approved successfully`);
      setSelectedRows([]);
      setSelectionMode(false);
      setBulkApproveDialogOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to bulk approve recipes');
    } finally {
      setIsBulkApproving(false);
    }
  };




  useEffect(() => {
    if (editId && editRecipeData && editRecipeData.data) {
      const r = editRecipeData.data;
      setEditForm({
        title: r.title || '',
        description: r.description || '',
        note: r.note || '',
        prep_time: r.prep_time || '',
        cook_time: r.cook_time || '',
        serving_size: r.serving_size || '',
        category_id: r.category_id || '',
        sub_category_id: r.sub_category_id || null,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        instructions: Array.isArray(r.instructions)
          ? r.instructions.map(i => i.instruction_text || '')
          : [],
        keywords: Array.isArray(r.keywords) ? r.keywords : [],
        video_url: r.video_url || '',
        image_url: r.image_url || '',
        image: r.image || '',
        meta_title: r.meta_title || '',
        meta_description: r.meta_description || '',
        slug: r.slug || '',
        food_type: r.food_type || 'veg',
        badge: r.badge || '',
        isActive: r.public_approved ?? false,
      });
    }
  }, [editId, editRecipeData]);

  const handleAddOpen = () => navigate('/manage-recipes/add', { state: { returnTo: location.search } });

  const handleAddSubmit = async (values, { resetForm }) => {
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('note', values.note || '');
      formData.append('prep_time', values.prep_time);
      formData.append('cook_time', values.cook_time);
      formData.append('rest_time', values.rest_time || 0);
      formData.append('serving_size', values.serving_size);
      formData.append('category_id', values.category_id);
      if (values.sub_category_id) formData.append('sub_category_id', values.sub_category_id);
      formData.append('video_url', values.video_url || '');
      formData.append('meta_title', values.meta_title);
      formData.append('meta_description', values.meta_description);
      formData.append('slug', values.slug);
      formData.append('food_type', values.food_type);


      if (values.image instanceof File) {
        formData.append('image', values.image);
      }


      formData.append('keywords', JSON.stringify(values.keywords || []));
      formData.append('ingredients', JSON.stringify(values.ingredients || []));
      formData.append('recipe_instructions', JSON.stringify(values.recipe_instructions || []));


      await createRecipeByAdmin(formData).unwrap();
      toast.success('Recipe added successfully');
      handleAddClose();
      resetForm();
    } catch (error) {
      if (error?.data?.errors && Array.isArray(error.data.errors) && error.data.errors.length > 0) {
        error.data.errors.forEach(errorMsg => {
          toast.error(errorMsg);
        });
      } else {
        toast.error(error?.data?.message || 'Failed to add recipe');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteRecipeByAdmin(deleteId).unwrap();
      toast.success('Recipe deleted successfully');
      setDeleteId(null);
      setDeleteConflict(null);
    } catch (error) {
      if (error?.status === 409 && error?.data?.details) {
        setDeleteConflict({
          recipeTitle: allRecipes.find((r) => r.recipe_id === deleteId)?.title,
          ...error.data.details
        });
      } else {
        toast.error(error?.data?.message || 'Failed to delete recipe');
        setDeleteConflict(null);
      }
    }
  };

  const handleEditSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('note', values.note || '');
      formData.append('prep_time', values.prep_time);
      formData.append('cook_time', values.cook_time);
      formData.append('rest_time', values.rest_time || 0);
      formData.append('serving_size', values.serving_size);
      formData.append('category_id', values.category_id);
      if (values.sub_category_id) formData.append('sub_category_id', values.sub_category_id);
      formData.append('video_url', values.video_url || '');
      formData.append('meta_title', values.meta_title);
      formData.append('meta_description', values.meta_description);
      formData.append('slug', values.slug);
      formData.append('food_type', values.food_type);


      if (values.image instanceof File) {
        formData.append('image', values.image);
      } else {
        formData.append('keepExistingImage', 'true');
      }


      formData.append('keywords', JSON.stringify(values.keywords || []));
      formData.append('ingredients', JSON.stringify(values.ingredients || []));
      formData.append('recipe_instructions', JSON.stringify(values.recipe_instructions || []));


      const updatedRecipe = await updateRecipeByAdmin({ id: editId, inputData: formData }).unwrap();

      setAllRecipes(prev => prev.map(r => {
        if (r.recipe_id === editId) {
          return {
            ...r,
            title: values.title,
            image: updatedRecipe?.data?.image || r.image,
            category_name: categoryDropdownData?.data?.find(c => c.category_id === Number(values.category_id))?.name || r.category_name,
            sub_category_name: getAllSubCategories(categoryDropdownData?.data || [])?.find(sc => sc.sub_category_id === Number(values.sub_category_id))?.name || '',
            food_type: values.food_type,
            prep_time: values.prep_time,
            cook_time: values.cook_time,
            rest_time: values.rest_time,
            serving_size: values.serving_size,
            approved_date: updatedRecipe?.data?.approved_date || null
          };
        }
        return r;
      }));

      toast.success('Recipe updated successfully');


      setLastUpdatedRecipeId(editId);

      setEditId(null);
      resetForm();
    } catch (error) {
      if (error?.data?.errors && Array.isArray(error.data.errors) && error.data.errors.length > 0) {
        error.data.errors.forEach(errorMsg => {
          toast.error(errorMsg);
        });
      } else {
        toast.error(error?.data?.message || 'Failed to update recipe');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBadgeUpdate = async (newBadge) => {
    if (!badgeDialogRecipeId) return;

    try {
      await updateRecipeBadge({ id: badgeDialogRecipeId, badge: newBadge || '' }).unwrap();

      setAllRecipes(prev => prev.map(r => {
        if (r.recipe_id === badgeDialogRecipeId) {
          return { ...r, badge: newBadge };
        }
        return r;
      }));

      toast.success('Badge updated successfully');
      setBadgeDialogOpen(false);
      setBadgeDialogRecipeId(null);
      setBadgeDialogRecipeData(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update badge');
    }
  };


  const columnDefs = [
    {
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      width: 70,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
      pinned: 'left',
    },
    {
      headerName: 'Image',
      field: 'image',
      width: 100,
      cellRenderer: (params) => {
        const imgVal = (typeof params.value === 'string' ? params.value.trim() : '') || '';
        const imgUrl = imgVal && imgVal.toLowerCase() !== 'null' ? getImage(imgVal) : '';
        return imgUrl ? (
          <Box
            sx={{
              width: 72,
              aspectRatio: '16 / 9',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb',
              borderRadius: '4px'
            }}
          >
            <img
              src={imgUrl}
              alt={params.data.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        ) : (
          <span className="text-gray-400">No Image</span>
        );
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'YT Image',
      field: 'video_url',
      width: 120,
      cellRenderer: (params) => {
        const ytThumb = params.value
          ? (getYouTubeThumbnail(params.value)?.replace('/hqdefault.jpg', '/mqdefault.jpg') || '')
          : '';
        return ytThumb ? (
          <Box
            sx={{
              width: 72,
              aspectRatio: '16 / 9',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb',
              borderRadius: '4px'
            }}
          >
            <img
              src={ytThumb}
              alt="YT Thumbnail"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'Title',
      field: 'title',
      flex: 1,
      minWidth: 300,
      cellStyle: { display: 'flex', alignItems: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'Category',
      field: 'category_name',
      width: 150,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'Sub Category',
      field: 'sub_category_name',
      width: 150,
      cellRenderer: (params) => params.value || '-',
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'Food Type',
      field: 'food_type',
      width: 120,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        const color = params.value === 'veg' ? '#10b981' : params.value === 'egg' ? '#f59e0b' : '#ef4444';
        return (
          <Typography
            variant="body2"
            sx={{
              color,
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.7rem'
            }}
          >
            {params.value.replace('_', '-')}
          </Typography>
        );
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    ...(isAdmin || canPublish || canPublishAll ? [
      {
        headerName: 'Public Approved',
        field: 'public_approved',
        width: 130,
        cellRenderer: (params) => {
          const canModify = isAdmin || canPublishAll || Number(params.data.created_by) === Number(user?.user_id);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {params.data.is_admin_approved ? (
                <Switch
                  checked={!!params.value}
                  onChange={() => {
                    setPublicToggleItem(params.data);
                  }}
                  size="small"
                  color="success"
                  disabled={params.data.isLoading || !canModify || (!canPublish && !canPublishAll && !isAdmin)}
                />
              ) : (
                <span style={{ color: isDarkMode ? '#6b7280' : '#9ca3af' }}>-</span>
              )}
            </Box>
          );
        },
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
        headerClass: 'ag-header-center',
        checkboxSelection: selectionMode,
        headerCheckboxSelection: selectionMode,
      },
      {
        headerName: 'Approved Date',
        field: 'public_approved_time',
        width: 190,
        cellRenderer: (params) => {
          if (params.data && params.data.public_approved && params.data.public_approved_time) {
            const date = new Date(params.data.public_approved_time);
            return (
              <span style={{ color: isDarkMode ? '#fef08a' : '#2563eb', fontWeight: 500 }}>
                {date.toLocaleString(undefined, {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit', hour12: true
                })}
              </span>
            );
          }
          return '-';
        },
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
        headerClass: 'ag-header-center',
      }
    ] : []),
    ...(isAdmin ? [
      {
        headerName: 'Admin Approved',
        field: 'is_admin_approved',
        width: 130,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Switch
                checked={!!params.value}
                onChange={() => {
                  setAdminToggleItem(params.data);
                }}
                size="small"
                color="primary"
                disabled
              />
            </Box>
          );
        },
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
        headerClass: 'ag-header-center',
      }
    ] : []),
    {
      headerName: 'Admin Approved Time',
      field: 'admin_approved_time',
      width: 190,
      cellRenderer: (params) => {
        if (params.data && params.data.is_admin_approved && params.data.admin_approved_time) {
          const date = new Date(params.data.admin_approved_time);
          return (
            <span style={{ color: isDarkMode ? '#f9a8d4' : '#db2777', fontWeight: 500 }}>
              {date.toLocaleString(undefined, {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: true
              })}
            </span>
          );
        }
        return '-';
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'Created Date',
      field: 'created_at',
      width: 190,
      cellRenderer: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return (
            <span style={{ color: isDarkMode ? '#9ca3af' : '#4b5563', fontWeight: 500 }}>
              {date.toLocaleString(undefined, {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: true
              })}
            </span>
          );
        }
        return '-';
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'Updated Date',
      field: 'updated_at',
      width: 190,
      cellRenderer: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return (
            <span style={{ color: isDarkMode ? '#9ca3af' : '#4b5563', fontWeight: 500 }}>
              {date.toLocaleString(undefined, {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: true
              })}
            </span>
          );
        }
        return '-';
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    {
      headerName: 'Created By',
      field: 'created_by_name',
      width: 140,
      cellRenderer: (params) => (
        <span style={{ fontWeight: 500, color: isDarkMode ? '#9ca3af' : '#4b5563' }}>
          {params.value || '-'}
        </span>
      ),
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
    ...(showAnalyticsColumns ? [
      {
        headerName: 'Badge',
        field: 'badge',
        width: 100,
        cellRenderer: (params) => {
          if (!params.value) return '-';
          const badgeColors = {
            'Popular': '#ef4444',
            'Trending': '#3b82f6',
            'Beginner': '#10b981',
            'Quick': '#f59e0b'
          };
          const bgColor = badgeColors[params.value] || '#f97316';
          return (
            <Chip
              label={params.value}
              size="small"
              sx={{
                backgroundColor: bgColor,
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                height: '22px',
                borderRadius: 0,
                px: 0.5
              }}
            />
          );
        },
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
        headerClass: 'ag-header-center',
      },
      ...(canViewAnalytics ? [
        {
          headerName: 'Total Views',
          field: 'total_views',
          width: 120,
          cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
          headerClass: 'ag-header-center',
          cellRenderer: (p) => (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {p.value?.toLocaleString() || 0}
            </Typography>
          ),
        },
        {
          headerName: 'Views (24h)',
          field: 'views_last_24h',
          width: 120,
          cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
          headerClass: 'ag-header-center',
          cellRenderer: (p) => (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {p.value?.toLocaleString() || 0}
            </Typography>
          ),
        },
        {
          headerName: 'Views (7d)',
          field: 'views_last_7d',
          width: 120,
          cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
          headerClass: 'ag-header-center',
          cellRenderer: (p) => (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {p.value?.toLocaleString() || 0}
            </Typography>
          ),
        }
      ] : []),
      {
        headerName: 'Rank',
        field: 'view_rank',
        width: 70,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
        headerClass: 'ag-header-center',
        cellRenderer: (p) => (
          <Box sx={{
            bgcolor: p.value <= 3 ? (isDarkMode ? '#059669' : '#dcfce7') : 'transparent',
            color: p.value <= 3 ? (isDarkMode ? '#fff' : '#166534') : 'inherit',
            px: 1,
            py: 0,
            borderRadius: 0.5,
            fontWeight: 700,
            fontSize: '0.7rem',
            lineHeight: 1.2,
            border: p.value <= 3 ? 'none' : `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`
          }}>
            #{p.value || '-'}
          </Box>
        ),
      }
    ] : []),
    {
      headerName: 'Actions',
      width: canNotesList ? 240 : 210,
      cellRenderer: (params) => {
        const canModifyEdit = isAdmin || canUpdateAll || Number(params.data.created_by) === Number(user?.user_id);
        const canModifyDelete = isAdmin || canDeleteAll || Number(params.data.created_by) === Number(user?.user_id);
        return (
          <Box className="flex gap-2 justify-center items-center h-full">
            {canView && (
              <Tooltip title="View" arrow>
                <IconButton
                  size="small"
                  onClick={() => setViewId(params.data.recipe_id)}
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
            )}
            {canUpdate && canModifyEdit && (
              <Tooltip title="Edit" arrow>
                <IconButton
                  size="small"
                  onClick={() => navigate('/manage-recipes/edit/' + params.data.recipe_id, { state: { returnTo: location.search } })}
                  sx={{
                    color: '#7367f0',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(115,103,240,0.1)' : 'rgba(115,103,240,0.08)',
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && canModifyDelete && (
              <Tooltip title="Delete" arrow>
                <IconButton
                  size="small"
                  onClick={() => setDeleteId(params.data.recipe_id)}
                  sx={{
                    color: '#ea5455',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(234,84,85,0.1)' : 'rgba(234,84,85,0.08)',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canNotesList && (
              <IconButton
                onClick={() => setNoteRecipeId(params.data.recipe_id)}
                size="small"
                title="Notes"
                sx={{
                  color: isDarkMode ? '#f59e0b' : '#d97706',
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  border: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: isDarkMode ? '#fbbf24' : '#b45309',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <NoteAltOutlinedIcon fontSize="small" />
              </IconButton>
            )}
            {params.data.has_updates_after_pending_notes && (
              <IconButton
                size="small"
                title="Recipe has been updated since notes were added"
                disableRipple
                sx={{
                  color: isDarkMode ? '#10b981' : '#059669',
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  border: 'none',
                  cursor: 'default',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: isDarkMode ? '#34d399' : '#10b981',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <UpdateIcon fontSize="small" />
              </IconButton>
            )}
            {isAdmin && showAnalyticsColumns && (
              <IconButton
                onClick={() => {
                  setBadgeDialogRecipeId(params.data.recipe_id);
                  setBadgeDialogRecipeData(params.data);
                  setBadgeDialogOpen(true);
                }}
                size="small"
                title="Update Badge"
                sx={{
                  color: isDarkMode ? '#8b5cf6' : '#7c3aed',
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  border: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: isDarkMode ? '#a78bfa' : '#a855f7',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <EmojiEventsIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      headerClass: 'ag-header-center',
    },
  ];

  const defaultColDef = {
    sortable: true,
    resizable: true,
  };

  const filteredSubCategories = getAllSubCategories(categoryDropdownData?.data || [])
    .filter(sc => !category || sc.category_name === category);

  const sourceRecipes = allRecipes.length === 0 && data?.data?.length > 0 ? data.data : allRecipes;
  let displayedRecipes = sourceRecipes;
  if (viewFilterType && viewFilterValue !== '') {
    const numericVal = parseInt(viewFilterValue, 10);
    if (!Number.isNaN(numericVal)) {
      displayedRecipes = sourceRecipes.filter(r => {
        let v = 0;
        if (viewFilterType === 'total') v = Number(r.total_views || 0);
        else if (viewFilterType === 'views_24h') v = Number(r.views_24h || 0);
        else if (viewFilterType === 'views_7d') v = Number(r.views_7d || 0);
        switch (viewFilterOp) {
          case '<=': return v <= numericVal;
          case '<': return v < numericVal;
          case '=': return v === numericVal;
          case '>=': return v >= numericVal;
          case '>': return v > numericVal;
          default: return true;
        }
      });
    }
  }
  const hasNotesForRecipe = (recipe) =>
    (Array.isArray(recipe?.notes) && recipe.notes.length > 0) ||
    (typeof recipe?.notes_count === 'number' && recipe.notes_count > 0) ||
    !!recipe?.has_notes ||
    !!recipe?.has_pending_notes;
  const hasCommentAddedForRecipe = (recipe) =>
    (Array.isArray(recipe?.notes) && recipe.notes.length > 0) ||
    (typeof recipe?.notes_count === 'number' && recipe.notes_count > 0) ||
    !!recipe?.has_notes;
  const isMyRecipe = (recipe) => Number(recipe?.created_by) === Number(user?.user_id);
  const isPendingNotes = (recipe) => !!recipe?.has_pending_notes;
  // Completed is derived from current payload: has notes but not pending.
  const isCompletedNotes = (recipe) => hasNotesForRecipe(recipe) && !isPendingNotes(recipe);

  const recipesWithNotesCount = displayedRecipes.filter(hasNotesForRecipe).length;
  const myRecipesWithNotesCount = displayedRecipes.filter((recipe) => hasCommentAddedForRecipe(recipe) && isMyRecipe(recipe)).length;
  const totalPendingNotesCount = displayedRecipes.filter(isPendingNotes).length;
  const totalCompletedNotesCount = displayedRecipes.filter(isCompletedNotes).length;
  const myPendingNotesCount = displayedRecipes.filter((recipe) => isMyRecipe(recipe) && isPendingNotes(recipe)).length;
  const myCompletedNotesCount = displayedRecipes.filter((recipe) => isMyRecipe(recipe) && isCompletedNotes(recipe)).length;

  if (!canList && !isAdmin) {
    return <AccessDenied message="You do not have permission to access Recipes Management." />;
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
                className="flex flex-row justify-between items-start p-4 sm:p-5 border-b gap-4 flex-wrap"
                sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
            >
                <Box className="flex flex-col gap-1">
                    <Typography
                        variant="h5"
                        sx={{ 
                            fontWeight: 700, 
                            color: isDarkMode ? '#e2e8f0' : '#1e293b', 
                            letterSpacing: '0.5px',
                            fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}
                    >
                        {`${pagination.totalPages > 1 ? pagination.total : allRecipes.length} Recipes ${!isAdmin ? `| My Recipes: ${data?.myRecipeCount || 0} (${data?.myAdminApprovedCount || 0} Approved)` : `| Total Approved - ${data?.totalAdminApprovedCount || 0}`}`}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}
                    >
                        {isAdmin
                            ? `Recipes with notes: ${recipesWithNotesCount} | My notes: ${myRecipesWithNotesCount} | My Pending: ${myPendingNotesCount} | My Completed: ${myCompletedNotesCount} | Total Pending: ${totalPendingNotesCount} | Total Completed: ${totalCompletedNotesCount}`
                            : `My notes: ${myRecipesWithNotesCount} | My Pending: ${myPendingNotesCount} | My Completed: ${myCompletedNotesCount}`}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: { xs: 0, sm: 0 } }}>
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
                    {selectionMode && selectedRows.length > 0 && (
                        <Button
                            variant="contained"
                            onClick={() => setBulkApproveDialogOpen(true)}
                            sx={{
                                height: '38px',
                                textTransform: 'none',
                                px: 3,
                                fontSize: '15px',
                                bgcolor: '#10b981',
                                boxShadow: 'none',
                                '&:hover': { bgcolor: '#059669', boxShadow: 'none' },
                            }}
                        >
                            Make Public ({selectedRows.length})
                        </Button>
                    )}
                    {(isAdmin || canPublish || canPublishAll) && (
                        <Button
                            variant={selectionMode ? "contained" : "outlined"}
                            onClick={() => {
                                setSelectionMode(!selectionMode);
                                if (selectionMode) setSelectedRows([]);
                            }}
                            sx={{
                                height: '38px',
                                textTransform: 'none',
                                px: 3,
                                fontSize: '15px',
                                borderRadius: '4px',
                                bgcolor: selectionMode ? '#7367f0' : 'transparent',
                                color: selectionMode ? '#ffffff' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
                                borderColor: selectionMode ? 'transparent' : (isDarkMode ? '#404656' : '#d8d6de'),
                                boxShadow: 'none',
                                '&:hover': { 
                                    bgcolor: selectionMode ? '#5e50ee' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), 
                                    borderColor: selectionMode ? 'transparent' : (isDarkMode ? '#d0d2d6' : '#4b4b4b'),
                                    boxShadow: 'none' 
                                },
                            }}
                        >
                            {selectionMode ? "Cancel Selection" : "Selection Mode"}
                        </Button>
                    )}
                    {canCreate && (
                        <Button
                            variant="contained"
                            onClick={handleAddOpen}
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
            </Box>

            {/* ── Filters row ───────────────────────────────────────────── */}
            <Collapse in={showFilters}>
            <Box className="flex flex-col p-4 sm:p-5 gap-4">
                {/* Search and Refresh Row */}
                <Box className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full flex-wrap gap-3">
                    <Box className="flex items-center gap-2 flex-wrap">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search by title or keyword..."
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
                        <IconButton
                            onClick={() => refetch()}
                            disabled={isFetching}
                            sx={{
                                height: '38px',
                                width: '38px',
                                borderRadius: '4px',
                                backgroundColor: isDarkMode ? '#283046' : '#fff',
                                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                '&:hover': {
                                    backgroundColor: isDarkMode ? '#3b4253' : '#f3f2f7',
                                }
                            }}
                            title="Refresh List"
                        >
                            <RefreshIcon sx={{
                                fontSize: '1.2rem',
                                animation: isFetching ? 'spin 1s linear infinite' : 'none',
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' }
                                }
                            }} />
                        </IconButton>
                    </Box>
                </Box>


          <Box
            ref={filterRef}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
              gap: 2,
              width: '100%',
              alignItems: 'center',
              transition: 'all 0.3s ease-in-out',
              '& > *': { width: '100%', m: 0 }
            }}
          >
            <FormControl size="small" sx={{ minWidth: 250, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                options={categoryDropdownData?.data || []}
                getOptionLabel={(option) => option.name || ''}
                value={(categoryDropdownData?.data || []).find(cat => cat.name === category) || null}
                onChange={(_, newValue) => {
                  const catName = newValue ? newValue.name : '';
                  setCategory(catName);
                  setCategorySearchInput('');
                  setSubCategory('');
                  setSubCategorySearchInput('');
                  applyFilters({ category: catName, subCategory: '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Categories"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 220, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                disabled={filteredSubCategories.length === 0}
                options={filteredSubCategories}
                getOptionLabel={(option) => {
                  let label = option.name || '';
                  if (!category && option.category_name) {
                    label += ` (${option.category_name})`;
                  }
                  return label;
                }}
                value={filteredSubCategories.find(sc => sc.name === subCategory) || null}
                onChange={(_, newValue) => {
                  const scName = newValue ? newValue.name : '';
                  setSubCategory(scName);
                  setSubCategorySearchInput('');
                  applyFilters({ subCategory: scName });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Sub Categories"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                options={[{ label: 'Veg', value: 'veg' }, { label: 'Egg', value: 'egg' }, { label: 'Non-Veg', value: 'non_veg' }]}
                getOptionLabel={(option) => option.label || ''}
                value={[{ label: 'Veg', value: 'veg' }, { label: 'Egg', value: 'egg' }, { label: 'Non-Veg', value: 'non_veg' }].find(opt => opt.value === foodType) || null}
                onChange={(_, newValue) => {
                  const val = newValue ? newValue.value : '';
                  setFoodType(val);
                  applyFilters({ foodType: val });
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Food Types"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                options={[{ label: 'Approved', value: 'true' }, { label: 'Not Approved', value: 'false' }]}
                getOptionLabel={(option) => option.label || ''}
                value={[{ label: 'Approved', value: 'true' }, { label: 'Not Approved', value: 'false' }].find(opt => opt.value === publicApproved) || null}
                onChange={(_, newValue) => {
                  const val = newValue ? newValue.value : '';
                  setPublicApproved(val);
                  applyFilters({ publicApproved: val });
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Public Status"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                options={[{ label: 'Approved', value: 'true' }, { label: 'Not Approved', value: 'false' }]}
                getOptionLabel={(option) => option.label || ''}
                value={[{ label: 'Approved', value: 'true' }, { label: 'Not Approved', value: 'false' }].find(opt => opt.value === adminApproved) || null}
                onChange={(_, newValue) => {
                  const val = newValue ? newValue.value : '';
                  setAdminApproved(val);
                  applyFilters({ adminApproved: val });
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Admin Status"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                disabled={pendingNotesOnly || !canListAll}
                options={data?.uniqueCreators || []}
                getOptionLabel={(option) => option.name || ''}
                value={(data?.uniqueCreators || []).find(creator => creator.user_id === createdBy) || null}
                onChange={(_, newValue) => {
                  const val = newValue ? newValue.user_id : '';
                  setCreatedBy(val);
                  applyFilters({ createdBy: val });
                }}
                isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Creators"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                multiple
                size="small"
                limitTags={1}
                options={(keywordsData?.data || keywordsData || []).map(item => item.keyword || item.name)}
                value={keyword}
                onChange={(_, newValue) => {
                  setKeyword(newValue);
                  applyFilters({ keyword: newValue.join(',') });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Keywords"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        minHeight: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiChip-root': {
                    height: '24px',
                    margin: '2px',
                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)',
                    color: '#7367f0',
                    '& .MuiChip-deleteIcon': {
                        color: '#7367f0',
                        '&:hover': {
                            color: '#5e50ee'
                        }
                    }
                  }
                }}
              />
            </FormControl>

            <Box
              sx={{
                minWidth: 170,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                borderRadius: 0,
                backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
              }}
            >
              <FormControlLabel
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', color: isDarkMode ? '#e5e7eb' : '#374151', whiteSpace: 'nowrap' } }}
                control={
                  <Checkbox
                    size="small"
                    checked={pendingNotesOnly}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPendingNotesOnly(checked);
                      applyFilters({ pendingNotesOnly: checked });
                    }}
                    sx={{
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      p: 0.5,
                      mr: 0.5,
                      '&.Mui-checked': {
                        color: isDarkMode ? '#10b981' : '#059669',
                      },
                    }}
                  />
                }
                label="Noted Pending"
              />
            </Box>
            <Box
              sx={{
                minWidth: 170,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                borderRadius: 0,
                backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
              }}
            >
              <FormControlLabel
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', color: isDarkMode ? '#e5e7eb' : '#374151', whiteSpace: 'nowrap' } }}
                control={
                  <Checkbox
                    size="small"
                    checked={hasUpdatesAfterNotes}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasUpdatesAfterNotes(checked);
                      applyFilters({ hasUpdatesAfterNotes: checked });
                    }}
                    sx={{
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      p: 0.5,
                      mr: 0.5,
                      '&.Mui-checked': {
                        color: isDarkMode ? '#f59e0b' : '#d97706',
                      },
                    }}
                  />
                }
                label="Updated After Notes"
              />
            </Box>
            {canViewAnalytics && (
              <Box
                sx={{
                  minWidth: 170,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  borderRadius: 0,
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                }}
              >
                <FormControlLabel
                  sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', color: isDarkMode ? '#e5e7eb' : '#374151', whiteSpace: 'nowrap' } }}
                  control={
                    <Checkbox
                      size="small"
                      checked={showAnalyticsColumns}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShowAnalyticsColumns(checked);
                        applyFilters({ showAnalyticsColumns: checked });
                      }}
                      sx={{
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        p: 0.5,
                        mr: 0.5,
                        '&.Mui-checked': {
                          color: isDarkMode ? '#10b981' : '#059669',
                        },
                      }}
                    />
                  }
                  label="Show Analytics"
                />
              </Box>
            )}
            {canViewAnalytics && (
              <>
                <FormControl size="small" sx={{ minWidth: 160, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                options={[{ label: 'Latest Created', value: 'created_at' }, { label: 'Most Viewed (Total)', value: 'total_views' }, { label: 'Most Viewed (24h)', value: 'views_24h' }, { label: 'Most Viewed (7d)', value: 'views_7d' }]}
                getOptionLabel={(option) => option.label || ''}
                value={[{ label: 'Latest Created', value: 'created_at' }, { label: 'Most Viewed (Total)', value: 'total_views' }, { label: 'Most Viewed (24h)', value: 'views_24h' }, { label: 'Most Viewed (7d)', value: 'views_7d' }].find(opt => opt.value === sortBy) || null}
                onChange={(_, newValue) => {
                  const val = newValue ? newValue.value : '';
                  setSortBy(val);
                  applyFilters({ sortBy: val });
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Latest Created"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                options={[{ label: 'Total', value: 'total' }, { label: 'Last 24h', value: 'views_24h' }, { label: 'Last 7d', value: 'views_7d' }]}
                getOptionLabel={(option) => option.label || ''}
                value={[{ label: 'Total', value: 'total' }, { label: 'Last 24h', value: 'views_24h' }, { label: 'Last 7d', value: 'views_7d' }].find(opt => opt.value === viewFilterType) || null}
                onChange={(_, newValue) => {
                  const val = newValue ? newValue.value : '';
                  setViewFilterType(val);
                  applyFilters({ viewType: val });
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="View Type"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 110, flex: { xs: 1, sm: '0 1 auto' } }}>
              <Autocomplete
                size="small"
                options={[{ label: '<=', value: '<=' }, { label: '=', value: '=' }, { label: '>=', value: '>=' }, { label: '>', value: '>' }, { label: '<', value: '<' }]}
                getOptionLabel={(option) => option.label || ''}
                value={[{ label: '<=', value: '<=' }, { label: '=', value: '=' }, { label: '>=', value: '>=' }, { label: '>', value: '>' }, { label: '<', value: '<' }].find(opt => opt.value === viewFilterOp) || null}
                onChange={(_, newValue) => {
                  const val = newValue ? newValue.value : '';
                  setViewFilterOp(val);
                  applyFilters({ viewOp: val });
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Op"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '0 39px 0 0 !important',
                        height: 38,
                        ...dropdownSx,
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
                  '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                  '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                }}
              />
                </FormControl>
                <TextField
                  label="Views"
                  size="small"
                  type="number"
                  value={viewFilterValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setViewFilterValue(val);
                    applyFilters({ viewValue: val });
                  }}
                  sx={textFieldSx}
                />
              </>
            )}
            <TextField
              label="Public Date Range"
              size="small"
              value={formatRangeLabel(approvedRange)}
              onClick={(event) => setRangeAnchorEl(event.currentTarget)}
              inputProps={{ readOnly: true }}
              sx={textFieldSx}
            />
            <Popover
              open={!!rangeAnchorEl}
              anchorEl={rangeAnchorEl}
              onClose={() => setRangeAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, display: 'flex', gap: 1, flexDirection: 'column', backgroundColor: isDarkMode ? '#0f1724' : '#ffffff', color: isDarkMode ? '#e5e7eb' : 'inherit', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, minWidth: 220 }}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>From</Typography>
                      <DateCalendar
                        value={approvedFrom ? moment(approvedFrom) : null}
                        onChange={(newValue) => setApprovedFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: approvedFrom, rangeEnd: approvedTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>To</Typography>
                      <DateCalendar
                        value={approvedTo ? moment(approvedTo) : null}
                        onChange={(newValue) => setApprovedTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: approvedFrom, rangeEnd: approvedTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                  </Box>
                </LocalizationProvider>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => { setApprovedFrom(''); setApprovedTo(''); setApprovedRange(undefined); applyFilters({ approvedFrom: '', approvedTo: '' }); setRangeAnchorEl(null); }} sx={{ borderRadius: '4px', borderColor: 'rgba(234, 84, 85, 0.5)', color: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.1)', textTransform: 'none', '&:hover': { borderColor: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.2)' } }}>Clear</Button>
                  <Button size="small" variant="contained" onClick={() => { setApprovedRange((approvedFrom || approvedTo) ? { from: approvedFrom ? new Date(approvedFrom) : undefined, to: approvedTo ? new Date(approvedTo) : undefined } : undefined); applyFilters({ approvedFrom: approvedFrom || '', approvedTo: approvedTo || '' }); setRangeAnchorEl(null); }} sx={{ borderRadius: '4px', bgcolor: '#7367f0', boxShadow: 'none', textTransform: 'none', '&:hover': { bgcolor: '#5e50ee', boxShadow: 'none' } }}>Apply</Button>
                </Box>
              </Box>
            </Popover>

            <TextField
              label="Admin Date Range"
              size="small"
              value={formatRangeLabel(adminApprovedRange)}
              onClick={(event) => setAdminRangeAnchorEl(event.currentTarget)}
              inputProps={{ readOnly: true }}
              sx={textFieldSx}
            />
            <Popover
              open={!!adminRangeAnchorEl}
              anchorEl={adminRangeAnchorEl}
              onClose={() => setAdminRangeAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, display: 'flex', gap: 1, flexDirection: 'column', backgroundColor: isDarkMode ? '#0f1724' : '#ffffff', color: isDarkMode ? '#e5e7eb' : 'inherit', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, minWidth: 220 }}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>From</Typography>
                      <DateCalendar
                        value={adminApprovedFrom ? moment(adminApprovedFrom) : null}
                        onChange={(newValue) => setAdminApprovedFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: adminApprovedFrom, rangeEnd: adminApprovedTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>To</Typography>
                      <DateCalendar
                        value={adminApprovedTo ? moment(adminApprovedTo) : null}
                        onChange={(newValue) => setAdminApprovedTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: adminApprovedFrom, rangeEnd: adminApprovedTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                  </Box>
                </LocalizationProvider>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => { setAdminApprovedFrom(''); setAdminApprovedTo(''); setAdminApprovedRange(undefined); applyFilters({ adminApprovedFrom: '', adminApprovedTo: '' }); setAdminRangeAnchorEl(null); }} sx={{ borderRadius: '4px', borderColor: 'rgba(234, 84, 85, 0.5)', color: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.1)', textTransform: 'none', '&:hover': { borderColor: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.2)' } }}>Clear</Button>
                  <Button size="small" variant="contained" onClick={() => { setAdminApprovedRange((adminApprovedFrom || adminApprovedTo) ? { from: adminApprovedFrom ? new Date(adminApprovedFrom) : undefined, to: adminApprovedTo ? new Date(adminApprovedTo) : undefined } : undefined); applyFilters({ adminApprovedFrom: adminApprovedFrom || '', adminApprovedTo: adminApprovedTo || '' }); setAdminRangeAnchorEl(null); }} sx={{ borderRadius: '4px', bgcolor: '#7367f0', boxShadow: 'none', textTransform: 'none', '&:hover': { bgcolor: '#5e50ee', boxShadow: 'none' } }}>Apply</Button>
                </Box>
              </Box>
            </Popover>

            <TextField
              label="Created Date Range"
              size="small"
              value={formatRangeLabel(createdRange)}
              onClick={(event) => setCreatedRangeAnchorEl(event.currentTarget)}
              inputProps={{ readOnly: true }}
              sx={textFieldSx}
            />
            <Popover
              open={!!createdRangeAnchorEl}
              anchorEl={createdRangeAnchorEl}
              onClose={() => setCreatedRangeAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, display: 'flex', gap: 1, flexDirection: 'column', backgroundColor: isDarkMode ? '#0f1724' : '#ffffff', color: isDarkMode ? '#e5e7eb' : 'inherit', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, minWidth: 220 }}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>From</Typography>
                      <DateCalendar
                        value={createdFrom ? moment(createdFrom) : null}
                        onChange={(newValue) => setCreatedFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: createdFrom, rangeEnd: createdTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>To</Typography>
                      <DateCalendar
                        value={createdTo ? moment(createdTo) : null}
                        onChange={(newValue) => setCreatedTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: createdFrom, rangeEnd: createdTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                  </Box>
                </LocalizationProvider>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => { setCreatedFrom(''); setCreatedTo(''); setCreatedRange(undefined); applyFilters({ createdFrom: '', createdTo: '' }); setCreatedRangeAnchorEl(null); }} sx={{ borderRadius: '4px', borderColor: 'rgba(234, 84, 85, 0.5)', color: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.1)', textTransform: 'none', '&:hover': { borderColor: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.2)' } }}>Clear</Button>
                  <Button size="small" variant="contained" onClick={() => { setCreatedRange((createdFrom || createdTo) ? { from: createdFrom ? new Date(createdFrom) : undefined, to: createdTo ? new Date(createdTo) : undefined } : undefined); applyFilters({ createdFrom: createdFrom || '', createdTo: createdTo || '' }); setCreatedRangeAnchorEl(null); }} sx={{ borderRadius: '4px', bgcolor: '#7367f0', boxShadow: 'none', textTransform: 'none', '&:hover': { bgcolor: '#5e50ee', boxShadow: 'none' } }}>Apply</Button>
                </Box>
              </Box>
            </Popover>

            <TextField
              label="Updated Date Range"
              size="small"
              value={formatRangeLabel(updatedRange)}
              onClick={(event) => setUpdatedRangeAnchorEl(event.currentTarget)}
              inputProps={{ readOnly: true }}
              sx={textFieldSx}
            />
            <Popover
              open={!!updatedRangeAnchorEl}
              anchorEl={updatedRangeAnchorEl}
              onClose={() => setUpdatedRangeAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, display: 'flex', gap: 1, flexDirection: 'column', backgroundColor: isDarkMode ? '#0f1724' : '#ffffff', color: isDarkMode ? '#e5e7eb' : 'inherit', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, minWidth: 220 }}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>From</Typography>
                      <DateCalendar
                        value={updatedFrom ? moment(updatedFrom) : null}
                        onChange={(newValue) => setUpdatedFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: updatedFrom, rangeEnd: updatedTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>To</Typography>
                      <DateCalendar
                        value={updatedTo ? moment(updatedTo) : null}
                        onChange={(newValue) => setUpdatedTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slots={{ day: CustomPickerDay }}
                        slotProps={{ day: { rangeStart: updatedFrom, rangeEnd: updatedTo, isDarkMode } }}
                        sx={{
                          bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          '& .MuiPickerDay-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                          '& .MuiIconButton-root': { color: isDarkMode ? '#e5e7eb' : '#374151' },
                          '& .MuiDayCalendar-monthContainer': { position: 'relative' },
                          '& .MuiDayCalendar-weekContainer': { margin: 0, justifyContent: 'center' }
                        }}
                      />
                    </Box>
                  </Box>
                </LocalizationProvider>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => { setUpdatedFrom(''); setUpdatedTo(''); setUpdatedRange(undefined); applyFilters({ updatedFrom: '', updatedTo: '' }); setUpdatedRangeAnchorEl(null); }} sx={{ borderRadius: '4px', borderColor: 'rgba(234, 84, 85, 0.5)', color: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.1)', textTransform: 'none', '&:hover': { borderColor: '#ea5455', bgcolor: 'rgba(234, 84, 85, 0.2)' } }}>Clear</Button>
                  <Button size="small" variant="contained" onClick={() => { setUpdatedRange((updatedFrom || updatedTo) ? { from: updatedFrom ? new Date(updatedFrom) : undefined, to: updatedTo ? new Date(updatedTo) : undefined } : undefined); applyFilters({ updatedFrom: updatedFrom || '', updatedTo: updatedTo || '' }); setUpdatedRangeAnchorEl(null); }} sx={{ borderRadius: '4px', bgcolor: '#7367f0', boxShadow: 'none', textTransform: 'none', '&:hover': { bgcolor: '#5e50ee', boxShadow: 'none' } }}>Apply</Button>
                </Box>
              </Box>
            </Popover>


            <Box sx={{ display: 'flex', gap: 1, minWidth: '170px', height: '38px', flex: { xs: 1, sm: '0 1 auto' } }}>
              <Button
                aria-label="search filters"
                onClick={handleSearchClick}
                variant="contained"
                startIcon={<SearchIcon />}
                sx={{
                  borderRadius: '4px',
                  flex: 1,
                  textTransform: 'none',
                  bgcolor: '#7367f0',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#5e50ee',
                    boxShadow: 'none'
                  }
                }}
              >
                Search
              </Button>
              {(category || subCategory || publicApproved || adminApproved || viewFilterType || viewFilterOp || viewFilterValue || foodType || badge || approvedFrom || approvedTo || adminApprovedFrom || adminApprovedTo || createdFrom || createdTo || updatedFrom || updatedTo || search || createdBy || keyword?.length > 0 || pendingNotesOnly || hasUpdatesAfterNotes || showAnalyticsColumns || (sortBy && sortBy !== 'created_at')) && (
                <Button
                  aria-label="clear all filters"
                  onClick={handleClearFilters}
                  variant="outlined"
                  color="error"
                  sx={{
                    borderRadius: '4px',
                    flex: 1,
                    minWidth: '38px',
                    padding: 0,
                    textTransform: 'none',
                    color: isDarkMode ? '#ef4444' : '#dc2626',
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                    borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.5)',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                      borderColor: isDarkMode ? '#ef4444' : '#dc2626',
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </Button>
              )}
            </Box>
            </Box>
        </Box>
        </Collapse>

            {/* ── AG Grid ───────────────────────────────────────────────── */}
            <Box
                className={`${isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full`}
                sx={{
                    flex: 1,
                    width: '100%',
                    height: 'auto',
                    minHeight: 0,
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
                    '& .ag-pinned-left-cols-container': { backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderRight: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` },
                    '& .ag-pinned-left-header': { backgroundColor: isDarkMode ? '#283046' : '#f3f2f7', borderRight: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` },
                }}
            >
                
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
    <Table stickyHeader sx={{ minWidth: 1500, borderCollapse: 'separate', borderSpacing: 0 }}>
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
                    whiteSpace: 'nowrap'
                } 
            }}>
                <TableCell align="center" width={70}>#</TableCell>
                <TableCell align="center" width={100}>Image</TableCell>
                <TableCell align="center" width={120}>YT Image</TableCell>
                <TableCell sx={{ minWidth: 300 }}>Title</TableCell>
                <TableCell align="center" sx={{ minWidth: 200 }}>Category</TableCell>
                <TableCell align="center" sx={{ minWidth: 200 }}>Sub Category</TableCell>
                <TableCell align="center">Food Type</TableCell>
                {(isAdmin || canPublish || canPublishAll) && (
                    <>
                        <TableCell align="center">
                            {selectionMode && (
                                <Checkbox
                                    size="small"
                                    checked={displayedRecipes.length > 0 && selectedRows.length === displayedRecipes.filter(r => r.is_admin_approved && !r.public_approved).length}
                                    onChange={handleSelectAll}
                                    sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}
                                />
                            )}
                            Public Approved
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 190 }}>Approved Date</TableCell>
                    </>
                )}
                {isAdmin && (
                    <TableCell align="center">Admin Approved</TableCell>
                )}
                <TableCell align="center" sx={{ minWidth: 190 }}>Admin Approved Time</TableCell>
                <TableCell align="center" sx={{ minWidth: 190 }}>Created Date</TableCell>
                <TableCell align="center" sx={{ minWidth: 190 }}>Updated Date</TableCell>
                <TableCell align="center" sx={{ minWidth: 160 }}>Created By</TableCell>
                {showAnalyticsColumns && (
                    <>
                        <TableCell align="center">Badge</TableCell>
                        {canViewAnalytics && (
                            <>
                                <TableCell align="center">Total Views</TableCell>
                                <TableCell align="center">Views (24h)</TableCell>
                                <TableCell align="center">Views (7d)</TableCell>
                            </>
                        )}
                        <TableCell align="center">Rank</TableCell>
                    </>
                )}
                <TableCell align="center">Actions</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {isLoading || isFetching ? (
                <TableRow>
                    <TableCell colSpan={20} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                    </TableCell>
                </TableRow>
            ) : displayedRecipes.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={20} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                        <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            No recipes found
                        </Typography>
                    </TableCell>
                </TableRow>
            ) : (
                displayedRecipes.map((recipe, index) => {
                    const rowBgColor = recipe.has_pending_notes ? (isDarkMode ? 'rgba(253, 224, 71, 0.15)' : '#fef9c3') : 'transparent';
                    
                    const canModifyEdit = isAdmin || canUpdateAll || Number(recipe.created_by) === Number(user?.user_id);
                    const canModifyDelete = isAdmin || canDeleteAll || Number(recipe.created_by) === Number(user?.user_id);
                    const canModifyPublic = isAdmin || canPublishAll || Number(recipe.created_by) === Number(user?.user_id);

                    const foodTypeColor = recipe.food_type === 'veg' ? '#10b981' : recipe.food_type === 'egg' ? '#f59e0b' : '#ef4444';
                    
                    const badgeColors = {
                        'Popular': '#ef4444',
                        'Trending': '#3b82f6',
                        'Beginner': '#10b981',
                        'Quick': '#f59e0b'
                    };
                    const badgeColor = badgeColors[recipe.badge] || '#f97316';

                    return (
                        <TableRow 
                            key={recipe.recipe_id}
                            sx={{ 
                                backgroundColor: rowBgColor,
                                '&:hover': {
                                    backgroundColor: isDarkMode ? '#2f3851 !important' : '#f8f8f8 !important',
                                },
                                '& td': {
                                    borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                    py: 1,
                                    px: 2
                                }
                            }}
                        >
                            <TableCell align="center">{(page - 1) * limit + index + 1}</TableCell>
                            <TableCell align="center">
                                {recipe.image && recipe.image.toLowerCase() !== 'null' ? (
                                    <Box
                                        sx={{
                                            width: 72,
                                            aspectRatio: '16 / 9',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb',
                                            borderRadius: '4px',
                                            mx: 'auto'
                                        }}
                                    >
                                        <img src={getImage(recipe.image)} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    </Box>
                                ) : (
                                    <span className="text-gray-400">No Image</span>
                                )}
                            </TableCell>
                            <TableCell align="center">
                                {recipe.video_url && getYouTubeThumbnail(recipe.video_url) ? (
                                    <Box
                                        sx={{
                                            width: 72,
                                            aspectRatio: '16 / 9',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb',
                                            borderRadius: '4px',
                                            mx: 'auto'
                                        }}
                                    >
                                        <img src={getYouTubeThumbnail(recipe.video_url).replace('/hqdefault.jpg', '/mqdefault.jpg')} alt="YT Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    </Box>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </TableCell>
                            <TableCell>{recipe.title}</TableCell>
                            <TableCell align="center">{recipe.category_name}</TableCell>
                            <TableCell align="center">{recipe.sub_category_name || '-'}</TableCell>
                            <TableCell align="center">
                                {recipe.food_type ? (
                                    <Typography variant="body2" sx={{ color: foodTypeColor, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                        {recipe.food_type.replace('_', '-')}
                                    </Typography>
                                ) : '-'}
                            </TableCell>
                            
                            {(isAdmin || canPublish || canPublishAll) && (
                                <>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                            {selectionMode && recipe.is_admin_approved && !recipe.public_approved && (
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedRows.some(r => r.recipe_id === recipe.recipe_id)}
                                                    onChange={(e) => handleSelectRow(e, recipe)}
                                                    sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', p: 0, mr: 1 }}
                                                />
                                            )}
                                            {recipe.is_admin_approved ? (
                                                <Switch
                                                    checked={!!recipe.public_approved}
                                                    onChange={() => setPublicToggleItem(recipe)}
                                                    size="small"
                                                    color="success"
                                                    disabled={recipe.isLoading || !canModifyPublic || (!canPublish && !canPublishAll && !isAdmin)}
                                                />
                                            ) : (
                                                <span style={{ color: isDarkMode ? '#6b7280' : '#9ca3af' }}>-</span>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        {recipe.public_approved && recipe.public_approved_time ? (
                                            <span style={{ color: isDarkMode ? '#fef08a' : '#2563eb', fontWeight: 500 }}>
                                                {new Date(recipe.public_approved_time).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                </>
                            )}
                            
                            {isAdmin && (
                                <TableCell align="center">
                                    <Switch
                                        checked={!!recipe.is_admin_approved}
                                        onChange={() => setAdminToggleItem(recipe)}
                                        size="small"
                                        color="primary"
                                        disabled
                                    />
                                </TableCell>
                            )}
                            
                            <TableCell align="center">
                                {recipe.is_admin_approved && recipe.admin_approved_time ? (
                                    <span style={{ color: isDarkMode ? '#f9a8d4' : '#db2777', fontWeight: 500 }}>
                                        {new Date(recipe.admin_approved_time).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                ) : '-'}
                            </TableCell>
                            
                            <TableCell align="center">
                                {recipe.created_at ? (
                                    <span style={{ color: isDarkMode ? '#9ca3af' : '#4b5563', fontWeight: 500 }}>
                                        {new Date(recipe.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                ) : '-'}
                            </TableCell>
                            
                            <TableCell align="center">
                                {recipe.updated_at ? (
                                    <span style={{ color: isDarkMode ? '#9ca3af' : '#4b5563', fontWeight: 500 }}>
                                        {new Date(recipe.updated_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                ) : '-'}
                            </TableCell>
                            
                            <TableCell align="center">
                                <span style={{ fontWeight: 500, color: isDarkMode ? '#9ca3af' : '#4b5563' }}>
                                    {recipe.created_by_name || '-'}
                                </span>
                            </TableCell>
                            
                            {showAnalyticsColumns && (
                                <>
                                    <TableCell align="center">
                                        {recipe.badge ? (
                                            <Chip
                                                label={recipe.badge}
                                                size="small"
                                                sx={{ backgroundColor: badgeColor, color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', height: '22px', borderRadius: 0, px: 0.5 }}
                                            />
                                        ) : '-'}
                                    </TableCell>
                                    
                                    {canViewAnalytics && (
                                        <>
                                            <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600 }}>{recipe.total_views?.toLocaleString() || 0}</Typography></TableCell>
                                            <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600 }}>{recipe.views_last_24h?.toLocaleString() || 0}</Typography></TableCell>
                                            <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600 }}>{recipe.views_last_7d?.toLocaleString() || 0}</Typography></TableCell>
                                        </>
                                    )}
                                    
                                    <TableCell align="center">
                                        <Box sx={{
                                            bgcolor: recipe.view_rank <= 3 ? (isDarkMode ? '#059669' : '#dcfce7') : 'transparent',
                                            color: recipe.view_rank <= 3 ? (isDarkMode ? '#fff' : '#166534') : 'inherit',
                                            px: 1, py: 0, borderRadius: 0.5, fontWeight: 700, fontSize: '0.7rem', lineHeight: 1.2,
                                            border: recipe.view_rank <= 3 ? 'none' : `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                                            display: 'inline-block'
                                        }}>
                                            #{recipe.view_rank || '-'}
                                        </Box>
                                    </TableCell>
                                </>
                            )}
                            
                            <TableCell align="center">
                                <Box className="flex gap-2 justify-center items-center h-full">
                                    <ActionButtons
                                        onView={() => setViewId(recipe.recipe_id)}
                                        onEdit={() => navigate('/manage-recipes/edit/' + recipe.recipe_id, { state: { returnTo: location.search } })}
                                        onDelete={() => setDeleteId(recipe.recipe_id)}
                                        showView={canView}
                                        showEdit={canUpdate && canModifyEdit}
                                        showDelete={canDelete && canModifyDelete}
                                    />
                                    {canNotesList && (
                                        <IconButton
                                            onClick={() => setNoteRecipeId(recipe.recipe_id)}
                                            size="small"
                                            title="Notes"
                                            sx={{ color: isDarkMode ? '#f59e0b' : '#d97706', backgroundColor: 'transparent', borderRadius: 0, border: 'none', '&:hover': { color: isDarkMode ? '#fbbf24' : '#b45309' }, transition: 'all 0.3s ease' }}
                                        >
                                            <NoteAltOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    {recipe.has_updates_after_pending_notes && (
                                        <IconButton
                                            size="small"
                                            title="Recipe has been updated since notes were added"
                                            disableRipple
                                            sx={{ color: isDarkMode ? '#10b981' : '#059669', backgroundColor: 'transparent', borderRadius: 0, border: 'none', cursor: 'default', '&:hover': { color: isDarkMode ? '#34d399' : '#10b981' }, transition: 'all 0.3s ease' }}
                                        >
                                            <UpdateIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    {isAdmin && showAnalyticsColumns && (
                                        <IconButton
                                            onClick={() => {
                                                setBadgeDialogRecipeId(recipe.recipe_id);
                                                setBadgeDialogRecipeData(recipe);
                                                setBadgeDialogOpen(true);
                                            }}
                                            size="small"
                                            title="Update Badge"
                                            sx={{ color: isDarkMode ? '#8b5cf6' : '#7c3aed', backgroundColor: 'transparent', borderRadius: 0, border: 'none', '&:hover': { color: isDarkMode ? '#a78bfa' : '#a855f7' }, transition: 'all 0.3s ease' }}
                                        >
                                            <EmojiEventsIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    );
                })
            )}
        </TableBody>
    </Table>
</TableContainer>

            </Box>

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
                        getOptionLabel={(option) => String(option)}
                        options={[10, 25, 50, 100, 150, 200, 250, 300, 350]}
                        value={limit || 10}
                        onChange={(event, newValue) => {
                            if (newValue) {
                                handleLimitChange({ target: { value: Number(newValue) } });
                            }
                        }}
                        onInputChange={(event, newInputValue) => {
                            const parsed = Number(newInputValue);
                            if (!isNaN(parsed) && parsed > 0) {
                                handleLimitChange({ target: { value: parsed } });
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
                        Showing {Math.min((page - 1) * limit + 1, pagination.total || 0)} to {Math.min(page * limit, pagination.total || 0)} of {pagination.total || 0} entries
                    </Typography>
                </Box>

                <Pagination
                    count={pagination.totalPages || 1}
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

        




      {viewId && (() => {
        const viewData = viewRecipeData?.data;
        const canModifyEdit = isAdmin || canUpdateAll || Number(viewData?.created_by) === Number(user?.user_id);
        const canModifyDelete = isAdmin || canDeleteAll || Number(viewData?.created_by) === Number(user?.user_id);
      
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const selectable = displayedRecipes.filter(row => row.is_admin_approved && !row.public_approved);
      setSelectedRows(selectable);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (event, row) => {
    if (event.target.checked) {
      setSelectedRows(prev => [...prev, row]);
    } else {
      setSelectedRows(prev => prev.filter(r => r.recipe_id !== row.recipe_id));
    }
  };

  return (
          <ViewRecipeDialog
            open={!!viewId}
            onClose={() => setViewId(null)}
            isLoading={isViewLoading}
            data={viewData}
            onSuccess={() => {
              refetch();
              refetchViewRecipe();
            }}
            canViewAnalytics={canViewAnalytics}
            isAdmin={isAdmin}
            canPublish={canPublish}
            onPublicApprovedChange={async (recipeId, newValue) => {
              try {
                if (!canPublish && !canPublishAll && !isAdmin) {
                  toast.error('You do not have permission to update public approved status');
                  return false;
                }
                const response = await updateRecipePublicApprovedStatus({ id: recipeId, public_approved: newValue }).unwrap();
                setAllRecipes((prev) => prev.map((r) =>
                  r.recipe_id === recipeId
                    ? {
                      ...r,
                      public_approved: newValue,
                      public_approved_time: newValue ? response.public_approved_time : null
                    }
                    : r
                ));
                toast.success('Public approved status updated successfully');
                return true;
              } catch (error) {
                toast.error(error?.data?.message || 'Failed to update public approved status');
                return false;
              }
            }}
            onAdminApprovedChange={async (recipeId, newValue) => {
              try {
                if (!isAdmin) {
                  toast.error('Only admins can update admin approval status');
                  return false;
                }
                const response = await updateRecipeAdminApprovedStatus({ id: recipeId, is_admin_approved: newValue }).unwrap();
                setAllRecipes((prev) => prev.map((r) =>
                  r.recipe_id === recipeId
                    ? {
                      ...r,
                      is_admin_approved: newValue,
                      admin_approved_time: response.admin_approved_time,
                      public_approved: response.public_approved,
                      public_approved_time: response.public_approved_time
                    }
                    : r
                ));
                toast.success('Admin approval status updated successfully');
                return true;
              } catch (error) {
                toast.error(error?.data?.message || 'Failed to update admin approval status');
                return false;
              }
            }}
            onEdit={(recipeId) => { setViewId(null); navigate('/manage-recipes/edit/' + recipeId, { state: { returnTo: location.search } }); }}
            onDelete={(recipeId) => { setViewId(null); setDeleteId(recipeId); }}
            onViewNotes={(recipeId) => { setViewId(null); setNoteRecipeId(recipeId); }}
            canEdit={canUpdate && canModifyEdit}
            canDelete={canDelete && canModifyDelete}
            canViewNotes={canNotesList}
          />
        );
      })()}
      {deleteId && !deleteConflict && (
        <ConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Recipe"
          message={
            <>
              Are you sure you want to delete <strong>{allRecipes.find((r) => r.recipe_id === deleteId)?.title}</strong>?
            </>
          }
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
          loadingText="Deleting..."
          severity="error"
        />
      )}
      {deleteId && deleteConflict && (
        <Dialog
          open={!!deleteId}
          onClose={() => { setDeleteId(null); setDeleteConflict(null); }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' } }}
        >
          <DialogTitle className="flex items-center justify-between" sx={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Cannot Delete Recipe</Typography>
            <IconButton size="small" onClick={() => { setDeleteId(null); setDeleteConflict(null); }} sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: 4, pb: 3 }}>
            <Box className="flex flex-col gap-3">
              <Typography variant="body1" sx={{ color: '#ef4444', fontWeight: 500 }}>
                Cannot delete recipe "<strong>{deleteConflict.recipeTitle}</strong>" because it is currently in use:
              </Typography>
              <Box sx={{ pl: 2 }}>
                {deleteConflict.homeSections > 0 && (
                  <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#d1d5db' : '#4b5563' }}>
                    • Used in <strong>{deleteConflict.homeSections}</strong> home section{deleteConflict.homeSections === 1 ? '' : 's'}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                Please remove this recipe from all sections before deleting.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'center' }}>
            <Button
              onClick={() => { setDeleteId(null); setDeleteConflict(null); }}
              variant="outlined"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                color: isDarkMode ? '#d1d5db' : '#4b5563',
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                '&:hover': {
                  borderColor: isDarkMode ? '#6b7280' : '#9ca3af',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {noteRecipeId && (
        <RecipeNotesDialog
          open={!!noteRecipeId}
          onClose={() => setNoteRecipeId(null)}
          recipeId={noteRecipeId}
          recipeTitle={allRecipes.find(r => r.recipe_id === noteRecipeId)?.title}
          canAdd={canNotesAdd}
          canDeletePermission={canNotesDelete}
          canUpdateStatus={canNotesUpdateStatus}
        />
      )}
      {badgeDialogOpen && badgeDialogRecipeId && (
        <Dialog
          open={badgeDialogOpen}
          onClose={() => {
            setBadgeDialogOpen(false);
            setBadgeDialogRecipeId(null);
            setBadgeDialogRecipeData(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              color: isDarkMode ? '#f3f4f6' : '#000000',
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}` }}>
            Update Badge - {badgeDialogRecipeData?.title}
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
              Select a badge for this recipe:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {['Popular', 'Trending', 'Beginner', 'Quick'].map(badgeOption => (
                <Button
                  key={badgeOption}
                  variant={badgeDialogRecipeData?.badge === badgeOption ? 'contained' : 'outlined'}
                  onClick={() => handleBadgeUpdate(badgeOption)}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    py: 1,
                    backgroundColor: badgeDialogRecipeData?.badge === badgeOption
                      ? (badgeOption === 'Popular' ? '#ef4444' : badgeOption === 'Trending' ? '#3b82f6' : badgeOption === 'Beginner' ? '#10b981' : '#f59e0b')
                      : 'transparent',
                    color: badgeDialogRecipeData?.badge === badgeOption ? '#ffffff' : (isDarkMode ? '#d1d5db' : '#6b7280'),
                    borderColor: badgeOption === 'Popular' ? '#ef4444' : badgeOption === 'Trending' ? '#3b82f6' : badgeOption === 'Beginner' ? '#10b981' : '#f59e0b',
                    '&:hover': {
                      backgroundColor: badgeOption === 'Popular' ? '#ef4444' : badgeOption === 'Trending' ? '#3b82f6' : badgeOption === 'Beginner' ? '#10b981' : '#f59e0b',
                      color: '#ffffff',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: badgeOption === 'Popular' ? '#ef4444' : badgeOption === 'Trending' ? '#3b82f6' : badgeOption === 'Beginner' ? '#10b981' : '#f59e0b',
                      }}
                    />
                    {badgeOption}
                  </Box>
                </Button>
              ))}
              <Button
                variant={!badgeDialogRecipeData?.badge ? 'contained' : 'outlined'}
                onClick={() => handleBadgeUpdate(null)}
                fullWidth
                sx={{
                  textTransform: 'none',
                  py: 1,
                  backgroundColor: !badgeDialogRecipeData?.badge ? '#6b7280' : 'transparent',
                  color: !badgeDialogRecipeData?.badge ? '#ffffff' : (isDarkMode ? '#d1d5db' : '#6b7280'),
                  borderColor: '#6b7280',
                  '&:hover': {
                    backgroundColor: '#6b7280',
                    color: '#ffffff',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: '#6b7280',
                    }}
                  />
                  None
                </Box>
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, p: 2 }}>
            <Button
              onClick={() => {
                setBadgeDialogOpen(false);
                setBadgeDialogRecipeId(null);
                setBadgeDialogRecipeData(null);
              }}
              sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!publicToggleItem}
        onClose={() => setPublicToggleItem(null)}
        onConfirm={handlePublicApprovedStatusChange}
        title="Change Status"
        message={
          <>
            Are you sure you want to {publicToggleItem?.public_approved ? 'revoke' : 'grant'} public approval for the recipe <strong>{publicToggleItem?.title}</strong>?
          </>
        }
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isUpdatingPublicStatus}
        loadingText="Updating..."
        severity="primary"
      />

      <ConfirmDialog
        open={!!adminToggleItem}
        onClose={() => setAdminToggleItem(null)}
        onConfirm={handleAdminApprovedStatusChange}
        title="Change Status"
        message={
          <>
            Are you sure you want to {adminToggleItem?.is_admin_approved ? 'revoke' : 'grant'} admin approval for the recipe <strong>{adminToggleItem?.title}</strong>?
          </>
        }
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isUpdatingAdminStatus}
        loadingText="Updating..."
        severity="primary"
      />

      <ConfirmDialog
        open={bulkApproveDialogOpen}
        onClose={() => setBulkApproveDialogOpen(false)}
        onConfirm={handleBulkApprove}
        title="Bulk Approve Recipes"
        message={
          <>
            Are you sure you want to grant public approval for <strong>{selectedRows.length}</strong> selected recipe{selectedRows.length !== 1 ? 's' : ''}?
          </>
        }
        confirmText="Approve All"
        cancelText="Cancel"
        isLoading={isBulkApproving}
        loadingText="Approving..."
        severity="success"
      />

    </Box>
  );
};

function getAllSubCategories(categories) {
  return categories.flatMap(cat => (cat.sub_categories || []).map(sub => ({
    ...sub,
    category_id: cat.category_id,
    category_name: cat.name
  })));
}

export default Recipe;

